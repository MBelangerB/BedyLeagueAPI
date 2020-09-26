
/**
 * SummonerDTO 
 * Riot Entity
 * 2020-09-18
 */
var summonerDTO = class SummonerDTO {
    /**
     * string [56]
     */
    accountId = '';
    /**
     * int
     */
    profileIconId = 0;
    /**
     * long
     */
    revisionDate = null;
    /**
     * string
     */
    name = '';
    /**
     * string [63]
     */
    id = '';
    /**
     * string [78]
     */
    puuid = '';
    /**
     * long
     */
    summonerLevel = 0;


    constructor() {
    }

    init(jsonData) {
        this.accountId = jsonData.accountId;
        this.id = jsonData.id;
        this.puuid = jsonData.puuid;

        this.name = jsonData.name;
    
        this.profileIconId = jsonData.profileIconId;
        this.summonerLevel = jsonData.summonerLevel;
        
        this.revisionDate = jsonData.revisionDate;
    }


}

module.exports = summonerDTO;