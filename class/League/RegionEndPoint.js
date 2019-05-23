module.exports = class RegionalEndPoint { 
    constructor() {
        this.region  = { 
            "endpoint": [
            {
                "region" : "BR",
                "platform" : "BR1",
                "host" : "br1.api.riotgames.com"
            },
            {
                "region" : "EUNE",
                "platform" : "EUN1",
                "host" : "eun1.api.riotgames.com"
            },
            {
                "region" : "EUW",
                "platform" : "EUW1",
                "host" : "euw1.api.riotgames.com"
            },
            {
                "region" : "JP",
                "platform" : "JP1",
                "host" : "jp1.api.riotgames.com"
            },
            {
                "region" : "KR",
                "platform" : "KR",
                "host" : "kr.api.riotgames.com"
            },
            {
                "region" : "LAN",
                "platform" : "LA1",
                "host" : "la1.api.riotgames.com"
            },
            {
                "region" : "LAS",
                "platform" : "LA2",
                "host" : "la2.api.riotgames.com"
            },
            {
                "region" : "NA",
                "platform" : "NA1", // , NA *
                "host" : "na1.api.riotgames.com"
            },
            {
                "region" : "OCE",
                "platform" : "OC1",
                "host" : "oc1.api.riotgames.com"
            },
            {
                "region" : "TR",
                "platform" : "TR1",
                "host" : "tr1.api.riotgames.com"
            },
            {
                "region" : "RU",
                "platform" : "RU",
                "host" : "ru.api.riotgames.com"
            },
            {
                "region" : "PBE",
                "platform" : "PBE1",
                "host" : "pbe1.api.riotgames.com"
            }
        ]}
    }

    get getRegion() {
        return this.region;
    }
    get getEndPoint() {
        return this.region.endpoint;
    }

    getTagByName(region) {
        var endpoint = this.getEndPoint;
        for (var i in endpoint) {
            if (endpoint[i].region === region) {
                return endpoint[i].platform;
            } 
          }
          return null;
    }
}