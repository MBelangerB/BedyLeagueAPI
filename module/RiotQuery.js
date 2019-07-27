var request = require('request');

module.exports = class RiotQuery {

    constructor(region, summonerName) {
        this.summonerByNameURL = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;
        this.leagueEntriesURL = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/`

        this.header = {
            "Origin": null,
            "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Riot-Token": `${process.env.apiKey}`,
            "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0"
        }
    }

    async getSummonerData() {
        try {
            var riot;

            await this.getSummonerInfo().then(function (res) {
                riot = res;
            }, function (err) {
                console.error(error);
                return;
            });

            if (typeof riot !== "undefined" && riot.code === 200) {
                this.summonerDTO = riot.summonerInfo;
            }

        } catch (ex) {
            console.error(ex);
        }
        return riot.code;
    }
    setSummonerDTO(dto) {
        if (typeof dto !== "undefined") {
            this.summonerDTO = dto;
        }
    }

    async getSummonerLeague(summonerId) {
        try {
            this.summonerId = summonerId;
            var riot;

            await this.getSummonerLeagueInfo().then(function (res) {
                riot = res;
            }, function (err) {
                console.error(error);
                return;
            });

            if (typeof riot !== "undefined" && riot.code === 200) {
                this.summonerLeague = riot.league;
            }

        } catch (ex) {
            console.error(ex);
        }
        return riot.code;      
    }
    /*
    setSummonerLeague(league) {
        if (typeof dto !== "undefined") {
            this.summonerDTO = league;
        }
    }
    */


    
    // Step 1 - Information de invocateur
    async getSummonerInfo() {
        var result = {
            "code": 0,
            "summonerInfo": '',
            "err": {}
        }

        try {
            // Get Login Info
            await this.ExecuteRequest(this.summonerByNameURL, this.header).then(function (res) {
                // UseCase : Invocateur existe
                if (res && typeof res.status === "undefined") {
                    result.summonerInfo = res;

                } else if (res && typeof res.status !== "undefined" && res.status.status_code === 404) {
                    result.code = res.status.status_code;
                }

            }, function (error) {
                if (typeof error.message === "undefined") {
                    // UseCase : Invocateur n'existe pas.
                    if (error.statusMessage === "Not Found") {
                        result.err = {
                            statusCode: '200-1',
                            statusMessage: "L'invocateur n'existe pas."
                        }
                    } else {
                        result.err = {
                            statusCode: error.statusCode,
                            statusMessage: error.statusMessage
                        }
                    }
                } else {
                    // error.code = 'ENOTFOUND'     -> mauvais serveur
                    result.err = {
                        statusCode: '',
                        statusMessage: error.message
                    }
                }
            });

            if (result && result.summonerInfo !== '') {
                result.code = 200;
            } else {
                result.code = 404;
            }

        } catch (err) {
            result.code = -1;
        }

        this.result = result;
        return result;
    }

    async getSummonerLeagueInfo() {
        var result = {
            "code": 0,
            "username": this.summonerDTO.name,
            "league": '',
            "err": {}
        }

        try {
            // Get Login Info
            var url = `${this.leagueEntriesURL}${this.summonerDTO.id}`;

            await this.ExecuteRequest(url, this.header).then(function (res) {
                if (res.length === 0) {
                    // UseCase : Pas de données de league donc pas de classement
                    result.err = {
                        statusCode: "200-1",
                        statusMessage: "Unranked"
                    }
                } else {
                    result.league = res;
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

            if (result && result.league !== '') {
                result.code = 200;
            } else {
                result.code = 404;
            }

        } catch (err) {
            result.code = -1;
        }

        this.resultLeague = result;
        return result;
    }


    /*
        Methode base pour executer Query
    */
    async ExecuteRequest(requestUrl, requestHeaders) {
        return new Promise(function (resolve, reject) {
            // TODO: Réadapter exclue param passé par header
            var options = {
                url: encodeURI(requestUrl),
                headers: requestHeaders,
                json: true
            };

            request.get(options, function (err, respo, data) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else if (respo.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(respo);
                }
            });
        });
    }
};