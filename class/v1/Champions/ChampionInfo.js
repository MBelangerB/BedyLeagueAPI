module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.searchName = '';
        this.championName = '';
        this.championIcon = '';
    }

    init(id, name, search) {
        this.championName = name;
        this.id = id;
        this.searchName = search;
        this.championIcon = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/champion/${this.getChampionName()}.png`;
    }

    getId() {
        return this.id;
    }
    getChampionName() {
        return this.championName;
    }
    getSearchName() {
        return this.searchName;
    }
    getChampionIcon() {
        return this.championIcon;
    }

}