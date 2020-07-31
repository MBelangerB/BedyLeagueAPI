/*
    Class pour contenir les information sur l'invocateur
    V1 (a remplacer par V2)
*/
module.exports = class SummonerDTO {
    constructor(info) {
        this.name = '';
        this.id = '';
        this.accountId = '';
        this.summonerLevel = 0;
        this.profileIconId = 0;
        this.region = '*';

        if (info) {
            this.name = info.summonerName;
            this.region = info.region;
        }
    }

    init(name, id, accountid, summonerLevel, profileIcon, region) {
        this.name = name;
        this.id = id;
        this.accountId = accountid;
        this.summonerLevel = summonerLevel;
        this.profileIconId = profileIcon;
        this.region = region;
    }

    get getId() {
        return this.id;
    }
    get getSummonerName() {
        return this.name;
    }

}