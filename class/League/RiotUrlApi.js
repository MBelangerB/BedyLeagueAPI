
module.exports = class RiotUrlApi {
    constructor() {
        this.Riot_V4_API = {
            mainUrl: 'https://{region}.api.riotgames.com',
            status: `/lol/status/v3/shard-data`,
            summoners: {
                by_name: `/lol/summoner/v4/summoners/by-name/{summonerName}`
            },
            league: {
                by_summoner: `/lol/league/v4/entries/by-summoner/{userid}`,
                leagues: `/lol/league/v4/leagues/{id}`
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
        return this.Riot_V4_API.summoners.by_name.replace("{summonerName}", summonername)
    }
    getLeagueByUserId(userId, apiKey) {
        return this.Riot_V4_API.league.by_summoner.replace("{id}", userId)
    }
}

