var info = require('../../static/info.json');
var champions = require('../../dragon/fr_fr/champion.json');
var champInfo = require(`../../class/v1/Champions/ChampionInfo`);

const CacheService = require('../Cache.Service');
var RequestManager = require(`./RequestManager`);
var SummonerDTO = require('../../class/v2/SummonerDTO');
var ChampionMasteryDTO = require('../../class/v2/ChampionMasteryDTO');

/*
    Cache configuration
*/
var ttSummonerInfo = 60 * 60 * 1 * 24; // cache for 1 Hour
var ttMasteriesInfo = 60 * 5; // cache for 1 mn (60 sec * 1 min)

var summonerCache = new CacheService(ttSummonerInfo); // Create a new cache service instance
var masteriesCache = new CacheService(ttMasteriesInfo); // Create a new cache service instance

module.exports = class LeagueChampionMasteries {

    constructor(queryString) {
        this.loadChampionInfo();

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }
        // Paramètre obligatoire
        this.summonerName = queryString.summonername;
        this.region = queryString.region;
        this.nbMasteries = (queryString.nb || 5);
    }

    getSummonerCacheKey() {
        return `${this.summonerName}-${this.region}`;
    }
    getMasteriesCacheKey() {
        return `ChampMasteries-${this.summonerName}-${this.region}-${this.nbMasteries}`
    }

    loadChampionInfo() {
        var champArr = [];
        for (var myKey in champions.data) {
            var champName = champions.data[myKey].name;
            var chamId = champions.data[myKey].key;

            var rotChamp = new champInfo();
            rotChamp.init(chamId, champName);

            champArr.push(rotChamp);
        }
        if (champArr && champArr.length > 0) {
            this.championList = champArr;
        }
    }

    // Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
    async querySummonerInfo(requestManager, result) {
        var data;
        var SummonerUrl = info.routes.v2.summoner.getBySummonerName.replace('{region}', this.region).replace('{summonerName}', this.summonerName);

        // Le SummonerInfo n'est pas présent dans la cache
        await requestManager.ExecuteRequest(SummonerUrl).then(function (res) {
            data = res;
        }, function (error) {
            if (typeof error.status !== "undefined" && error.status.status_code === 404) {
                if (error.status.message === "Data not found - summoner not found") {
                    // UseCase : Invocateur n'existe pas.
                    result.err = {
                        statusCode: '200-1',
                        statusMessage: "L'invocateur n'existe pas."
                    }
                } else {
                    result.err = {
                        statusCode: err.status.status_code,
                        statusMessage: error.status.message
                    }
                }
            } else {
                // error.code = 'ENOTFOUND'     -> mauvais serveur
                result.err = {
                    statusCode: '',
                    statusMessage: error.statusMessage
                }
            }
        });
        return data;
    }
    // Step 2 : Execution de la Query qui obtient les information sur la league
    async queryMasteriesInfo(requestManager, result, summonerId) {
        var data;
        // Obtenir l'information sur la queue    
        var leagueUrl = info.routes.v2.masteries.getChampionMasteriesBySummoner.replace('{region}', this.region).replace('{encryptedSummonerId}', summonerId);

        await requestManager.ExecuteRequest(leagueUrl).then(function (res) {
            if (res.length === 0) {
                // UseCase : Pas de données de league donc pas de classement
                result.err = {
                    statusCode: "200-1",
                    statusMessage: "Unranked"
                }
            } else {
                data = res;
            }
        }, function (error) {
            if (typeof error.message === "undefined") {
                result.err = {
                    statusCode: error.statusCode,
                    statusMessage: error.statusMessage
                }
            } else {
                result.err = {
                    statusCode: '',
                    statusMessage: error.message
                }
            }
        });

        var tmp = data.slice(0, this.nbMasteries);
        var champList = this.championList;
        var masteriesDTA = [];

        tmp.forEach(function (masteriesData) {
            var champion = champList.find(e => e.id === masteriesData.championId.toString());
            var masteries = new ChampionMasteryDTO();
            masteries.init(masteriesData, champion.championName);

            masteriesDTA.push(masteries);
        });

        return masteriesDTA;
    }

    // Requête principale
    async getChampionsMasteries() {
        var result = {
            "code": 0,
            "err": {}
        };
        var summonerInfo = new SummonerDTO(this);
        var requestManager = new RequestManager(this);
        var me = this;

        try {
            var key = this.getSummonerCacheKey();
            var SummonerData = await summonerCache.getAsyncB(key).then(function (sumData) {
                if (typeof sumData === "undefined") {
                    // Le data n'est pas présent on doit l'obtenir
                    var data = me.querySummonerInfo(requestManager, result);
                    // On associe le SummonerInfo dans la cache
                    summonerCache.setCacheValue(key, data);
                    return data;
                } else {
                    // L'information est présente dans la cache
                    return sumData;
                }
            });


            if (SummonerData || typeof SummonerData !== "undefined") {
                // TODO: Gérer le cas ou pas de data mais ERR
                summonerInfo.init(SummonerData);

                key = this.getMasteriesCacheKey();

                var masteriesData = await masteriesCache.getAsyncB(key).then(function (sumData) {
                    if (typeof sumData === "undefined") {
                        // Le data n'est pas présent on doit l'obtenir
                        var data = me.queryMasteriesInfo(requestManager, result, summonerInfo.getId);
                        // On associe le SummonerInfo dans la cache
                        masteriesCache.setCacheValue(key, data);
                        return data;
                    } else {
                        // L'information est présente dans la cache
                        return sumData;
                    }
                });

                if (masteriesData || typeof masteriesData !== "undefined") {
                    this.masteriesDTO = masteriesData;
                }

            }

            // On traite le Resut
            if (result && typeof result.err.statusCode === "undefined") {
                // Aucune erreur
                result.code = 200;
            } else if (result && result.err.statusCode === "200-1") {
                // Erreur normal (pas classé, invocateur n'Existe pas)
                result.code = 201;
            } else {
                result.code = 404;
            }

        } catch (ex) {
            result.code = -1;
            console.error(ex);
        }
        return result;
    }

    getReturnValue() {
        var returnValue = '';
    
        this.masteriesDTO.forEach(function (masteries) {
            if (returnValue.length > 0) { returnValue += " | " }

            returnValue += masteries.masterieInfo;
        });

        returnValue = returnValue.trimEnd();

        return returnValue.trim();
    }




   /* static validateQueryString(queryString) {
        var err = [];

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré-validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region, summonerName)");

        } else {
            if (typeof queryString.summonername === "undefined" || queryString.summonername.trim().length === 0) {
                err.push("Le paramètre 'summonerName' est obligatoire.");
            }
            if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                err.push("Le paramètre 'region' est obligatoire.");
            }
        }

        // https://developer.riotgames.com/getting-started.html
        //  Validating Calls (^[0-9\\p{L} _\\.]+$)
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Pour pseudo avec caractère accentué
        if (typeof queryString.summonername !== "undefined" && queryString.summonername.trim().length >= 0) {

            var arrUsernames = queryString.summonername.trim().split(";");
            arrUsernames.forEach(function myFunction(summonerName) {
                var re = new RegExp('^[0-9\u00C0-\u024F _.\\w]+$', 'giu');
                if (!re.test(summonerName)) {
                    err.push("Le paramètre 'summonerName' est invalide.");
                }
            });
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
    }*/

}