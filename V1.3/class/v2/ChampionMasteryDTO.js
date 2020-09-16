
 class ChampionMasteries {
    constructor() {
        this.summonerId = "";

        this.championId = 0;
        this.championName = "";
        this.championLevel = 0;

        this.tokensEarned = 0;
        this.championPoints = 0;
        this.chestGranted = false;
    }

    init(jsonData, champName) {
        if (jsonData) {
            this.championName = champName;

            this.summonerId = jsonData.summonerId;
            this.championId = jsonData.championId;
            this.championLevel =jsonData.championLevel;
            this.tokensEarned = jsonData.tokensEarned;
            this.championPoints = jsonData.championPoints;
            this.chestGranted = jsonData.chestGranted;
        }
    }


    get getChampionId() {
        return this.championId;
    }
    get getChampionName() {
        return this.championName;
    }
    get getChampionPoints() {
        return this.championPoints;
    }

    get masterieInfo() {
        return `${this.getChampionName} (${this.getChampionPoints} pts)`
    }
}

module.exports = ChampionMasteries;