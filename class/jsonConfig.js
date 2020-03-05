'use strict';

var fs = require('fs');

class jsonConfig {
    constructor(fileName) {
        this.fileName = fileName;
        this.data = [];
        this.updateData = [];
    }

    async loadData() {
        if (this.fileName) {
            var result = await fs.readFileSync(this.fileName) /*, (err, data) => {
                if (err) throw err;
                let result = JSON.parse(data);
             //   console.log(result);

                this.data = result;
                this.updateData = result;
            });*/
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
    // fs.writeFile('myjsonfile.json', json, 'utf8', callback);

}
module.exports = jsonConfig;