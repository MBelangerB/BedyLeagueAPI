const RiotUrlApi = require('./League/RiotUrlApi');
var request = require('request');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

module.exports = class SummonerLeague {
    constructor() {
        this.queueType = '';
        this.hotStreak = false;
        this.wins = 0;
        this.losses = 0;

        this.rank = '';
        this.tier = '';
        this.leaguePoints = 0;
        this.series = {
            enabled: false,
            wins: 0,
            losses: 0,
            target: 0,
            progress: ''
        }
    }

    init(type, hotStreak, wins, losses, rank, tier, lp) {
        this.queueType = type;
        this.hotStreak = hotStreak;
        this.wins = wins;
        this.losses = losses;

        this.rank = rank;
        this.tier = tier;
        this.leaguePoints = lp;
        this.series = {
            enabled: false,
            wins: 0,
            losses: 0,
            target: 0,
            progress: ''
        }
    }

    getRatio()  {
        var rates = (this.wins / (this.wins + this.losses) * 100);
        return parseFloat(rates).toFixed(1);
    }

    initSeries(miniSeries) {
        this.series = {
            enabled: true,
            wins: miniSeries.wins,
            losses: miniSeries.losses,
            target: miniSeries.target,
            progress: miniSeries.progress
        }
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

    async getLeagueInfo(userId, region, apiKey) {
        return new Promise(function (resolve, reject) {
            var RiotUrl = new RiotUrlApi();

            // TODO: Réadapter exclue param passé par header
            var options = {
                url: `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${userId}`,
                headers: {
                    "Origin": null,
                    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Riot-Token": apiKey,
                    "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0"
                },
                json: true
            };

            request.get(options, function (err, respo, jsonData) {
                if (err) {
                    reject(err);
                } else if (respo.statusCode === 200) {
                    resolve(jsonData);
                } else {
                    reject(respo);
                }
            });

        });
    }
}