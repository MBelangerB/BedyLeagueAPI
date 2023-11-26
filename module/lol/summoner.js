var RequestManager = require(`../../util/RequestManager`);
var routeInfo = require('../../static/info.json');

const CacheService = require('../Cache.Service');
const DragonLoading = require('../../controller/dragonLoading');

const SummonerDTO = require('../../entity/riot/Summoner-v4/summonerDTO');
const ChampionMasteryDTO = require('../../entity/riot/Champion-Mastery-v4/ChampionMasteryDTO');
const AccountDTO = require('../../entity/riot/Account-v1/AccountDto')

/*
    Cache configuration
    const ttl = 60 * 60 * 1; // cache for 1 Hour
*/
var masteriesDelay = 60 * 30; // cache for Secs * Min * Hour
var summonerInfoDelay = 60 * 60 * 1 // cache for 1 Hour

var masteriesCache = new CacheService(masteriesDelay); // Create a new cache service instance
var summonerCache = new CacheService(summonerInfoDelay); // Create a new cache service instance


module.exports = {
    SummonerInfo: class SummonerInfo {
        constructor(params, getAccount = false) {
            // Paramètre obligatoire
            this.summonerName = (params.summonername || params.summonerName);
            // this.summonerParam = this.summonerName;
            this.tagLine = (params.tagLine || params.tagline);
            this.gameName = (params.gameName || params.gamename);
            
            this.region = params.region;
            this.globalRegion = params.globalRegion;
            this.queueType = params.queuetype;
            this.version = params.version;

            this.gameType = RequestManager.TokenType.LOL;
            if (this.queueType?.toLowerCase() === "tft") {
                this.gameType = RequestManager.TokenType.TFT;
            }

            // Paramètre facultatif
            this.getJson = ((params.json === 1) || (params.json === true));
        }

        getCacheKey(isAccount = false) {
            if (isAccount) {
                return `AccountInfo-${this.summonerName}-${this.region}`;
            } else {
                return `SummonerInfo-${this.summonerName}-${this.region}-${this.queueType}`;
            }        
        }

        getUrlBySummonerName(summonerName, region, queueType) {
            if (!summonerName) { summonerName = this.summonerName; }
            if (!region) { region = this.region; }
            if (!queueType) { queueType = this.queueType; }

            let baseUrl = routeInfo.lol.routes.summoner.v4.getBySummonerName;
            if (queueType === "tft") {
                baseUrl = routeInfo.lol.routes.tft_summoner.v1.getBySummonerName;
            }

            if (this.version == "2" && this.accountInfo != null) {
                baseUrl = routeInfo.lol.routes.summoner.v4.getByPuuid;
                if (queueType === "tft") {
                    baseUrl = routeInfo.lol.routes.tft_summoner.v1.getByPuuid;
                }
                baseUrl = baseUrl.replace("{puuid}", this.accountInfo.puuid);

            } else {          
                baseUrl = baseUrl.replace("{summonerName}", summonerName);
            }
            baseUrl = baseUrl.replace("{region}", region);

            return baseUrl;
        }

         getAccountUrlBySummonerDetails(gameName, tagLine, globalRegion) {
            if (!gameName) { gameName = this.gameName; }
            if (!tagLine) { tagLine = this.tagLine; }
            if (!globalRegion) { globalRegion = this.globalRegion; }

            let baseUrl = routeInfo.lol.routes.account.v1.getRiotIdByGameNameAndTagLine;
            baseUrl = baseUrl.replace("{gameName}", gameName);
            baseUrl = baseUrl.replace("{tagLine}", tagLine);
            baseUrl = baseUrl.replace("{GlobalRegion}", globalRegion);

            return baseUrl;
         }

        /**
         * Get SummonerInfo
         * @param {*} requestManager 
         * @param {*} result 
         * @returns 
         */
        async _querySummonerInfo(requestManager, result) {
            try {
                var data = await requestManager.ExecuteTokenRequest(this.getUrlBySummonerName(), this.gameType).then(function (summonerDTO) {
                    return summonerDTO;
                }, function (error) {
                    if (error.response) {
                        result.err = {
                            statusCode: error.response.status,
                            statusMessage: error.response.statusText,
                            stack: error.stack
                        }
                    } else {
                        result.err = {
                            statusCode: 404,
                            statusMessage: error.message,
                            stack: error.stack
                        }
                    }

                    return result;
                });

            } catch (ex) {
                console.error(ex);
                res.send(ex);
            }
            return data;
        }

        /**
         * Get AccountInfo
         * @param {*} requestManager 
         * @param {*} result 
         * @returns 
         */
        async _queryAccountInfo(requestManager, result) {
            try {
                // Le SummonerInfo n'est pas présent dans la cache
                var data = await requestManager.ExecuteTokenRequest(this.getAccountUrlBySummonerDetails(), this.gameType).then(function (accountDTO) {
                    return accountDTO;
                }, function (error) {
                    if (error.response) {
                        result.err = {
                            statusCode: error.response.status,
                            statusMessage: error.response.statusText,
                            stack: error.stack
                        }
                    } else {
                        result.err = {
                            statusCode: 404,
                            statusMessage: error.message,
                            stack: error.stack
                        }
                    }
 
                    return result;
                });

            } catch (ex) {
                console.error(ex);
                res.send(ex);
            }
            return data;
        }


        /**
         * 20 nov 2023
         * Méthode Principale, obtenir AccountINfo
         */
        async getAccountInfo() {
            var result = {
                "code": 0,
                "err": {}
            };
            // Step 1 : Si Version = 2 alors get AccountInfo

            this.accountInfo = new AccountDTO();

            var key = this.getCacheKey(true);
            var self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await summonerCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === "undefined") {
                            var data = await self._queryAccountInfo(RequestManager, result);
                            if (data) { // && (!data.statusCode || data.statusCode != "200")) {
                                summonerCache.setCacheValue(key, data);
                                return data;
                            } else {
                                reject(result);
                                return;
                            }
                        } else {
                            // L'information est présente dans la cache
                            return resultData;
                        }

                    }).then(async resultQry => {
                        // On traite le Resut
                        if (resultQry && typeof resultQry.err === "undefined") {
                            // On convertie le data
                            self.accountInfo.init(resultQry);
                            result.data = resultQry;
                            result.code = 200;

                        } else if (resultQry && typeof resultQry.err != "undefined" && resultQry.err.statusCode === "200-1") {
                            // Erreur normal (pas classé, invocateur n'Existe pas)
                            result.code = 201;

                        } else {
                            result.code = 404;
                        }

                    });
                    resolve(result);
                    return;

                } catch (ex) {
                    console.error(ex);

                    result.code = -1;
                    result.err.statusMessage = ex;

                    reject(result);
                    return;
                }
            });        
        }

        /**
         * Méthode principale
         */
        async getSummonerInfo() {
            var result = {
                "code": 0,
                "err": {}
            };
            this.summonerInfo = new SummonerDTO();

            var key = this.getCacheKey();
            var self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await summonerCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === "undefined") {
                            var data = await self._querySummonerInfo(RequestManager, result);
                            if (data) {
                                summonerCache.setCacheValue(key, data);
                                return data;
                            } else {
                                reject(result);
                                return;
                            }
                        } else {
                            // L'information est présente dans la cache
                            return resultData;
                        }

                    }).then(async resultQry => {
                        // On traite le Resut
                        if (resultQry && typeof resultQry.err === "undefined") {
                            // On convertie le data
                            self.summonerInfo.init(resultQry);
                            result.data = resultQry;
                            result.code = 200;

                        } else if (resultQry && typeof resultQry.err != "undefined" && resultQry.err.statusCode === "200-1") {
                            // Erreur normal (pas classé, invocateur n'Existe pas)
                            result.code = 201;

                        } else {
                            result.code = 404;
                        }

                    });
                    resolve(result);
                    return;

                } catch (ex) {
                    console.error(ex);

                    result.code = -1;
                    result.err.statusMessage = ex;

                    reject(result);
                    return;
                }
            });
        }

        // Return
        async getReturnValue() {
            var returnValue = '';

            let summonerInfo = this.summonerInfo;
            let jsonReturn = this.getJson;

            return new Promise(async function (resolve, reject) {
                if (jsonReturn) {
                    resolve(summonerInfo);

                } else {
                    returnValue = `${summonerInfo.name} (Niv. ${summonerInfo.summonerLevel})`;
                    returnValue = returnValue.trimEnd();

                    resolve(returnValue.trim());
                }
            });

        }
    },

    SummonerMasteries: class SummonerMasteries {

        constructor(params) {
            // Paramètre obligatoire
            this.summonerName = params.summonername;
            this.region = params.region;
            this.encryptedSummonerId = params.id;

            // Paramètre facultatif
            this.getJson = ((params.json === 1) || (params.json === true));
            this.nbMasteries = (params.nb || 5);
        }

        getCacheKey() {
            return `TopMasteries-${this.summonerName}-${this.region}`;
        }
        getUrlBySummonerName(encryptedSummonerId, region) {
            if (!encryptedSummonerId) { encryptedSummonerId = this.encryptedSummonerId; }
            if (!region) { region = this.region; }

            let baseUrl = routeInfo.lol.routes.championMastery.v4.getChampionMasteriesBySummoner;
            baseUrl = baseUrl.replace("{encryptedSummonerId}", encryptedSummonerId);
            baseUrl = baseUrl.replace("{region}", region);

            return baseUrl;
        }

        /**
         * Step 1 : 
         */
        async _querySummonerMasteries(requestManager, result) {
            try {
                // Le SummonerInfo n'est pas présent dans la cache
                var data = await requestManager.ExecuteTokenRequest(this.getUrlBySummonerName(), requestManager.TokenType.LOL).then(function (championMasteryDTO) {
                    return championMasteryDTO;
                }, function (error) {
                    if (error.response) {
                        result.err = {
                            statusCode: error.response.status,
                            statusMessage: error.response.statusText,
                            stack: error.stack
                        }
                    } else {
                        result.err = {
                            statusCode: 404,
                            statusMessage: error.message,
                            stack: error.stack
                        }
                    }

                    return result;
                });

            } catch (ex) {
                console.error(ex);
             //   res.send(ex);
            }
            return data;
        }


        /**
         * Méthode principale
         */
        async getSummonerMasteries() {
            var result = {
                "code": 0,
                "err": {}
            };
            this.summonerInfo = new SummonerDTO();

            var key = this.getCacheKey();
            var self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await masteriesCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === "undefined") {
                            var data = await self._querySummonerMasteries(RequestManager, result);
                            if (data) {
                                masteriesCache.setCacheValue(key, data);
                                return data;
                            } else {
                                reject(result);
                                return;
                            }
                        } else {
                            // L'information est présente dans la cache
                            return resultData;
                        }
                    }).then(async resultQry => {
                        // On traite le Resut
                        if (resultQry && typeof resultQry.err === "undefined") {
                            // On convertie le data
                            self.allSummonerMasteries = await self.loadChampionData(resultQry, self.nbMasteries);
                            result.code = 200;

                        } else if (resultQry && typeof resultQry.err != "undefined" && resultQry.err.statusCode === "200-1") {
                            // Erreur normal (pas classé, invocateur n'Existe pas)
                            result.code = 201;

                        } else {
                            result.code = 404;
                        }
                    });
                    resolve(result);
                    return;

                } catch (ex) {
                    console.error(ex);

                    result.code = -1;
                    result.err.statusMessage = ex;

                    reject(result);
                    return;
                }
            });
        }

        /**
         * Obtenir les informations sur les champions auxquelle appartient les masteries
         * @param {*} currentMasteries 
         */
        async loadChampionData(currentMasteries, nbMasteries) {
            if (currentMasteries) {
                var resultData = {
                    "sliceMasteries": [],
                    "championMasteries": []
                }
                let dragLoad = new DragonLoading();
                let championData = await dragLoad.loadChampion('fr_fr').then(async function (result) {
                    if (result) {
                        return await dragLoad.convertToLeagueChampion('fr_fr');
                    }
                });

                // Obtenir la liste des masteries du summoner en fonction du NbMasteries
                resultData.sliceMasteries = currentMasteries.slice(0, nbMasteries);

                let summonerMasteriesData = [];

                resultData.sliceMasteries.forEach(function (masteriesData) {
                    try {
                        let championMasteryDTO = new ChampionMasteryDTO(masteriesData);
                        // Obtenir le champion
                        var champion = championData.find(e => e.id === masteriesData.championId.toString());
                        championMasteryDTO.initChampion(champion);

                        summonerMasteriesData.push(championMasteryDTO);
                    } catch (ex) {
                        console.warn(`Cannot add ${masteriesData.championId} in summonerMasteriesData. Champion doesn't exists. Try to update dragon file.`)
                    }

                });

                resultData.championMasteries = summonerMasteriesData;
            }
            return resultData;
        }

        // Return
        async getReturnValue() {
            var returnValue = '';

            let allSummonerMasteries = this.allSummonerMasteries;
            let jsonReturn = this.getJson;

            return new Promise(async function (resolve, reject) {
                if (jsonReturn) {
                    resolve(allSummonerMasteries.championMasteries);

                } else {
                    allSummonerMasteries.championMasteries.forEach(function (champion) {
                        if (returnValue.length > 0) { returnValue += " | " }
            
                        returnValue += champion.getMasterieInfo();
                    });
            
                    returnValue = returnValue.trimEnd();

                    resolve(returnValue.trim());
                }
            });

        }

    }

}

