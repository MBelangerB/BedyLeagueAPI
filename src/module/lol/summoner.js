const RequestManager = require('../../util/RequestManager');
const routeInfo = require('../../static/info.json');

const CacheService = require('../Cache.Service');
const DragonLoading = require('../../controller/dragonLoading');

const SummonerDTO = require('../../entity/riot/Summoner-v4/summonerDTO');
const ChampionMasteryDTO = require('../../entity/riot/Champion-Mastery-v4/ChampionMasteryDTO');

/*
    Cache configuration
    const ttl = 60 * 60 * 1; // cache for 1 Hour
*/
const masteriesDelay = 60 * 30; // cache for Secs * Min * Hour
const summonerInfoDelay = 60 * 60 * 1; // cache for 1 Hour

const masteriesCache = new CacheService(masteriesDelay); // Create a new cache service instance
const summonerCache = new CacheService(summonerInfoDelay); // Create a new cache service instance


module.exports = {
    SummonerInfo: class SummonerInfo {
        constructor(params) {
            // Paramètre obligatoire
            this.summonerName = (params.summonername || params.summonerName);
            this.region = params.region;
            this.queueType = params.queuetype;

            this.gameType = RequestManager.TokenType.LOL;
            if (this.queueType?.toLowerCase() === 'tft') {
                this.gameType = RequestManager.TokenType.TFT;
            }

            // Paramètre facultatif
            this.getJson = ((params.json === 1) || (params.json === true));
        }

        //#region Cache
        getCacheKey() {
            return `SummonerInfo-${this.summonerName}-${this.region}-${this.queueType}`;
        }
        //#endregion

        /**
         * Build URL
         * @param {*} summonerName 
         * @param {*} region 
         * @param {*} queueType 
         * @returns {string} URL to call
         */
        getUrlBySummonerName(summonerName, region, queueType) {
            if (!summonerName) { summonerName = this.summonerName; }
            if (!region) { region = this.region; }
            if (!queueType) { queueType = this.queueType; }

            let baseUrl = routeInfo.lol.routes.summoner.v4.getBySummonerName;
            if (queueType === 'tft') {
                baseUrl = routeInfo.lol.routes.tft_summoner.v1.getBySummonerName;
            }
            baseUrl = baseUrl.replace('{summonerName}', summonerName);
            baseUrl = baseUrl.replace('{region}', region);

            return baseUrl;
        }

        /**
         * [PRIVATE] Call Riot API
         * @param {*} requestManager 
         * @param {*} result 
         * @returns 
         */
        async _querySummonerInfo(requestManager, result) {
            try {
                // Le SummonerInfo n'est pas présent dans la cache
                return await requestManager.ExecuteTokenRequest(this.getUrlBySummonerName(), this.gameType).then(function (summonerDTO) {
                    result.data = summonerDTO;
                    return result;

                }, function (error) {
                    // response
                    result.code = 400;
                    if (error && error.data) {
                        result.err = {
                            statusCode: error.data.status.status_code,
                            statusMessage: error.data.status.message,
                            stack:(error.stack || ''),
                        };      
                    } else if (error && error.status) {
                        result.err = {
                            statusCode: error.status,
                            statusMessage: error.statusText,
                            stack: (error.stack || ''),
                        };
                    } else {
                        result.err = {
                            statusCode: 404,
                            statusMessage: error.message,
                            stack: (error.stack || ''),
                        };
                    }

                    // If error we return result
                    return result;
                });

            } catch (ex) {
                console.error(ex);
                result.code = 400;
                result.err = {
                    statusCode: 400,
                    statusMessage: ex.message,
                    stack: '',
                };
                return result;
            }
        }

        /**
         * [PUBLIC] Main method
         * Check if summoner rank information exist in cache, if true and if data isn't expired then return cache data.
         * Else call RIOT API for obtains the rank
         * @returns 
         */
        async getSummonerInfo() {
            const result = {
                data: {},
                code: 200,
                err: null,
            };
            this.summonerInfo = new SummonerDTO();

            const key = this.getCacheKey();
            const self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await summonerCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === 'undefined') {
                            const summonerData = await self._querySummonerInfo(RequestManager, result);

                            // If we have DATA we add in cache
                            if (summonerData && summonerData.code == 200 && summonerData.data) {
                                summonerCache.setCacheValue(key, summonerData.data);
                                return summonerData.data;

                            } else {
                                reject(summonerData);
                                return summonerData;
                            }
                        } else {
                            // L'information est présente dans la cache
                            return resultData;
                        }

                    }).then(async resultQry => {
                        // If we have Summoner info we init SummonerDTO
                        if (resultQry && typeof resultQry.err === 'undefined') {
                            // On convertie le data
                            self.summonerInfo.init(resultQry);
                            result.data = resultQry;
                            result.code = 200;

                        } else if (resultQry && typeof resultQry.err != 'undefined' && resultQry.err.statusCode === '200-1') {
                            // Erreur normal (pas classé ou invocateur n'existe pas)
                            result.code = 201;

                        } else {
                            result.code = resultQry.err.statusCode;
                            result.message = resultQry.err.statusMessage;
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
            let returnValue = '';

            const summonerInfo = this.summonerInfo;
            const jsonReturn = this.getJson;

            return new Promise(async function (resolve) {
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
            baseUrl = baseUrl.replace('{encryptedSummonerId}', encryptedSummonerId);
            baseUrl = baseUrl.replace('{region}', region);

            return baseUrl;
        }

        /**
         * Step 1 :
         */
        async _querySummonerMasteries(requestManager, result) {
            let data;
            try {
                // Le SummonerInfo n'est pas présent dans la cache
                data = await requestManager.ExecuteTokenRequest(this.getUrlBySummonerName(), requestManager.TokenType.LOL).then(function (championMasteryDTO) {
                    return championMasteryDTO;
                }, function (error) {
                    if (error.response) {
                        result.err = {
                            statusCode: error.response.status,
                            statusMessage: error.response.statusText,
                            stack: error.stack,
                        };
                    } else {
                        result.err = {
                            statusCode: 404,
                            statusMessage: error.message,
                            stack: error.stack,
                        };
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
            const result = {
                'code': 0,
                'err': {},
            };
            this.summonerInfo = new SummonerDTO();

            const key = this.getCacheKey();
            const self = this;

            return new Promise(async function (resolve, reject) {
                try {
                    await masteriesCache.getAsyncB(key).then(async function (resultData) {
                        // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                        if (typeof resultData === 'undefined') {
                            const data = await self._querySummonerMasteries(RequestManager, result);
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
                        if (resultQry && typeof resultQry.err === 'undefined') {
                            // On convertie le data
                            self.allSummonerMasteries = await self.loadChampionData(resultQry, self.nbMasteries);
                            result.code = 200;

                        } else if (resultQry && typeof resultQry.err != 'undefined' && resultQry.err.statusCode === '200-1') {
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
            const resultData = {
                'sliceMasteries': [],
                'championMasteries': [],
            };
            if (currentMasteries) {

                const dragLoad = new DragonLoading();
                const championData = await dragLoad.loadChampion('fr_fr').then(async function (result) {
                    if (result) {
                        return await dragLoad.convertToLeagueChampion('fr_fr');
                    }
                });

                // Obtenir la liste des masteries du summoner en fonction du NbMasteries
                resultData.sliceMasteries = currentMasteries.slice(0, nbMasteries);

                const summonerMasteriesData = [];

                resultData.sliceMasteries.forEach(function (masteriesData) {
                    try {
                        const championMasteryDTO = new ChampionMasteryDTO(masteriesData);
                        // Obtenir le champion
                        const champion = championData.find(e => e.id === masteriesData.championId.toString());
                        championMasteryDTO.initChampion(champion);

                        summonerMasteriesData.push(championMasteryDTO);
                    } catch (ex) {
                        console.warn(`Cannot add ${masteriesData.championId} in summonerMasteriesData. Champion doesn't exists. Try to update dragon file.`);
                    }

                });

                resultData.championMasteries = summonerMasteriesData;
            }
            return resultData;
        }

        // Return
        async getReturnValue() {
            let returnValue = '';

            const allSummonerMasteries = this.allSummonerMasteries;
            const jsonReturn = this.getJson;

            return new Promise(async function (resolve, reject) {
                if (jsonReturn) {
                    resolve(allSummonerMasteries.championMasteries);

                } else {
                    allSummonerMasteries.championMasteries.forEach(function (champion) {
                        if (returnValue.length > 0) { returnValue += ' | '; }

                        returnValue += champion.getMasterieInfo();
                    });

                    returnValue = returnValue.trimEnd();

                    resolve(returnValue.trim());
                }
            });

        }

    },

};

