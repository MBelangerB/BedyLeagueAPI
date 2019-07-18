// NA
module.exports = class RiotUrlApi {
    constructor() {
        this.Riot_V4_API = {
            mainUrl: 'https://{region}.api.riotgames.com',
            status: `/lol/status/v3/shard-data`,
            summoners: {
                by_name: `/lol/summoner/v4/summoners/by-name/{summonerName}`
            },
            league: {
                by_summoner: `/lol/league/v4/entries/by-summoner/{encryptedSummonerId}`,
                leagues: `/lol/league/v4/leagues/{id}`
            },
            spectator: {
                activeGame: {
                    by_summoner: `/spectator/v4/active-games/by-summoner/{encryptedSummonerId}`
                }
            }
        }
    }

    get getV4API() {
        return this.Riot_V4_API;
    }


    getMainUrl(region) {
        return this.Riot_V4_API.mainUrl.replace("{region}", region)
    }
    getSummonerByName(summonerName, apiKey) {
        return this.Riot_V4_API.summoners.by_name.replace("{summonerName}", summonerName)
    }
    getLeagueByUserId(encryptedSummonerId, apiKey) {
        return this.Riot_V4_API.league.by_summoner.replace("{encryptedSummonerId}", encryptedSummonerId)
    }
    getCurrentGameByUserId(encryptedSummonerId, apiKey) {
        return  this.Riot_V4_API.spectator.activeGame.by_summoner.replace("{encryptedSummonerId}", encryptedSummonerId)
    }
}

