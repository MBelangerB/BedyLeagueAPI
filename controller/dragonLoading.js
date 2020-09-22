const path = require('path');
var CacheService = require('../module/Cache.Service');
var routeInfo = require('../static/info.json');

var LeagueChampion = require(`../entity/api/leagueChampion`);
const { JSONFileReader } = require('../util/fileReader');


/*
    Cache configuration
*/
var cacheDelay = 60 * 60 * 24; // cache for 1 mn (60 sec * 60 min * 24)
var cacheService = new CacheService(cacheDelay); // Create a new cache service instance

let dragonLoading = class DragonLoading {
    _championData = null

    constructor() {
    }
    async loadChampion(lang) {
        var self = this;
        return new Promise(async function (resolve, reject) {
            try {
                var key = self.getKeyName('champion', lang, 'dragon');
                var pathFile = path.join(__dirname, `/../static/dragon/`, lang, '/champion.json');

                self._championData = await self.readFileCache(key, pathFile);

                resolve(self._championData);
                return;
            } catch (ex) {
                console.error("An error occured during on dragonLoading.loadChampion")
                console.error(ex);
                reject(ex);
            }
        }).catch(err => {
            reject(err);
        });
    }
    async convertToLeagueChampion(lang) {
        var self = this;
        return new Promise(async function (resolve, reject) {
            var key = self.getKeyName('champion', lang, 'bedyapi');
            self._leagueChampionData = await self.championConvertCache(key, self._championData);
            resolve(self._leagueChampionData);
            return;
        }).catch(err => {
            console.err(err);
            reject(err);
        });
    }

    //#region "CacheKey"
    getKeyName(type, lang, source) {
        return `dragonFile-${type}-${lang}-${source}`;
    }
    //#endregion

    /*
        Load on cache
    */
    async readFileCache(key, fileName) {
        var self = this;
        return new Promise(async function (resolve, reject) {
            var cacheResult = await cacheService.getAsyncB(key).then(async function (cacheData) {
                // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                if (typeof cacheData === "undefined" || !cacheData) {
                    var result = await self.readFile(fileName).then(readResult => {
                        cacheService.setCacheValue(key, readResult);
                        return readResult;
                    });

                    return result;
                } else {
                    // L'information est présente dans la cache
                    return cacheData;
                }
            });

            resolve(cacheResult);
        });
    }
    async championConvertCache(key, championData) {
        var self = this;
        return new Promise(async function (resolve, reject) {
            var cacheResult = await cacheService.getAsyncB(key).then(async function (cacheData) {
                // Vérifie si les données sont déj0à en cache, si OUI on utilise la cache
                if (typeof cacheData === "undefined") {
                    var champArr = [];
                    for (var myKey in championData.data) {
                        var champName = championData.data[myKey].name;
                        var chamId = championData.data[myKey].key;
                        var searchName = championData.data[myKey].id;
                        var imgInfo = championData.data[myKey].image;

                        var champion = new LeagueChampion();
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
        var fileData;
        return new Promise(async function (resolve, reject) {
            try {
                await JSONFileReader(pathFile).then(function (f) {
                    fileData = f;
                });
                resolve(fileData)
                return;
            } catch (ex) {
                console.error(`An error occured during on dragonLoading.readFile. (${pathFile})`)
                console.error(ex);
                reject(ex);
            }
        });
    }
}

module.exports = dragonLoading;