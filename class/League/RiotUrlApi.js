
module.exports = class RiotUrlApi {
    constructor() {
        this.Riot_V4_API = {
            mainUrl: 'https://{region}.api.riotgames.com',
            status: `/lol/status/v3/shard-data?api_key={apiKey}`,
            summoners: {
                by_name: `/lol/summoner/v4/summoners/by-name/{summonerName}?api_key={apiKey}`
            },
            league: {
                by_summoner: `/lol/league/v4/entries/by-summoner/{userid}?api_key={apiKey}`,
                leagues: `/lol/league/v4/leagues/{id}?api_key={apiKey}`
            }
        }
    }

    get getV4API() {
        return this.Riot_V4_API;
    }


    getMainUrl(region) {
        return this.Riot_V4_API.mainUrl.replace("{region}", region)
    }
    getSummonerByName(summonername, apiKey) {
        return this.Riot_V4_API.summoners.by_name.replace("{summonerName}", summonername).replace("{apiKey}", apiKey)
    }
}

