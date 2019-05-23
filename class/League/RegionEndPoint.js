module.exports = class RegionalEndPoint { 
    constructor() {
        this.region  = {
            BR	    :'BR1',     //  br1.api.riotgames.com
            EUNE	:'EUN1',    //  eun1.api.riotgames.com
            EUW	    :'EUW1',    //  euw1.api.riotgames.com
            JP	    :'JP1',     //  jp1.api.riotgames.com
            KR	    :'KR',      //  kr.api.riotgames.com
            LAN	    :'LA1',     //  la1.api.riotgames.com
            LAS	    :'LA2',     //  la2.api.riotgames.com
            NA	    :'NA1|NA',  //	na1.api.riotgames.com
            OCE	    :'OC1',     //  oc1.api.riotgames.com
            TR	    :'TR1',     //  tr1.api.riotgames.com
            RU	    :'RU',      //  ru.api.riotgames.com
            PBE	    :'PBE1',    //  pbe1.api.riotgames.com
            }
    }

    get getRegion() {
        return this.region;
    }

    isValid(region) {
      return  this.region(region);
    }

    getTagByName(tag) {
        tag = tag.toUpperCase();
        var keys = Object.keys(this.region);
        var values = Object.values(this.region);

        var i = 0;
        for (i = 0; i < keys.length; i++) { 
            if (keys[i] === tag) {
                break;
            }
        }

        if (i === keys.length) { return null; }
        return values[i];
    }
}