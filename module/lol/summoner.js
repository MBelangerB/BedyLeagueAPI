var RequestManager = require(`../../util/RequestManager`);
var routeInfo = require('../../static/info.json');

const CacheService = require('../Cache.Service');

const SummonerDTO = require('../../entity/riot/Summoner-v4/summonerDTO');
const AccountDTO = require('../../entity/riot/Account-v1/AccountDto')

/*
    Cache configuration
    const ttl = 60 * 60 * 1; // cache for 1 Hour
*/
var summonerInfoDelay = 60 * 60 * 1 // cache for 1 Hour
var accountInfoDelay = 60 * 60 * 1 // cache for 1 Hour

var summonerCache = new CacheService(summonerInfoDelay); // Create a new cache service instance
var accountCache = new CacheService(accountInfoDelay); // Create a new cache service instance

module.exports = {
    SummonerInfo: class SummonerInfo {
        constructor(params) {
            // Paramètre obligatoire
            this.summonerName = (params.summonername || params.summonerName);
            this.params = params;

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

        getAccountCacheKey() {
            return `AccountInfo-${this.gameName}-${this.tagLine}-${this.region}`;
        }
        getSummonerCacheKey() {
            return `SummonerInfo-${this.gameName}-${this.tagLine}-${this.region}`;
        }

        // Todo Rename
        getUrlBySummonerName(summonerName, region, queueType) {
            if (!summonerName) { summonerName = this.summonerName; }
            if (!region) { region = this.region; }
            if (!queueType) { queueType = this.queueType; }

            // if (this.accountInfo != null) {
                let baseUrl =  routeInfo.lol.routes.summoner.v4.getByPuuid;
                if (queueType === "tft") {
                    baseUrl = routeInfo.lol.routes.tft_summoner.v1.getByPuuid;
                }
                baseUrl = baseUrl.replace("{encryptedPUUID}", this.accountInfo.puuid);

            // }

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

            var key = this.getAccountCacheKey(true);
            var self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await accountCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === "undefined") {
                            var data = await self._queryAccountInfo(RequestManager, result);
                            if (data && data.err == null) { // && (!data.statusCode || data.statusCode != "200")) {
                                accountCache.setCacheValue(key, data);
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

            var key = this.getSummonerCacheKey();
            var self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await summonerCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === "undefined") {
                            var data = await self._querySummonerInfo(RequestManager, result);
                            if (data && data.err == null) {
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
            let accountInfo = this.accountInfo;
            let jsonReturn = this.getJson;

            return new Promise(async function (resolve, reject) {
                if (jsonReturn) {
                    let data = {
                        account: accountInfo,
                        summoner: summonerInfo
                    }
                    resolve(data);

                } else {
                    returnValue = `${accountInfo.gameName} (Niv. ${summonerInfo.summonerLevel})`;
                    returnValue = returnValue.trimEnd();

                    resolve(returnValue.trim());
                }
            });

        }
    },
}

