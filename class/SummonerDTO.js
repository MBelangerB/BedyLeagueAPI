const RiotUrlApi = require('./League/RiotUrlApi');
// const LoLRank = require('../module/LoLRank');
// var https = require('https');
var request = require('request');

module.exports = class SummonerDTO {
    constructor(rank) {
        this.name = '';
        this.id = '';
        this.accountId = '';
        this.summonerLevel = 0;
        this.profileIconId = 0;
        this.region = '*';

        if (rank) {
        //    this.LoLRank = rank;
            this.name = rank.summonerName;
            this.region = rank.region;
        }
    }

    init(name, id, accountid, summonerLevel, profileIcon, region) {
        this.name = name;
        this.id = id;
        this.accountId = accountid;
        this.summonerLevel = summonerLevel;
        this.profileIconId = profileIcon;
        this.region = region;
    }

    get getId() {
        return this.id;
    }
    get getSummonerName() {
        return this.name;
    }

    async getDTO(username, region, apiKey) {
        return new Promise(function (resolve, reject) {
            var RiotUrl = new RiotUrlApi();
            // TODO: Réadapter exclue param passé par header
            var options = {
                url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}`,
                headers: {
                    "Origin": null,
                    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Riot-Token": apiKey,
                    "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0"
                },
                json: true
            };

            request.get(options, function (err, respo, jsonData) {
                if (err) {
                    reject(err);
                } else if (respo.statusCode === 200) {
                    resolve(jsonData);
                } else {
                    reject(respo);
                }
            });

        });
    }
}