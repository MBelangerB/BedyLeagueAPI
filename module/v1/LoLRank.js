const SummonerDTO = require('../../class/v1/SummonerDTO');
const SummonerLeague = require('../../class/v1/SummonerLeague');

const CacheService = require('./Cache.Service');
var ReqQuery = require(`./RiotQuery`);


var ttDTO = 60 * 60 * 1; // cache for 1 Hour
var ttlLeague = 60 * 1; // cache for 1 mn

var cache = new CacheService(ttDTO); // Create a new cache service instance
var LeagueCache = new CacheService(ttlLeague); // Create a new cache service instance




module.exports = class LoLRank {
    constructor(queryString) {
        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        this.summonerName = queryString.summonername;
        this.region = queryString.region;
        this.showLp = (process.env.showLP.toLocaleLowerCase() === "true");
        if (typeof queryString["lp"] !== "undefined") {
            this.showLp = (queryString.lp === "1")
        }

        this.series = (queryString.series || process.env.series || 'WL-');

        this.fullString = (process.env.fullString || false);
        if (typeof queryString["fullString"] !== "undefined") {
            this.fullString = (queryString.fullString === "1")
        }
        this.showWinRate = (process.env.showWinRate.toLocaleLowerCase() === "true");
        if (typeof queryString["winrate"] !== "undefined") {
            this.showWinRate = (queryString.winrate === "1")
        }

        this.queueType = process.env.queueType.toLocaleLowerCase();
        if (typeof queryString["queueType"] !== "undefined" && this.isValidQueueType(queryString["queueType"])) {
            this.queueType = queryString["queueType"].toLocaleLowerCase();
        }
        if (typeof this.queueType === "undefined" || this.isValidQueueType(this.queueType) === false) {
            this.queueType = "solo5"
        }

        var DTO = new SummonerDTO(this);
        var reqQuery = new ReqQuery(this.region, this.summonerName);

        this.ReqQuery = reqQuery;
        this.summmonerDTO = DTO;
        this.summmonerLeague = [];
    }



    // https://developer.riotgames.com/ranked-info.html
    // Valider si la queue est accepté
    isValidQueueType(type) {
        var valid = false;
        switch (type) {
            case 'solo5':
                valid = true;
                break;
            case 'tft':
                valid = true;
                break;
            case 'team5':
            case 'team3':
            case 'flex5':
                valid = false;
                break
        }
        return valid;
    }

    castQueueType() {
        if (typeof this.queueType === "undefined" || this.isValidQueueType(this.queueType) === false) {
            this.queueType = "solo5"
        }
        var riotQueue = "";

        switch (this.queueType) {
            case 'solo5':
                riotQueue = "RANKED_SOLO_5x5";
                break;
            case 'tft':
                riotQueue = "RANKED_TFT";
                break;
            case 'team5':
            case 'team3':
            case 'flex5':
                riotQueue = "NA";
                break;
        }

        return riotQueue
    }



    getCacheKey() {
        return `${this.summonerName}-${this.region}`; // -${this.queueType}`
    }


    // Step 1
    async GetCacheDTO() {
        // https://medium.com/@danielsternlicht/caching-like-a-boss-in-nodejs-9bccbbc71b9b
        var key = this.getCacheKey();
        var cacheInfo = cache.getAsync(key);
        var result;

        if (cacheInfo === null) {
            // TODO: Gérer cas erreur ne pas mettre en cache
            var resultCode = await this.ReqQuery.getSummonerData();
            if (resultCode === 200) {
                cacheInfo = await this.ReqQuery.summonerDTO;
            }

            if (!cacheInfo || typeof cacheInfo === 'undefined') {
                result = this.ReqQuery.result.err;

            } else {
                this.summmonerDTO.init(cacheInfo.name, cacheInfo.id, cacheInfo.accountId, cacheInfo.summonerLevel,
                                        cacheInfo.profileIconId, this.region);

                cache.setCacheValue(key, cacheInfo);
            }
        } else {
            cacheInfo.then(function (value) {
                result = value;
            })
         
        }

        return (result || cacheInfo);
    }

    // Step 2
    async getCacheLeague() {
        var key = this.getCacheKey();
        var cacheInfo = LeagueCache.getAsync(key);
        var result;

        var tmpCacheInfo;

        if (cacheInfo === null) {
            // TODO: Gérer cas erreur ne pas mettre en cache
            var resultCode = await this.ReqQuery.getSummonerLeague();
            if (resultCode === 200) {
                cacheInfo = await this.ReqQuery.summonerLeague;
            } else if (resultCode === 404) {
                // NoData
                return {
                    "statusCode": 404,
                    "statusMessage": "Une erreur est survenu"
                }
            }

            if (!cacheInfo || typeof cacheInfo === 'undefined') {
                // Err = undefined
                if (this.ReqQuery.result && ! this.ReqQuery.result.err) {
                    result = this.ReqQuery.result.err;
                } else {
                    result = ""
                }
               

            } else {
                tmpCacheInfo = [];

                cacheInfo.forEach(league => {
                    var sLeague = new SummonerLeague();
                    sLeague.init(league.queueType, league.hotStreak, league.wins,
                        league.losses, league.rank, league.tier, league.leaguePoints);

                    if (typeof league.miniSeries !== "undefined") {
                        sLeague.initSeries(league.miniSeries)
                    }
                    tmpCacheInfo.push(sLeague)
                });
                this.summmonerLeague = tmpCacheInfo;
    
               LeagueCache.setCacheValue(key, tmpCacheInfo);  
            }

        } else {
            cacheInfo.then(function (value) {
                result = value;
            })
        }

        return (result || tmpCacheInfo || cacheInfo);
    }

 
    getReturnValue(type) {
        var returnValue = '';

        var league = this.summmonerLeague.find(league => league.queueType === type);

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
    
    
            if (this.fullString === "true") {
                returnValue = `${this.summonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate}`;
            } else {
                returnValue = `${rankTiers}${leaguePt}${series}${winRate}`
            }
        }
   

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
            err.push("Paramètres marquant / missing parameters (region/summonerName)");
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
        if (typeof queryString.summonername !== "undefined" && queryString.summonername.trim().length >= 0) {
            // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
            // Pour pseudo avec caractère accentué
            var re = new RegExp('^[0-9\u00C0-\u024F _.\\w]+$', 'giu');
            var summonerName = queryString.summonername;
            if (!re.test(summonerName)) {
                err.push("Le paramètre 'summonerName' est invalide.");
            }
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
    }

}