module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.championName = '';
        this.championIcon = '';
    }

    init(id, name) {
        this.championName = name;
        this.id = id;
        this.championIcon = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/champion/${this.getChampionName()}.png`;
    }

    getId() {
        return this.id;
    }
    getChampionName() {
        return this.championName;
    }

    championIcon() {
        return this.championIcon;
    }

}