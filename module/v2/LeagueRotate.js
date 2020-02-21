var info = require('../../static/info.json');
var champions = require('../../static/fr_fr/champion.json');

var champInfo = require(`../../class/v1/Champions/ChampionInfo`);
var RequestManager = require(`./RequestManager`);
const CacheService = require('../Cache.Service');

/*
    Cache configuration
*/
var ttLeagueRotate = 60 * 60 * 1 * 24; // cache for 1 Hour
var leagueRotateCache = new CacheService(ttLeagueRotate); // Create a new cache service instance

module.exports = class LeagueRotate {

    constructor(queryString) {
        this.loadChampionInfo();

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }
        this.region = queryString.region;
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

    getRotateCacheKey() {
        return `Rotate-${this.region}`;
    }

    // Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
    async queryLeagueRotate(requestManager, result) {
        var data;
        var url = info.routes.v2.getChampionRotate.replace('{region}', this.region);

        // Le SummonerInfo n'est pas présent dans la cache
        await requestManager.ExecuteRequest(url).then(function (res) {
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

        var resultData = {
            "freeChampionIds": data.freeChampionIds,
            "freeChampion": []
        }
        var champList = this.championList;
        var champArr = [];
        resultData.freeChampionIds.forEach(function (championId) {    
            var champion = champList.find(e => e.id === championId.toString());
            champArr.push(champion);
        });
        // Trie
        champArr.sort(function (a, b) {
            return a.championName.localeCompare(b.championName);
        });
        // Set Array
        resultData.freeChampion = champArr;

        return resultData;
    }

    async getLeagueRotate() {
        var result = {
            "code": 0,
            "err": {}
        };
        var requestManager = new RequestManager(this);
        var me = this;

        try {
            var key = this.getRotateCacheKey();
            var rotateData = await leagueRotateCache.getAsyncB(key).then(function (sumData) {
                if (typeof sumData === "undefined") {
                    // Le data n'est pas présent on doit l'obtenir
                    var data = me.queryLeagueRotate(requestManager, result);
                    // On associe le SummonerInfo dans la cache
                    leagueRotateCache.setCacheValue(key, data);
                    return data;
                } else {
                    // L'information est présente dans la cache
                    return sumData;
                }
            });

            // On traite le Resut
            if (result && typeof result.err.statusCode === "undefined") {
                // Aucune erreur
                this.rotateData = rotateData;
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

    // Return
    getReturnValue() {
        var returnValue = '';
    
        this.rotateData.freeChampion.forEach(function (champ) {
            if (returnValue.length > 0) { returnValue += " | " }
            returnValue += champ.getChampionName;
        });

        returnValue = returnValue.trimEnd();

        return returnValue.trim();
    }

      // Validation
      static validateQueryString(queryString) {
        var err = [];
        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region)");
        } else {
            if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                err.push("Le paramètre 'region' est obligatoire.");
            }
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
    }
}

