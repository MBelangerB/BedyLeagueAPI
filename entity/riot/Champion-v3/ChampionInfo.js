
/**
 * ChampionInfo 
 * Riot Entity
 * 2020-09-18
 */
var championInfo = class ChampionInfo {
    /**
     * int
     */
    maxNewPlayerLevel = '';

    /**
     * List(Int)
     */
    freeChampionsForNewPlayers = [];

    /**
     * List(Int)
     */
    freeChampions = [];

    constructor(jsonData) {
        this.maxNewPlayerLevel = jsonData.maxNewPlayerLevel;
        this.freeChampionsForNewPlayers = jsonData.freeChampionsForNewPlayers;
        this.freeChampions = jsonData.freeChampions;
    }

}

module.exports = championInfo;