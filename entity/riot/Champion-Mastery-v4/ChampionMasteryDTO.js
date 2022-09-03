/**
 * ChampionMasteryDTO
 * Riot Entity
 * 2020-09-18
 */
// let LeagueChampion = require(`../../api/leagueChampion`);

const championMasteryDTO = class ChampionMasteryDTO {
    /**
     * long
     */
    championPointsUntilNextLevel = 0;

    /**
     * boolean
     */
    chestGranted = '';

    /**
     * int
     */
    championId = 0;

    /**
     * long
     */
    lastPlayTime = 0;


    /**
     * int
     */
    championLevel = 0;

    /**
     * string
     */
    summonerId = '';

    /**
     * int
     */
    championPoints = 0;
        /**
     * long
     */
    championPointsSinceLastLevel = 0;
        /**
     * int
     */
    tokensEarned = 0;

    constructor(jsonData) {
        this.championPointsUntilNextLevel = jsonData.championPointsUntilNextLevel;
        this.chestGranted = jsonData.chestGranted;
        this.championId = jsonData.championId;
        this.lastPlayTime = jsonData.lastPlayTime;
        this.championLevel = jsonData.championLevel;
        this.summonerId = jsonData.summonerId;
        this.championPoints = jsonData.championPoints;
        this.championPointsSinceLastLevel = jsonData.championPointsSinceLastLevel;
        this.tokensEarned = jsonData.tokensEarned;
    }

    initChampion(championData) {
        this.championData = championData;
    }

    getMasterieInfo() {
        return `${this.championData.championName} (${this.championPoints} pts)`;
    }
};

module.exports = championMasteryDTO;