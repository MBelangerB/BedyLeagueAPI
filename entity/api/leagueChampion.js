/*
    Class interne de API pour contenir les information sur les champion. 
*/
const dragonUpdate = require('../../module/dragonUpdate');

module.exports = class ChampionInfo {
    constructor() {
        this.id = '';
        this.searchName = '';
        this.championName = '';
        this.championIconUrl = '';
        this.fullImageName = '';
   //     this.fullImageUrl = '';
    }

    async init(id, name, search, imgInfo) {

        let version = await this.getVersion().then(r => {
            this.championIconUrl = `http://ddragon.leagueoflegends.com/cdn/${r}/img/champion/${search}.png`;
            return r;
        });

        this.championName = name;
        this.id = id;
        this.searchName = search;

        if (imgInfo) {
            this.setFullImageName(imgInfo.full, version);
        }
    }

    setFullImageName(imageName, version) {
        this.fullImageName = imageName;
    //    this.fullImageUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageName}`;
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
    getChampionIconUrl() {
        return this.championIconUrl;
    }
    // getFullImageUrl() {
    //     return this.fullImageUrl;
    // }

    async getVersion() {
        try {
            var ds = new dragonUpdate();
            await ds.loadAPIConfigFile().then(async loading => {
                if (loading && loading.dragonVersion) {
                    return true;
                }
            }).catch(error => {
                console.log(`A error occured during GetDragonVersion`);
                console.error(error);
            });

            return `${ds.currentVersion}`;
        } catch (ex) {
            console.error(ex);
            res.send(ex);
        }
    }

}