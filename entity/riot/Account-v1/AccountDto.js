
/**
 * AccountDTO 
 * Riot Entity
 * 2023-11-25
 */
var AccountDto = class AccountDTO {
    /**
    * string [78]
    */
    puuid = '';
    /**
     * string, SummonerName [3-16]
     */
    gameName = '';

    /**
    * string, tag summoner #????? [3-5]
    */
    tagLine = '';



    constructor() {
    }

    init(jsonData) {
        this.gameName = jsonData.gameName;
        this.tagLine = jsonData.tagLine;
        this.puuid = jsonData.puuid;
    }


}

module.exports = AccountDto;