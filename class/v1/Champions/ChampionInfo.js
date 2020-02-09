module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.championName = '';
    }

    init(id, name) {
        this.championName = name;
        this.id = id;
    }

    get getId() {
        return this.id;
    }
    get getChampionName() {
        return this.championName;
    }

}