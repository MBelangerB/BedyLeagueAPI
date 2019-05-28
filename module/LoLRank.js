const SummonerDTO = require('../class/SummonerDTO');
const SummonerLeague = require('../class/SummonerLeague');
const CacheService = require('../module/Cache.Service');

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
        this.apiKey = (process.env.apiKey);
        this.fullString = (process.env.fullString || false);
        if (typeof queryString["fullString"] !== "undefined") {
            this.fullString = (queryString.fullString === "1")
        }
        this.showWinRate = (process.env.showWinRate.toLocaleLowerCase() === "true"); 
        if (typeof queryString["winrate"] !== "undefined") {
            this.showWinRate = (queryString.winrate === "1")
        }
 
        var DTO = new SummonerDTO(this);
        var League = new SummonerLeague();
        this.summmonerDTO = DTO;
        this.summmonerLeague = League;
    }

    getCacheKey() {
        return `${this.summonerName}-${this.region}`
    }


    async getCacheLeague() {
        var key = this.getCacheKey();
        var cacheInfo = LeagueCache.getAsync(key);
        var result;

        if (cacheInfo === null) {
            // TODO: Gérer cas erreur ne pas mettre en cache
            cacheInfo = await this.getSummonerLeague();
            if (typeof cacheInfo.statusCode !== 'undefined' && cacheInfo.statusCode !== 200) {

            } else {
                LeagueCache.setCacheValue(key, cacheInfo);
            }
        } else {
            cacheInfo.then(function (value) {
                result = value;
            })
        }

        return (result || cacheInfo);
    }

    async GetCacheDTO() {
        // https://medium.com/@danielsternlicht/caching-like-a-boss-in-nodejs-9bccbbc71b9b
        var key = this.getCacheKey();
        var cacheInfo = cache.getAsync(key);
        var result;

        // var a = this;

        if (cacheInfo === null) {
            // TODO: Gérer cas erreur ne pas mettre en cache
            cacheInfo = await this.getSummonerDTO();
            if (typeof cacheInfo.statusCode !== 'undefined' && cacheInfo.statusCode !== 200) {

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

    // Step 1
    async getSummonerDTO() {
        var dto;
        var err = {};
        await this.summmonerDTO.getDTO(this.summonerName, this.region, this.apiKey).then(function (result) {
            dto = result;
        }, function (error) {
            if (typeof error.message === "undefined") {
                // UseCase : Invocateur n'existe pas.
                if (error.statusMessage === "Not Found") {
                    err = {
                        statusCode: '200-1',
                        statusMessage: "L'invocateur n'existe pas."
                    }
                } else {
                    err = {
                        statusCode: error.statusCode,
                        statusMessage: error.statusMessage
                    }
                }
            } else {
                err = {
                    statusCode: '',
                    statusMessage: error.message
                }
            }
        });

        if (dto) {
            this.summmonerDTO.init(dto.name, dto.id, dto.accountId, dto.summonerLevel, dto.profileIconId, this.region);
            return this.summmonerDTO;
        } else {
            return err;
        }
    }

    // Step 2
    async getSummonerLeague() {
        var league;
        var err = {};
        await this.summmonerLeague.getLeagueInfo(this.summmonerDTO.id, this.region, this.apiKey).then(function (result) {
            if (result.length === 0) {
                // UseCase : Pas de données de league donc pas de classement
                err = {
                    statusCode: "200-1",
                    statusMessage: "Unranked"
                }
            } else {
                league = result[0];
            }
        }, function (error) {
            if (typeof error.message === "undefined") {
                err = {
                    statusCode: error.statusCode,
                    statusMessage: error.statusMessage
                }
            } else {
                err = {
                    statusCode: '',
                    statusMessage: error.message
                }
            }

        });

        if (league) {
            this.summmonerLeague.init(league.queueType, league.hotStreak, league.wins, league.losses, league.rank, league.tier, league.leaguePoints);

            if (typeof league.miniSeries !== "undefined") {
                this.summmonerLeague.initSeries(league.miniSeries)
            }

            return this.summmonerLeague;
        } else {
            return err;
        }
    }

    get getReturnValue() {

        //TODO: Si invocateur existe mais pas de résultat retourner UNRANKED
        /*
            TODO: Gérer placement en cours

                if($lang == 'fr') {
            $league[$summonerId] = htmlspecialchars("Les 10 parties de placements ne sont pas encore terminé");
        }
        else {
            $league[$summonerId] = "You need to finish the 10 placement games to get the ranking";
        }
        */
        var returnValue = '';

        var rankTiers = this.summmonerLeague.getTiersRank();
        var leaguePt = '';
        var winRate = '';
        var series = this.summmonerLeague.getSeries(this.series);

        if (this.showLp || this.showLp === "true") {
            leaguePt = this.summmonerLeague.getLeaguePoint();
        }

        if (this.showWinRate || this.showWinRate === "true") {
            winRate = ` - ${this.summmonerLeague.getRatio()} % (${this.summmonerLeague.wins}W/${this.summmonerLeague.losses}L)`;
        }


        if (this.fullString === "true") {
            returnValue = `${this.summonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate}`;
        } else {
            returnValue = `${rankTiers}${leaguePt}${series}${winRate}`
        }

        return returnValue.trim();
        /*
                if (info.rankInfo.series) {
                    returnTxt = `${info.rankInfo.username} est actuellement  ${info.rankInfo.tier} ${info.rankInfo.rank}. (${info.rankInfo.lp} LP) - Promo: [${info.rankInfo.series.progress}]`;
                } else {
                    returnTxt = `${info.rankInfo.username} est actuellement  ${info.rankInfo.tier} ${info.rankInfo.rank}. (${info.rankInfo.lp} LP)`;
                } 
        */
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
            var re = new RegExp('^[0-9 _.\\w]+$', 'giu');
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