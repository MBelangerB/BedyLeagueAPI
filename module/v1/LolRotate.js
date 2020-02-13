var champions = require('../../static/fr_fr/champion.json');
var champInfo = require(`../../class/v1/Champions/ChampionInfo`);

var CacheService = require('../Cache.Service');
var ReqQuery = require(`./RiotQuery`);

var cacheTimer = 60 * 60 * 1; // cache for 1 Hour
var cache = new CacheService(cacheTimer); // Create a new cache service instance



module.exports = class LoLRotate {
    constructor(queryString) {
        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        this.region = queryString.region;

        // Prepare DATA
        this.rotateData = {
            "freeChampionIds": [],
            "freeChampionIdsForNewPlayers": [],
            "freeChampion": [],
            "freeChampionForNewPlayers": []
        }

        var reqQuery = new ReqQuery(this.region, "");
        this.ReqQuery = reqQuery;
    }

    getCacheKey() {
        return `freeRotate-${this.region}`;
    }


    // Step 1
    async GetCacheRotate() {
        var key = this.getCacheKey();
        var cacheInfo = cache.getAsync(key);
        var result;

        if (cacheInfo === null) {
            // TODO: Gérer cas erreur ne pas mettre en cache
            var resultCode = await this.ReqQuery.getRotateData();
            if (resultCode === 200) {
                cacheInfo = await this.ReqQuery.rotateDTO;
            }

            if (!cacheInfo || typeof cacheInfo === 'undefined') {
                result = this.ReqQuery.result.err;

            } else {
                cache.setCacheValue(key, cacheInfo);
            }
        } else {
            cacheInfo.then(function (value) {
                result = value;
            })

        }

        return (result || cacheInfo);
    }
    setCacheRotate(cache) {
        if (typeof cache !== "undefined") {
            this.rotateData = cache;
        }
    }


    getReturnValue() {
        var returnValue = '';

        var freeChamp = [];
        this.rotateData.freeChampionIds.forEach(function (championId) {
            var arrFound = Object.keys(champions.data).filter(function (key) {
                return champions.data[key].key == championId;

                // to cast back from an array of keys to the object, with just the passing ones
            }).reduce(function (obj, key) {
                obj[championId] = champions.data[key];
                return obj;
            }, {});;

            var rotChamp = new champInfo(); 
            rotChamp.init(championId, arrFound[championId].name);
            freeChamp.push(rotChamp);
        });

        freeChamp.sort(function (a, b) {
            return a.championName.localeCompare(b.championName);
        });

        this.rotateData.freeChampion = freeChamp;
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


