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
        this.tier =jsonData.tier;
        this.rank = jsonData.rank;
        this.leaguePoints =jsonData.leaguePoints;
        this.wins =jsonData.wins;
        this.losses =jsonData.losses;
        this.hotStreak = jsonData.hotStreak;
        this.veteran =jsonData.veteran;
        this.freshBlood =jsonData.freshBlood;
        this.inactive =jsonData.inactive;

        if (jsonData.miniSeries) {
            this.miniSeries = new miniSeriesDTO(jsonData.miniSeries);
        }
    }


}

module.exports = leagueEntryDTO;