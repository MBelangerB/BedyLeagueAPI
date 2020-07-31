
 /*
    Information sur les parties de l'invocateur
 */
 class ParticipantsGame {
    constructor() {
        this.teamId = 0;

        this.summonerId = "";
        this.summonerName = "";

        this.championId = 0;
        this.championName = "";

        this.spell1_Id = 0;
        this.spell1_Name = "";
        this.spell2_Id = 0;
        this.spell2_Name = "";
    }

    init(summonerId, summonerName, championId, spell1, spell2, teamId) {
        this.summonerId = summonerId;
        this.summonerName = summonerName;

        this.championId = championId;

        this.spell1_Id = spell1;
        this.spell2_Id = spell2;

        this.teamId = teamId;
    }

    setChampionName(name) {
        this.championName = name;
    }
    setSpellName1(name) {
        this.spell1_Name = name;
    }
    setSpellName2(name) {
        this.spell2_Name = name;
    }

 }

 module.exports = ParticipantsGame;