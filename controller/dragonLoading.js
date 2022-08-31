const path = require('path');
const CacheService = require('../module/Cache.Service');

const LeagueChampion = require('../entity/api/leagueChampion');
const { JSONFileReader, JSONFileExist } = require('../util/fileReader');

/*
    Cache configuration
*/
const cacheDelay = 60 * 60 * 24; // cache for 1 mn (60 sec * 60 min * 24)
const cacheService = new CacheService(cacheDelay); // Create a new cache service instance

const dragonLoading = class DragonLoading {
    _championData = null;

    async loadChampion(lang) {
        const self = this;
        return new Promise(async function (resolve, reject) {
            try {
                const key = self.getKeyName('champion', lang, 'dragon');
                const pathFile = path.join(__dirname, '/../static/dragon/', lang, '/champion.json');

                self._championData = await self.readFileCache(key, pathFile);

                return resolve(self._championData);
            } catch (ex) {
                console.error('An error occured during on dragonLoading.loadChampion');
                console.error(ex);
                reject(ex);
            }
        }).catch(err => {
            console.log(err);
            // reject(err);
        });
    }
    async convertToLeagueChampion(lang) {
        const self = this;
        return new Promise(async function (resolve) {
            const key = self.getKeyName('champion', lang, 'bedyapi');
            self._leagueChampionData = await self.championConvertCache(key, self._championData);
            return resolve(self._leagueChampionData);

        }).catch(err => {
            console.err(err);
            // reject(err);
        });
    }

    // #region "CacheKey"
    getKeyName(type, lang, source) {
        return `dragonFile-${type}-${lang}-${source}`;
    }
    // #endregion

    /*
        Load on cache
    */
    async readFileCache(key, fileName) {
        const self = this;
        return new Promise(async function (resolve) {
            const cacheResult = await cacheService.getAsyncB(key).then(async function (cacheData) {
                try {
                    // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                    if (typeof cacheData === 'undefined' || !cacheData) {
                        const result = await self.readFile(fileName).then(readResult => {
                            cacheService.setCacheValue(key, readResult);
                            return readResult;
                        });

                        return result;
                    } else {
                        // L'information est présente dans la cache
                        return cacheData;
                    }
                } catch (ex) {
                    console.error(ex);
                }

            });

            resolve(cacheResult);
        });
    }
    async championConvertCache(key, championData) {
        return new Promise(async function (resolve, reject) {
            const cacheResult = await cacheService.getAsyncB(key).then(async function (cacheData) {
                // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                if (typeof cacheData === 'undefined') {
                    const champArr = [];
                    for (const myKey in championData.data) {
                        const champName = championData.data[myKey].name;
                        const chamId = championData.data[myKey].key;
                        const searchName = championData.data[myKey].id;
                        const imgInfo = championData.data[myKey].image;

                        const champion = new LeagueChampion();
                        champion.init(chamId, champName, searchName, imgInfo);

                        champArr.push(champion);
                    }

                    if (champArr && champArr.length > 0) {
                        cacheService.setCacheValue(key, champArr);
                        return champArr;
                    } else {
                        reject(champArr);
                    }
                } else {
                    // L'information est présente dans la cache
                    return cacheData;
                }
            });

            resolve(cacheResult);
        });
    }


    /*
        Loading Area
    */
    async readFile(pathFile) {
        let fileData;
        return new Promise(async function (resolve, reject) {
            try {
                await JSONFileExist(pathFile).then(exist => {
                    if (exist) {
                        JSONFileReader(pathFile).then(function (f) {
                            fileData = f;
                            return resolve(fileData);
                        });
                    }
                });

            } catch (ex) {
                console.error(`An error occured during on dragonLoading.readFile. (${pathFile})`);
                console.error(ex);
                reject(ex);
            }
            return reject('File doesn\'t exist');
        });
    }
};

module.exports = dragonLoading;