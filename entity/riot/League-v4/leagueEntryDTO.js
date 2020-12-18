const miniSeriesDTO = require('./miniSeriesDTO');

/**
 * LeagueEntryDTO 
 * Riot Entity
 * 2020-09-18
 */
var leagueEntryDTO = class LeagueEntryDTO {
    /**
     * string 
     */
    leagueId = '';
    /**
     * string 
     */
    summonerId = '';
    /**
     * string 
     */
    summonerName = '';
    /**
     * string 
     */
    queueType = '';
    /**
     * string 
     */
    tier = '';
    /**
     * string 
     */
    rank = '';
    /**
     * int 
     */
    leaguePoints = 0;
    /**
    * int 
    */
    wins = 0;
    /**
    * int 
    */
    losses = 0;
    /**
    * boolean 
    */
    hotStreak = false;
    /**
    * boolean 
    */
    veteran = false;
    /**
    * boolean 
    */
    freshBlood = false;
    /**
    * boolean 
    */
    inactive = false;
    /**
    * Class @type {miniSeriesDTO}
    */
    miniSeries = null;


    constructor(jsonData) {
        this.leagueId = jsonData.leagueId;
        this.summonerId = jsonData.summonerId;
        this.summonerName = jsonData.summonerName;
        this.queueType = jsonData.queueType;
        this.tier = jsonData.tier;
        this.rank = jsonData.rank;
        this.leaguePoints = jsonData.leaguePoints;
        this.wins = jsonData.wins;
        this.losses = jsonData.losses;
        this.hotStreak = jsonData.hotStreak;
        this.veteran = jsonData.veteran;
        this.freshBlood = jsonData.freshBlood;
        this.inactive = jsonData.inactive;

        if (jsonData.miniSeries) {
            this.miniSeries = new miniSeriesDTO(jsonData.miniSeries);
        }
    }

    getRatio() {
        var rates = (this.wins / (this.wins + this.losses) * 100);
        return parseFloat(rates).toFixed(1);
    }

    getTiersRank() {
        return `${this.tier} ${this.rank}`;
    }

    getLeaguePoint(showText = false) {
        if (!showText) {
            return ` (${this.leaguePoints} LP)`;
        } else {
            return parseInt(`${this.leaguePoints}`);
        }
    }

    getGameType() {
        var type = '';
        switch (this.queueType) {
            case 'RANKED_SOLO_5x5':
                type = 'SoloQ';
                break;

            case 'RANKED_FLEX_SR':
                type = 'Flex';
                break;
            case 'RANKED_TFT':
                type = 'TFT';
                break;
        }
        return type;
    }

    getSeries(charSerie, isOverlay = false) {
        if (this.miniSeries) {
            var cWin = charSerie[0]; // W
            var cLoose = charSerie[1]; // L
            var cPending = charSerie[2]; // N

            if (isOverlay) {
                var series = `${this.miniSeries.progress}`;
                var result = [];

                for (var i = 0; i < series.length; i++) {
                    var char = series.charAt(i);
                    var color = "green";
                    switch(char.toUpperCase()) {
                        case 'W':
                            color = "green";
                            char = cWin;
                            break;
                        case 'L':
                            color = "red";
                            char = cLoose;
                            break;
                        case "N":
                            color = "gray"
                            char = cPending;
                            break;
                    }

                    result.push({
                        'value': char,
                        'color': color
                    })
                  }

                return result;
            } else {
                var series = ` [${this.miniSeries.progress}]`;
                series = series.replaceAll('L', cLoose).replaceAll('W', cWin).replaceAll('N', cPending);
                return series;
            }


        } else {
            return '';
        }
    }

}

module.exports = leagueEntryDTO;