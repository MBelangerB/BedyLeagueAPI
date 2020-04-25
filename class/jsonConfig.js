'use strict';

var fs = require('fs');
const shortid = require('shortid');

class jsonConfig {
    constructor(fileName) {
        this.fileName = fileName;
        this.data = [];
        this.updateData = [];
    }

    /*
        Créer le fichier initial s'il n'existe pas.
    */
    async loadData() {
        if (this.fileName) {
            var fName = this.fileName;
            if (!fs.existsSync(this.fileName)) {
                await this.createClientFile().then(function () {
                    console.log(`Le fichier '${fName}' a été crée avec succès.`);
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

    /*
        Mets à jour toutes les informations sur l'usager
    */
    updateSummonerInfo(userId, summonerName, region, queue) {
        if (userId && summonerName) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.summonerName = summonerName;
                userInfo.queue = queue;
                userInfo.region = region;
            }
        }
    }
    /*
        Permet de modifier le SummonerName associé a un UserID
    */
    replaceSummonerName(userId, summonerName) {
        if (userId && summonerName) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.summonerName = summonerName;
            }
        }
    }
    /*
        Permet de modifier la Region associé a un UserID
    */
    replaceRegionName(userId, region) {
        if (userId && region) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.region = region;
            }
        }
    }
    /*
        Permet de modifier la Queue associé a un UserID
    */
    replaceQueueName(userId, queue) {
        if (userId && queue) {
            var userInfo = this.updateData.configuration.find(e => e.userId === userId.toString());
            if (userInfo) {
                userInfo.queue = queue;
            }
        }
    }

    /*
        Sauvegarde le fichier
    */
    async saveFile() {
        if (this.fileName) {
            let data = JSON.stringify(this.updateData, null, 2);
            await fs.writeFileSync(this.fileName, data);
        }
    }

    /*
        Initialise le fichier de configuration
    */
    async createClientFile() {
        var frame = {
            "configuration": []
        };
        let data = JSON.stringify(frame, null, 2);

        await fs.writeFileSync(this.fileName, data);
    }

    /*
        Si l'usager n'existe pas, ajoutes les informations dans la configuration.
        Si l'usager existe déjà, indique que l'usager existe.
    */
    async addNewClient(summonerName, region, twitchName, queue, userId) {
        var userInfo = this.data.configuration.find(e => e.summonerName === summonerName && e.region === region);
        var row = {};
        if (!userInfo) {
            if (!userId || userId.length() === 0) {
                userId = shortid.generate();
            }

            row = {
                "twitchName": twitchName,
                "userId": userId,
                "summonerName": summonerName,
                "region": region,
                "queue": (queue || "solo5")
            }

            this.data.configuration.push(row);
            this.updateData = this.data;

        } else {
            return {
                "err": `L'usager '${summonerName} (${region})' existe déjà.`
            }
        }

        return row;
    }

    /*
        Retire les informations sur l'usager des fichiers de configuration.
    */
    async removeClient(userId) {
        var userInfo = this.data.configuration.find(e => e.userId === userId);
        var userInfoIdx = this.data.configuration.findIndex(e => e.userId === userId);
        if (!userInfo) {
            this.updateData.configuration.slice(userInfoIdx, 1);
            // delete object['property']
        } else {
            return {
                "err": `Il n'existe aucun usagé associé à l'ID : '${userId}'.`
            }
        }
    }
}
module.exports = jsonConfig;