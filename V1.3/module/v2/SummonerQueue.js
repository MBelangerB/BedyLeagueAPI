var info = require('../../static/info.json');
var RequestManager = require(`./RequestManager`);
const CacheService = require('../Cache.Service');

var SummonerDTO = require('../../class/v2/SummonerDTO');
var staticFunction = require('../../static/staticFunction');

var profileIconDta = require('../../dragon/fr_fr/profileicon.json');
var riotUserInfoDTO = require('../../class/riotUserInfoDTO');

/*
    Cache configuration
*/
var ttSummonerInfo = 60 * 60 * 1 * 24; // cache for 1 Hour
var ttLeagueInfo = 60 * 1; // cache for 1 mn (60 sec * 1 min)

var summonerCache = new CacheService(ttSummonerInfo); // Create a new cache service instance
var LeagueCache = new CacheService(ttLeagueInfo); // Create a new cache service instance

class SummonerQueue {
    constructor(queryString) {
        /*
        var regionData = this.getMappingRegionToLeagueQueue();
        var calledRegion = regionData[queryString.region];
        */


        // Paramètre obligatoire
        this.summonerName = queryString.summonername;
        this.region = queryString.region;
        this.getAll = (queryString.all || "0");
        this.summonerId = queryString.summonerId;

        this.getJson = ((queryString.json === "1") || (queryString.json === true));

        // Paramètre facultatif
        this.showLp = (process.env.showLP.toLocaleLowerCase() === "true");
        if (typeof queryString["lp"] !== "undefined") {
            this.showLp = (queryString.lp === "1")
        }
        this.series = (queryString.series || process.env.series || 'WL-');

        this.fullString = (process.env.fullString || false);
        if (typeof queryString["fullString"] !== "undefined") {
            this.fullString = (queryString.fullstring === "1")
        }

        this.showWinRate = (process.env.showWinRate.toLocaleLowerCase() === "true");
        if (typeof queryString["winrate"] !== "undefined") {
            this.showWinRate = (queryString.winrate === "1")
        }

        this.queueType = process.env.queueType.toLocaleLowerCase();

        if (typeof queryString["queueType"] !== "undefined" && staticFunction.isValidQueueType(queryString["queueType"])) {
            this.queueType = queryString["queueType"].toLocaleLowerCase();
        }
        if (typeof this.queueType === "undefined" || staticFunction.isValidQueueType(this.queueType) === false) {
            this.queueType = "solo5"
        }

    }

    //#region "CacheKey"
    getSummonerCacheKey() {
        return `${this.summonerName}-${this.region}`;
    }
    getLeagueCacheKey() {
        return `${this.summonerName}-${this.region}-${this.queueType}`
    }
    //#endregion

    //#region "Casting"
    getMappingRegionToLeagueQueue() {
        return {
            'EUW': 'EUW1',
            'EUW1': 'EUW1',
            'NA': 'NA1',
            'NA1': 'NA1'
        };
    }
    //#endregion

    // Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
    async querySummonerInfo(requestManager, result) {
        var data;

        var regionData = this.getMappingRegionToLeagueQueue();
        var calledRegion = regionData[this.region];

        var SummonerUrl = info.routes.v2.summoner.getBySummonerName.replace('{region}', calledRegion).replace('{summonerName}', this.summonerName);
        if (this.queueType === "tft") {
            SummonerUrl = info.routes.v2.summoner.getTFTBySummonerName.replace('{region}', calledRegion).replace('{summonerName}', this.summonerName);
        }

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
    async queryLeagueInfo(requestManager, result, summonerId) { 
        var data;

        var regionData = this.getMappingRegionToLeagueQueue();
        var calledRegion = regionData[this.region];

        // Obtenir l'information sur la queue        
        var leagueUrl = info.routes.v2.league.getLeagueEntriesForSummoner.replace('{region}', calledRegion).replace('{encryptedSummonerId}', summonerId);
        if (this.queueType === "tft") {
            leagueUrl = info.routes.v2.league.getTFTLeagueEntriesForSummoner.replace('{region}', calledRegion).replace('{encryptedSummonerId}', summonerId);
        }

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
        return data;
    }


    // Requête secondaire (InsertUser) (Plus utilisé)
    async getLeagueSummoner() {
        var result = {
            "code": 0,
            "err": {}
        };
        var summonerInfo = new SummonerDTO(this);
        var requestManager = new RequestManager(this);
        var me = this;

        try {
            var key = this.getSummonerCacheKey();
            var SummonerData = await summonerCache.getAsyncB(key).then(async function (sumData) {
                if (typeof sumData === "undefined") {
                    // Le data n'est pas présent on doit l'obtenir
                    var data = await me.querySummonerInfo(requestManager, result);
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

                // Préparation du Data
                var riotUser = new riotUserInfoDTO();
                riotUser.initDTO(SummonerData, this.region);

                // On traite le Resut
                if (riotUser) {
                    // Aucune erreur
                    this.userInfo = riotUser;
                    result.code = 200;
                    result.data = riotUser;
                } else {
                    result.code = 404;
                }
                //  RiotUserInfoDTO
            } else {
                result.err = {
                    statusCode: '400',
                    statusMessage: "Erreur! Aucun résultat n'as été trouvé."
                }
            }

        } catch (ex) {
            result.code = -1;
            console.error(ex);
        }
        return result;
    }

    // Requête principale (/RANK)
    async getSummonerInfo() {
        var result = {
            "code": 0,
            "err": {}
        };
        var summonerInfo = new SummonerDTO(this);
        var requestManager = new RequestManager(this);
        var me = this;

        try {
            var key = this.getSummonerCacheKey();
            if (this.summonerId && this.summonerId.length > 0) {
                SummonerData = {
                    "id": this.summonerId
                }
            } else {

                var SummonerData = await summonerCache.getAsyncB(key).then(async function (sumData) {
                    if (typeof sumData === "undefined") {
                        // Le data n'est pas présent on doit l'obtenir
                        var data = await me.querySummonerInfo(requestManager, result);
                        // On associe le SummonerInfo dans la cache
                        summonerCache.setCacheValue(key, data);
                        return data;
                    } else {
                        // L'information est présente dans la cache
                        return sumData;
                    }
                });
            }


            if (SummonerData || typeof SummonerData !== "undefined") {
                // TODO: Gérer le cas ou pas de data mais ERR
                summonerInfo.init(SummonerData);

                key = this.getLeagueCacheKey();

                var leagueData = await LeagueCache.getAsyncB(key).then(async function (sumData) {
                    if (typeof sumData === "undefined") {
                        // Le data n'est pas présent on doit l'obtenir
                        var data = await me.queryLeagueInfo(requestManager, result, summonerInfo.getId);

                        // On associe le SummonerInfo dans la cache
                        LeagueCache.setCacheValue(key, data);
                        return data;
                    } else {
                        // L'information est présente dans la cache
                        return sumData;
                    }
                });

                
                if (leagueData || typeof leagueData !== "undefined") {
                    // On initialise les queues dans SUmmonerInfo
                    summonerInfo.initQueue(leagueData);
                }
            }

            // On traite le Resut
            if (result && typeof result.err.statusCode === "undefined") {
                // Aucune erreur
                this.SummonerDTO = summonerInfo;
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

    //#region "Get League Data"

    getRatio() {
        var rates = (this.wins / (this.wins + this.losses) * 100);
        return parseFloat(rates).toFixed(1);
    }

    getTiersRank() {
        return `${this.tier} ${this.rank}`;
    }

    getLeaguePoint() {
        return ` (${this.leaguePoints} LP)`;
    }

    getSeries(charSerie, extendsSerie = false) {
        if (this.series.enabled) {
            var cWin = charSerie[0]; // W
            var cLoose = charSerie[1]; // L
            var cPending = charSerie[2]; // N

            if (extendsSerie) {
                var series = `${this.series.progress}`;
                var result = [];
                for (var i = 0; i < series.length; i++) {
                    var char = series.charAt(i);
                    var color = "green";
                    switch(char.toUpperCase()) {
                        case 'W':
                            color = "green";
                            char = cWin;
                            break;
                        case 'L':
                            color = "red";
                            char = cLoose;
                            break;
                        case "N":
                            color = "gray"
                            char = cPending;
                            break;
                    }
                    result.push({
                        'value': char,
                        'color': color
                    })
                  }

                return result;
            } else {
                var series = ` [${this.series.progress}]`;
                series = series.replaceAll('L', cLoose).replaceAll('W', cWin).replaceAll('N', cPending);
                return series;
            }

       
        } else {
            return '';
        }
    }
    //#endregion

    getReturnValue(type, extendsSeries = false) {
        var returnValue = '';

        try {
            var mappingQueue = SummonerDTO.getMappingQueueTypeToLeagueQueue();

            if (this.getJson) {
                var summoner = this.SummonerDTO;

                // Convertir le JSON en Array
                var iconEntries = Object.entries(profileIconDta.data);

                // Recherche la correspondance
                var fullIconDta = iconEntries.find(f => f[1].id === summoner.profileIconId);
                var iconUrl = '';
                if (fullIconDta) {
                    // TODO: Remlacer version
                    var fullIconId = fullIconDta[1].image.full;
                    iconUrl = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/profileicon/${fullIconId}`;
                }

                // Préparerle retour
                var data = {
                    "summoner": {
                        "name": this.summonerName,
                        "profileIcon": summoner.profileIconId,
                        "profileIconUrl": iconUrl,
                        "level": summoner.summonerLevel
                    },
                    "region": this.region,
                    "queue": []
                }


                this.SummonerDTO.Queues.forEach(n => {
                    var tier = {
                        "RiotQueueType": n.queueType,
                        "QueueType": Object.entries(mappingQueue).find(q => q[1] === n.queueType)[0], // queueEntrier.find(q => q[1] === n.queueType),
                        "tiers": n.tier,
                        "rank": n.rank,
                        "series": n.getSeries(this.series, extendsSeries),
                        "LP": n.getLeaguePoint(),
                        "stats": {
                            "ratio": n.getRatio(),
                            "W": n.wins,
                            "L": n.losses
                        }
                    }

                    data.queue.push(tier);
                });

                return data;
            } else {

                if (this.getAll && this.getAll === "1") {
                    var leagueSoloQ = this.SummonerDTO.Queues.find(league => league.queueType === mappingQueue["solo"]);
                    var leagueFlex = this.SummonerDTO.Queues.find(league => league.queueType === mappingQueue["flex"]);
                    var multiElo = false;

                    if (leagueSoloQ) {
                        var rankTiers = leagueSoloQ.getTiersRank();
                        var leaguePt = '';
                        var winRate = '';
                        var series = leagueSoloQ.getSeries(this.series);

                        if (this.showLp || this.showLp === "true") {
                            leaguePt = leagueSoloQ.getLeaguePoint();
                        }

                        if (this.showWinRate || this.showWinRate === "true") {
                            winRate = ` - ${leagueSoloQ.getRatio()} % (${leagueSoloQ.wins}W/${leagueSoloQ.losses}L)`;
                        }

                        if (this.fullString || this.fullString === "true") {
                            let CapSummonerName = `${this.summonerName}`;
                            CapSummonerName = CapSummonerName.charAt(0).toUpperCase() + CapSummonerName.slice(1);

                            returnValue = `${CapSummonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate} (SoloQ)`;
                        } else {
                            returnValue = `${rankTiers}${leaguePt}${series}${winRate} (SoloQ)`
                        }
                        multiElo = true;
                    }
                    if (leagueFlex) {
                        if (multiElo) {
                            returnValue += ` / `;
                        }
                        var rankTiers = leagueFlex.getTiersRank();
                        var leaguePt = '';
                        var winRate = '';
                        var series = leagueFlex.getSeries(this.series);

                        if (this.showLp || this.showLp === "true") {
                            leaguePt = leagueFlex.getLeaguePoint();
                        }

                        if (this.showWinRate || this.showWinRate === "true") {
                            winRate = ` - ${leagueFlex.getRatio()} % (${leagueFlex.wins}W/${leagueFlex.losses}L)`;
                        }

                        if (multiElo) {
                            returnValue += `${rankTiers}${leaguePt}${series}${winRate} (Flex)`
                        } else {

                            if (this.fullString || this.fullString === "true") {
                                let CapSummonerName = `${this.summonerName}`;
                                CapSummonerName = CapSummonerName.charAt(0).toUpperCase() + CapSummonerName.slice(1);

                                returnValue += `${CapSummonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate} (Flex)`;
                            } else {
                                returnValue += `${rankTiers}${leaguePt}${series}${winRate} (Flex)`
                            }
                        }
                    }


                } else {
                    var league = this.SummonerDTO.Queues.find(league => league.queueType === mappingQueue[type]);

                    if (league) {
                        var rankTiers = league.getTiersRank();
                        var leaguePt = '';
                        var winRate = '';
                        var series = league.getSeries(this.series);

                        if (this.showLp || this.showLp === "true") {
                            leaguePt = league.getLeaguePoint();
                        }

                        if (this.showWinRate || this.showWinRate === "true") {
                            winRate = ` - ${league.getRatio()} % (${league.wins}W/${league.losses}L)`;
                        }


                        if (this.fullString || this.fullString === "true") {
                            let CapSummonerName = `${this.summonerName}`;
                            CapSummonerName = CapSummonerName.charAt(0).toUpperCase() + CapSummonerName.slice(1);

                            returnValue = `${CapSummonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate}`;
                        } else {
                            returnValue = `${rankTiers}${leaguePt}${series}${winRate}`
                        }
                    }
                }
            }
        } catch (ex) {
            console.error(ex);
        }

        return returnValue.trim();
    }
}

module.exports = SummonerQueue;