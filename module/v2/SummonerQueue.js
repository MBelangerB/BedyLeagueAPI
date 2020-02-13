var info = require('../../static/info.json');
var RequestManager = require(`./RequestManager`);

var SummonerInfo = require('../../class/v2/SummonerInfo');
// var LeagueQueue = require('../../class/v2/LeagueQueue');

class SummonerQueue {
    constructor(queryString) {
        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }
        // Paramètre obligatoire
        this.summonerName = queryString.summonername;
        this.region = queryString.region;

        // Paramètre facultatif
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

        //       this.summonerInfo = new SummonerInfo(this);
    }

    async getSummonerInfo() {
        var result = {
            "code": 0,
            "err": {}
        };
        var summonerInfo = new SummonerInfo(this);
        var requestManager = new RequestManager(this);
        var SummonerUrl = info.routes.v2.getBySummonerName.replace('{region}', this.region).replace('{summonerName}', this.summonerName);

        try {
            var data;
            await requestManager.ExecuteRequest(SummonerUrl).then(function (res) {
                data = res;
            }, function (error) {
                if (typeof error.status !== "undefined" && error.status.status_code === 404) {
                    if (error.status.message === "Data not found - summoner not found") {
                        // UseCase : Invocateur n'existe pas.
                        result.err = {
                            statusCode: '200-1',
                            statusMessage: "L'invocateur n'existe pas."
                        }
                    } else {
                        result.err = {
                            statusCode: err.status.status_code,
                            statusMessage: error.status.message
                        }
                    }
                } else {
                    // error.code = 'ENOTFOUND'     -> mauvais serveur
                    result.err = {
                        statusCode: '',
                        statusMessage: error.statusMessage
                    }
                }
            });

            if (data) {
                // Initialiser les informations sur invocateur
                summonerInfo.init(data);

                // Obtenir l'information sur la queue        
                // Get Login Info
                var leagueUrl = info.routes.v2.getLeagueEntriesForSummoner.replace('{region}', this.region).replace('{encryptedSummonerId}', summonerInfo.getId);
                if (this.queueType === "tft") {
                    leagueUrl = info.routes.v2.getTFTLeagueEntriesForSummoner.replace('{region}', this.region).replace('{encryptedSummonerId}', summonerInfo.getId);
                }
                await requestManager.ExecuteRequest(leagueUrl).then(function (res) {
                    if (res.length === 0) {
                        // UseCase : Pas de données de league donc pas de classement
                        result.err = {
                            statusCode: "200-1",
                            statusMessage: "Unranked"
                        }
                    } else {
                        summonerInfo.initQueue(res);
                    }
                }, function (error) {
                    if (typeof error.message === "undefined") {
                        result.err = {
                            statusCode: error.statusCode,
                            statusMessage: error.statusMessage
                        }
                    } else {
                        result.err = {
                            statusCode: '',
                            statusMessage: error.message
                        }
                    }

                });
            }


            if (result && typeof result.err.statusCode === "undefined") {
                // Aucune erreur
                this.summonerInfo = summonerInfo;
                result.code = 200;
            } else if (result && result.err.statusCode === "200-1") {
                // Erreur normal (pas classé, invocateur n'Existe pas)
                result.code = 201;

            } else {
                result.code = 404;
            }


        } catch (ex) {
            result.code = -1;
            console.error(ex);
        }
        return result;
    }

    getRatio() {
        var rates = (this.wins / (this.wins + this.losses) * 100);
        return parseFloat(rates).toFixed(1);
    }

    getTiersRank() {
        return `${this.tier} ${this.rank}`;
    }

    getLeaguePoint() {
        return ` (${this.leaguePoints} LP)`;
    }

    getSeries(charSerie) {
        if (this.series.enabled) {
            var cWin = charSerie[0]; // W
            var cLoose = charSerie[1]; // L
            var cPending = charSerie[2]; // N

            var series = ` [${this.series.progress}]`;
            series = series.replaceAll('L', cLoose).replaceAll('W', cWin).replaceAll('N', cPending);
            return series;
        } else {
            return '';
        }
    }


    // Validation
    static validateQueryString(queryString) {
        var err = [];

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré-validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region, summonerName)");

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
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Pour pseudo avec caractère accentué
        if (typeof queryString.summonername !== "undefined" && queryString.summonername.trim().length >= 0) {

            var arrUsernames = queryString.summonername.trim().split(";");
            arrUsernames.forEach(function myFunction(summonerName) {
                var re = new RegExp('^[0-9\u00C0-\u024F _.\\w]+$', 'giu');
                if (!re.test(summonerName)) {
                    err.push("Le paramètre 'summonerName' est invalide.");
                }
            });
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
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



    getReturnValue(type) {
        var returnValue = '';

        var mappingQueue = SummonerInfo.getMappingQueueTypeToLeagueQueue();

        //   var t = this.summonerInfo.getQueueInfo(type);
        var league = this.summonerInfo.Queues.find(league => league.queueType === mappingQueue[type]);

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
}

module.exports = SummonerQueue;