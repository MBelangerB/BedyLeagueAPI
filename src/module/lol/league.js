const RequestManager = require('../../util/RequestManager');

const CacheService = require('../Cache.Service');
const DragonLoading = require('../../controller/dragonLoading');

/*
    Cache configuration
    const ttl = 60 * 60 * 1; // cache for 1 Hour
*/
const rotateDelay = 60 * 60 * 1; // cache for 1 Hour
const rotateCache = new CacheService(rotateDelay); // Create a new cache service instance

module.exports = class ChampionRotations {

    constructor(params, url) {
        // Paramètre obligatoire
        this.region = params.region;
        this.url = url;
        // Paramètre facultatif
        this.getJson = ((params.json === 1) || (params.json === true));
    }

    getRotateCacheKey() {
        return `Rotate-${this.region}`;
    }

    /**
     * Step 1 : Execution de la Query qui obtient les informations sur la rotation actuel
     */
    async queryLeagueRotate(requestManager, result) {
        const url = this.url;

        // Le SummonerInfo n'est pas présent dans la cache
        const data = await requestManager.ExecuteTokenRequest(url, requestManager.TokenType.LOL).then(function (rotationResult) {
            return rotationResult;
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
        return data;
    }

    /**
     * Méthode principale
     */
    async getLeagueRotate() {
        const result = {
            'code': 0,
            'err': {},
        };

        const self = this;
        return new Promise(async function (resolve, reject) {
            try {
                const key = self.getRotateCacheKey();

                await rotateCache.getAsyncB(key).then(async function (resultData) {
                    // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                    if (typeof resultData === 'undefined') {
                        const data = await self.queryLeagueRotate(RequestManager, result);
                        if (data) {
                            rotateCache.setCacheValue(key, data);
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
                        self.currentRotation = await self.loadChampionData(resultQry);

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
     * Convertir la rotation reçu par Riot en LeagueChampion
     * @param {*} currentRotation
     */
    async loadChampionData(currentRotation) {
        const resultData = {
            'freeChampionIds': currentRotation.freeChampionIds,
            'freeChampion': [],
            'newPlayerChampionIds': currentRotation.freeChampionIdsForNewPlayers,
            'newPlayerChampion': [],
        };
        if (currentRotation) {
            const dragLoad = new DragonLoading();
            const championData = await dragLoad.loadChampion('fr_fr').then(async function (result) {
                if (result) {
                    return await dragLoad.convertToLeagueChampion('fr_fr');
                }
            });

            const champArr = [];
            const newChamp = [];

            resultData.freeChampionIds.forEach(function (championId) {
                try {
                    const champion = championData.find(e => e.id === championId.toString());
                    champArr.push(champion);
                } catch (ex) {
                    console.warn(`Cannot add ${championId} in ResultData. Champion doesn't exists. Try to update dragon file.`);
                }

            });
            resultData.newPlayerChampionIds.forEach(function (championId) {
                try {
                    const champion = championData.find(e => e.id === championId.toString());
                    newChamp.push(champion);
                } catch (ex) {
                    console.warn(`Cannot add ${championId} in ResultData. Champion doesn't exists. Try to update dragon file.`);
                }
            });

            // Trie
            champArr.sort(function (a, b) {
                return a.championName.localeCompare(b.championName);
            });
            newChamp.sort(function (a, b) {
                return a.championName.localeCompare(b.championName);
            });

            // Set Array
            resultData.freeChampion = champArr;
            resultData.newPlayerChampion = newChamp;
        }
        return resultData;
    }


    // Return
    async getReturnValue() {
        let returnValue = '';

        const currentRotation = this.currentRotation;
        const jsonReturn = this.getJson;

        return new Promise(async function (resolve) {
            if (jsonReturn) {
                returnValue = {
                    'free': [],
                    'rookie': [],
                };

                currentRotation.freeChampion.forEach(function (champ) {
                    returnValue.free.push(champ);
                });
                currentRotation.newPlayerChampion.forEach(function (champ) {
                    returnValue.rookie.push(champ);
                });

                resolve(returnValue);

            } else {

                currentRotation.freeChampion.forEach(function (champ) {
                    if (returnValue.length > 0) { returnValue += ' | '; }
                    returnValue += champ.getChampionName();
                });

                returnValue = returnValue.trimEnd();

                resolve(returnValue.trim());
            }
        });

    }

};

