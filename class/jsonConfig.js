'use strict';

var fs = require('fs');
const shortid = require('shortid');
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
            var fName = this.fileName;
            if (!fs.existsSync(this.fileName)) {
                await this.createClientFile().then(function() {
                    console.log(`Le fichier '${fName}' a été créer avec succès.`);
                });
            }

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

    async createClientFile() {
        var frame = {
            "configuration": []
        };
        let data = JSON.stringify(frame, null, 2);
        /*
        fs.writeFile(this.fileName, data, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
        */
        await fs.writeFileSync(this.fileName, data);
    }
    async addNewClient(summonerName, region, twitchName) {
        var userInfo = this.data.configuration.find(e => e.summonerName === summonerName && e.region === region);
        var row = {};
        if (!userInfo) {
            var userId = shortid.generate();

            row = {
                "twitchName": twitchName,
                "userId": userId,
                "summonerName": summonerName,
                "region": region
            }

            this.data.configuration.push(row);
            this.updateData = this.data;
        } else {
            return {
                "err": `L'usager '${summonerName} (${region})' existe déjà.`
            }
        }

        return row;
        // await this.saveFile();
    }
}
module.exports = jsonConfig;