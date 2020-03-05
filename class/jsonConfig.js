'use strict';

var fs = require('fs');
// const CacheService = require('../module/Cache.Service');

/*
    Cache configuration
*/
/*
var ttSummonerInfo = 60 * 60 * 1 * 24; // cache for 1 Hour
var ttLeagueInfo = 60 * 1; // cache for 1 mn (60 sec * 1 min)

var summonerCache = new CacheService(ttSummonerInfo); // Create a new cache service instance
var LeagueCache = new CacheService(ttLeagueInfo); // Create a new cache service instance
*/

class jsonConfig {
    constructor(fileName) {
        this.fileName = fileName;
        this.data = [];
        this.updateData = [];
    }

    async loadData() {
        if (this.fileName) {
            var result = await fs.readFileSync(this.fileName);

            if (result && result.length > 0) {
                let dta = JSON.parse(result);
                this.data = dta;
                this.updateData = dta;
            }
        }

        return (this.data);
    }

    loadDataNoSync() {
        if (this.fileName) {
            var result = fs.readFileSync(this.fileName);

            if (result && result.length > 0) {
                let dta = JSON.parse(result);
                this.data = dta;
                this.updateData = dta;
            }
        }

        return (this.data);
    }

    replaceSummonerName(userId, summonerName) {
        if (userId && summonerName) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.summonerName = summonerName;
            }
            /*
            summonerCache.flush();
            LeagueCache.flush();
            */
        }
    }
    replaceRegionName(userId, region) {
        if (userId && region) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.region = region;
            }
        }
    }

    async saveFile() {
        if (this.fileName) {
            let data = JSON.stringify(this.updateData, null, 2);
            await fs.writeFileSync(this.fileName, data);
        }
    }
    // fs.writeFile('myjsonfile.json', json, 'utf8', callback);

}
module.exports = jsonConfig;