'use strict';

const shortid = require('shortid');

module.exports = class RiotUserInfoDTO {
    constructor() {
        this.id = shortid.generate();
        this.summonerId = '';
        this.summonerName = '';
        this.region = '';

        /*
        this.summonerLevel = 1;
        this.accountId = '';    
        this.puuid = '';
        */

        /*
        this.showFullString = 0;
        this.showWinRate = 0;
        this.showLP = 0;
        this.getAllElo = 0;
        */

        this.revisionDate = new Date();            
    }
  
    initDTO(jsonData, region) {
        if (jsonData) {
            this.accountId = jsonData.accountId;
            this.summonerId = jsonData.id;
            this.summonerName = jsonData.name; 
        }
        this.region = region;
        /*
    "riotId": "r7P0D-WM9GdnjfymbiEPV1cZZShggGOGInJi8tBqYx4k06Q",
    "region": "EUW",
    "summonerName": "LÏnsa",
    "queueType": "solo5",
    "fullString": 1,
    "showWinRate": 1,
    "showLp": 1,
    "getAll": 1
        */
  
    }

    init(id, summonerId, summonerName, summonerLevel, region, accountId, puuid, date) {
        this.id =id;
        this.summonerId = summonerId;
        this.summonerName =  summonerName;
        this.region = region;

        /*
        this.summonerLevel = summonerLevel;
        this.accountId = accountId;
        this.puuid = puuid;
        */

        this.revisionDate = date;  
    
    }
}
