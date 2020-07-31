const LeagueQueue = require('./LeagueQueue');
/*
    Class pour contenir les information sur l'invocateur
    V2
*/
 class SummonerDTO {
    constructor(info) {
        this.name = '';
        this.id = '';
        this.accountId = '';
        this.profileIconId = 0;
        this.summonerLevel = 0;
        this.region = '*';

        this.Queues = [];

        if (info) {
            this.name = info.summonerName;
            this.region = info.region;
        }
    }

    init(jsonData) {
        this.id = jsonData.id;
        this.accountId = jsonData.accountId;
        this.profileIconId = jsonData.profileIconId;
        this.summonerLevel = jsonData.summonerLevel;
    }

    initQueue(jsonData) {
        var obj = this;
        jsonData.forEach(function(data) {
            var queue = new LeagueQueue(data.queueType);

            queue.hotStreak = data.hotStreak;
            queue.veteran = data.veteran;
            queue.inactive = data.inactive;
            queue.freshBlood = data.freshBlood;
    
            queue.wins = data.wins;
            queue.losses = data.losses;
            queue.leaguePoints = data.leaguePoints;
            queue.leagueId = data.leagueId;
       
            queue.rank = data.rank;
            queue.tier = data.tier;
    
            if (typeof data.miniSeries !== "undefined") {
                queue.series = {
                    enabled: true,
                    wins: data.miniSeries.wins,
                    losses: data.miniSeries.losses,
                    target: data.miniSeries.target,
                    progress: data.miniSeries.progress
                }
            }

            obj.Queues.push(queue);
        });
      
        
    }


    get getId() {
        return this.id;
    }
    get getSummonerName() {
        return this.name;
    }

    static getMappingQueueTypeToLeagueQueue() {
		return {
            'solo5': 'RANKED_SOLO_5x5',
            'solo': 'RANKED_SOLO_5x5',
            'soloq': 'RANKED_SOLO_5x5',
            'flex': 'RANKED_FLEX_SR',
            'flex5': 'RANKED_FLEX_SR',
			'tft': 'RANKED_TFT'
		};
    }
    static getMappingRegionToLeagueQueue() {
		return {
            'EUW': 'EUW1',
            'EUW1': 'EUW1',
            'NA': 'NA1',
            'NA1': 'NA1'
		};
    }

}

module.exports = SummonerDTO;