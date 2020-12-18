/**
 * MiniSeriesDTO 
 * Riot Entity
 * 2020-09-18
 */
var miniSeriesDTO = class MiniSeriesDTO {
    /**
     * int
     */
    losses = 0;

    /**
     * string
     */
    progress = '';

    /**
     * int
     */
    target = 0;

    /**
     * int
     */
    wins = 0;

    constructor(jsonData) {
        this.wins = jsonData.wins;
        this.losses = jsonData.losses;
        this.target = jsonData.target;
        this.progress = jsonData.progress;
    }
}

module.exports = miniSeriesDTO;