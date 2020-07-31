/*
    Class pour les information sur les champions de League of Legends
    Utiliser pour les commandes Rotate / Masteries / LiveGame
*/
module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.searchName = '';
        this.championName = '';
        this.championIcon = '';
        this.fullImageName = '';
    }

    init(id, name, search) {
        this.championName = name;
        this.id = id;
        this.searchName = search;
        this.championIcon = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/champion/${this.searchName}.png`;
    }

    setFullImageName(imageName) {
        this.fullImageName = imageName;
        this.championIcon = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/champion/${imageName}`;

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