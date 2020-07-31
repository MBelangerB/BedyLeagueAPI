/*
    Class pour contenir les inforamtions (rang) sur invocateur
*/
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

    init(type, hotStreak, wins, losses, rank, tier, lp, queueType) {
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

    initSeries(miniSeries) {
        this.series = {
            enabled: true,
            wins: miniSeries.wins,
            losses: miniSeries.losses,
            target: miniSeries.target,
            progress: miniSeries.progress
        }
    }

    
    getRatio()  {
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

}