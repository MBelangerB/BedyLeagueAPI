const RequestManager = require('../util/RequestManager');
const CacheService = require('../module/Cache.Service');

/*
    Cache configuration
*/
const ttStats = 60 * 3; // cache for 1 mn (60 sec * 1 min)
const owCache = new CacheService(ttStats); // Create a new cache service instance

class OverwatchProfilStatsController {
    constructor(params, url) {
        // Paramètre obligatoire
        this.platform = params.platform;
        this.region = params.region;
        this.tag = params.tag;
        this.url = url;

        this.getJson = ((params.json === 1) || (params.json === true));

        // Paramètre facultatif
        this.showLevel = (params.showlevel === 1) || false;
        this.fullString = (params.fullstring === 1) || false;
    }

    // #region "CacheKey"
    getStatsCacheKey() {
        return `${this.tag}-${this.region}-${this.platform}`;
    }
    // #endregion

    /**
     * Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
     */
    async queryOverwatchStats(requestManager, result) {
        let data;
        const url = this.url;

        // Le SummonerInfo n'est pas présent dans la cache
        await requestManager.ExecuteRequest(url).then(function (res) {
            data = res;
        }, function (error) {
            result.err = {
                statusCode: error.status,
                statusMessage: error.statusText,
            };
            return result;
        });
        return data;
    }


    /**
     * Permet d'effectue les appels nécessaire pour obtenir le rôle
     */
    async getProfileStats() {
        const result = {
            'code': 0,
            'err': {},
        };
        const self = this;
        return new Promise(async function (resolve, reject) {
            try {
                const key = self.getStatsCacheKey();

                await owCache.getAsyncB(key).then(async function (resultData) {
                    // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                    if (typeof resultData === 'undefined') {
                        const data = await self.queryOverwatchStats(RequestManager, result);
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
                    if (resultQry && typeof resultQry.err === 'undefined') {
                        // Aucune erreur
                        self.OverwatchStats = resultQry;
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

    // #region "Get League Data"

    getRatio(data) {
        const nbGame = data.played;
        const wins = data.won;

        const rates = (wins / nbGame * 100);
        return parseFloat(rates).toFixed(1);
    }
    // #endregion

    getReturnValue() {
        let returnValue = '';

        try {
            const stats = this.OverwatchStats;
            if (this.getJson) {
                // Préparer le retour
                const data = {
                    'profile': {
                        'name': stats.name,
                        'prestige': {
                            'points': stats.prestige,
                            'icon': stats.prestigeIcon,
                        },
                        'level': {
                            'level': stats.level,
                            'icon': stats.levelIcon,
                        },
                    },
                    'region': this.region,
                    'platform': this.platform,
                    'ratings': {
                        'global': {
                            'level': stats.rating,
                            'icon': stats.ratingIcon,
                        },
                        'specific': [],
                    },
                    'quickPlayStats': stats.quickPlayStats,
                    'competitiveStats': stats.competitiveStats,
                };

                stats.ratings.forEach(n => {
                    const rate = {
                        'role': n.role,
                        'level': n.level,
                        'icon': n.roleIcon,
                    };
                    data.ratings.specific.push(rate);
                });

                return data;

            } else {
                const nbGame = stats.competitiveStats.games.played;
                const wins = stats.competitiveStats.games.won;
                const loose = nbGame - wins;
                const rates = this.getRatio(stats.competitiveStats.games);

                // Bohe dispose de 2141 pts en tant que support (78 W / 148));
                let level = '';
                const winRate = ` ${rates != 'NaN' ? rates : 0} % (${wins}W/${loose})`;
                let rolePts = '';

                if (this.showLevel) {
                    level = ` (Level ${stats.level})`;
                }
                const tmpStats = stats.ratings;
                if (tmpStats && tmpStats.length > 0) {
                    tmpStats.sort(function (a, b) {
                        return (a.level > b.level);
                    });

                    tmpStats.forEach(n => {
                        const rate = {
                            'role': n.role,
                            'level': n.level,
                            'icon': n.roleIcon,
                        };
                        if (rolePts.length === 0) {
                            rolePts = ` dispose de ${rate.level} pts en tant que ${rate.role}.`;
                        }
                    });
                }

                if (this.fullString) {
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