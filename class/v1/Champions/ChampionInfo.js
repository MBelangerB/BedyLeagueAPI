module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.championName = '';
    }

    init(id, name) {
        this.championName = name;
        this.id = id;
    }

    getId() {
        return this.id;
    }
    getChampionName() {
        return this.championName;
    }

}