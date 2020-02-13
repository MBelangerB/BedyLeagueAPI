/*
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};*/

class LeagueQueue {
    constructor(type) {
        this.queueType = type;
        this.hotStreak = false;
        this.veteran = false;
        this.inactive = false;
        this.freshBlood = false;

        this.leagueId = "";
        this.wins = 0;
        this.losses = 0;
        this.leaguePoints = 0;
   
        this.rank = '';
        this.tier = '';

        this.series = {
            enabled: false,
            wins: 0,
            losses: 0,
            target: 0,
            progress: ''
        }
    }

    getQueueType() {
        return this.queueType;
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

module.exports = LeagueQueue;