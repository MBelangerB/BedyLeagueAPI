var RequestManager = require(`../util/RequestManager`);
const CacheService = require('../module/Cache.Service');

/*
    Cache configuration
*/
var ttStats = 60 * 3; // cache for 1 mn (60 sec * 1 min)
var owCache = new CacheService(ttStats); // Create a new cache service instance

class OverwatchProfilStatsController {
    constructor(queryString, url) {
        // Paramètre obligatoire
        this.platform = queryString.platform;
        this.region = queryString.region;
        this.tag = queryString.tag;
        this.url = url;

        this.getJson = ((queryString.json === "1") || (queryString.json === true));

        // Paramètre facultatif
        this.showLevel = (queryString.showlevel === "1") || "false";
        this.fullString = (queryString.fullstring === "1") || "false";

        this.queryOverwatchStats = async function (requestManager, result) { // async queryOverwatchStats(requestManager, result) {
            var data;
            var url = this.url;

            // Le SummonerInfo n'est pas présent dans la cache
            await requestManager.ExecuteRequest(url).then(function (res) {
                data = res;
            }, function (error) {
                result.err = {
                    statusCode: error.status,
                    statusMessage: error.statusText
                }
                return result;
            });
            return data;
        };
    }

    //#region "CacheKey"
    getStatsCacheKey() {
        return `${this.tag}-${this.region}-${this.platform}`;
    }
    //#endregion

    // Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
    // async queryOverwatchStats(requestManager, result) {
    //     var data;
    //     var url = (this.url || info.overwatch.routes.profile);

    //     // Le SummonerInfo n'est pas présent dans la cache
    //     await requestManager.ExecuteRequest(url).then(function (res) {
    //         data = res;
    //     }, function (error) {
    //         if (typeof error.status !== "undefined" && error.status.status_code === 404) {
    //             if (error.status.message === "Data not found - summoner not found") {
    //                 // UseCase : Invocateur n'existe pas.
    //                 result.err = {
    //                     statusCode: '200-1',
    //                     statusMessage: "L'invocateur n'existe pas."
    //                 }
    //             } else {
    //                 result.err = {
    //                     statusCode: err.status.status_code,
    //                     statusMessage: error.status.message
    //                 }
    //             }
    //         } else {
    //             // error.code = 'ENOTFOUND'     -> mauvais serveur
    //             result.err = {
    //                 statusCode: '',
    //                 statusMessage: error.statusMessage
    //             }
    //         }
    //     });
    //     return data;
    // };

    // Requête principale
    async getProfileStats() {
        var result = {
            "code": 0,
            "err": {}
        };
        var me = this;
        return new Promise(async function (resolve, reject) {
            try {
                var key = me.getStatsCacheKey();

                await owCache.getAsyncB(key).then(async function (resultData) {
                    if (typeof resultData === "undefined") {
                        // Le data n'est pas présent on doit l'obtenir
                        var data = await me.queryOverwatchStats(RequestManager, result);
                        if (data) {
                            owCache.setCacheValue(key, data);
                            return data;
                        } else {
                            reject(result);
                            return;
                        }
                    } else {
                        // L'information est présente dans la cache
                        return resultData;
                    }
                }).then(resultQry => {
                    // On traite le Resut
                    if (resultQry && typeof resultQry.err === "undefined") {
                        // Aucune erreur
                        me.OverwatchStats = resultQry;
                        result.code = 200;

                    } else if (resultQry && typeof resultQry.err != "undefined" && resultQry.err.statusCode === "200-1") {
                        // Erreur normal (pas classé, invocateur n'Existe pas)
                        result.code = 201;

                    } else {
                        result.code = 404;
                    }
                });
                resolve(result);
            } catch (ex) {
                console.error(ex);

                result.code = -1;
                result.err.statusMessage = ex;

                reject(result);
                return;
            }

        });
    }

    //#region "Get League Data"

    getRatio(data) {
        var nbGame = data.played;
        var wins = data.won;

        var rates = (wins / nbGame * 100);
        return parseFloat(rates).toFixed(1);
    }
    //#endregion

    getReturnValue() {
        var returnValue = '';

        try {
            var stats = this.OverwatchStats;
            if (this.getJson) {
                // Préparer le retour
                var data = {
                    "profile": {
                        "name": stats.name,
                        "prestige": {
                            "points": stats.prestige,
                            "icon": stats.prestigeIcon
                        },
                        "level": {
                            "level": stats.level,
                            "icon": stats.levelIcon
                        },
                    },
                    "region": this.region,
                    "platform": this.platform,
                    "ratings": {
                        "global": {
                            "level": stats.rating,
                            "icon": stats.ratingIcon
                        },
                        "specific": []
                    },
                    "quickPlayStats": stats.quickPlayStats,
                    "competitiveStats": stats.competitiveStats
                }

                stats.ratings.forEach(n => {
                    let rate = {
                        "role": n.role,
                        "level": n.level,
                        "icon": n.roleIcon
                    }
                    data.ratings.specific.push(rate);
                });

                return data;

            } else {
                var nbGame = stats.competitiveStats.games.played;
                var wins = stats.competitiveStats.games.won;
                var loose = nbGame - wins;
                var rates = this.getRatio(stats.competitiveStats.games);

                // Bohe dispose de 2141 pts en tant que support (78 W / 148));
                var level = '';
                var winRate = ` ${rates} % (${wins}W/${loose})`;
                var rolePts = '';

                if (this.showLevel && this.showLevel.toString() === "true") {
                    level = ` (Level ${stats.level})`;
                }
                var tmpStats = stats.ratings;
                tmpStats.sort(function (a, b) {
                    return (a.level > b.level);
                });

                tmpStats.forEach(n => {
                    let rate = {
                        "role": n.role,
                        "level": n.level,
                        "icon": n.roleIcon
                    }
                    if (rolePts.length === 0) {
                        rolePts = ` dispose de ${rate.level} pts en tant que ${rate.role}.`;
                    }
                });

                if (this.fullString && this.fullString.toString() === "true") {
                    if (level && level.length > 0) {
                        returnValue = `${this.tag}${level}${rolePts}${winRate}`;
                    } else {
                        returnValue = `${this.tag}${rolePts}${winRate}`;
                    }

                } else {
                    returnValue = `${level}${rolePts}${winRate}`;
                }

            }
        } catch (ex) {
            console.error(ex);
        }

        return returnValue.trim();
    }
}

module.exports = OverwatchProfilStatsController;