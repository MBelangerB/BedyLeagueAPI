const miniSeriesDTO = require('./miniSeriesDTO');

/**
 * LeagueEntryDTO
 * Riot Entity
 * 2020-09-18
 */
const leagueEntryDTO = class LeagueEntryDTO {
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
        const rates = (this.wins / (this.wins + this.losses) * 100);
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
        let type = '';
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
            const cWin = charSerie[0]; // W
            const cLoose = charSerie[1]; // L
            const cPending = charSerie[2]; // N

            if (isOverlay) {
                const series = `${this.miniSeries.progress}`;
                const result = [];

                for (let i = 0; i < series.length; i++) {
                    let char = series.charAt(i);
                    let color = 'green';
                    switch (char.toUpperCase()) {
                        case 'W':
                            color = 'green';
                            char = cWin;
                            break;
                        case 'L':
                            color = 'red';
                            char = cLoose;
                            break;
                        case 'N':
                            color = 'gray';
                            char = cPending;
                            break;
                    }

                    result.push({
                        'value': char,
                        'color': color,
                    });
                  }

                return result;
            } else {
                let series = ` [${this.miniSeries.progress}]`;
                series = series.replaceAll('L', cLoose).replaceAll('W', cWin).replaceAll('N', cPending);
                return series;
            }


        } else {
            return '';
        }
    }

};

module.exports = leagueEntryDTO;