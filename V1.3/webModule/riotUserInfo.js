const RiotUserInfoDTO = require('../class/riotUserInfoDTO')
var fs = require('fs');

var riotUserInfo = {
    defaultPath: './data/',
    filePathName: '',

    jsonGabarit: { data: [] },
    userInfos: [],

    addUser: async function (userInfo, autoSave) {
        if (userInfo) {
            riotUserInfo.jsonGabarit.data.push(userInfo);
        }
        if (autoSave) {
            await this.updateFile();
        }
        return true;
    },
    removeUser: function (userInfo) {
        var index = array.indexOf(userInfo);
        if (index > -1) {
            array.splice(index, 1);
        }
        /*
        var existingUser =  riotUserInfo.jsonGabarit.data.find(e => e.Id === userInfo.Id);
        if (existingUser) {
            riotUserInfo.jsonGabarit.data.pop(userInfo);
        }
        */
    },
    clear: function () {
        riotUserInfo.userInfos = [];
    },

    loadRiotUserInfo: async function () {
        // Obtenir le nom du fichier
        var filename = `bedyApi_userData.json`;
        var filepath = riotUserInfo.defaultPath + filename;
        riotUserInfo.filePathName = filepath;

        var result = await fs.readFileSync(riotUserInfo.filePathName);
        if (result && result.length > 0) {
            const fileData = JSON.parse(result)
            fileData.data.map(function (item) {
                var userDTO = new RiotUserInfoDTO();

                userDTO.init(item.id,
                    item.summonerId, item.summonerName, item.summonerLevel, item.region,
                    item.accountId, item.puuid, item.revisionDate);

                riotUserInfo.addUser(userDTO);
            });
        }
        /*
        fs.readFile(riotUserInfo.filePathName, 'utf8', (err, json) => {
            if (err) {
                console.error(err)
                throw err
            }

            const fileData = JSON.parse(json)
            fileData.data.map(function (item) {
                var userDTO = new RiotUserInfoDTO();

                userDTO.init(item.id,
                    item.summonerId, item.summonerName, item.summonerLevel, item.region,
                    item.accountId, item.puuid, item.revisionDate);

                riotUserInfo.addUser(userDTO);
            });
        });
        */
    },



    findCmdById: function (id) {
    //    riotUserInfo.jsonGabarit.data
    // riotUserInfo.userInfos
        if (riotUserInfo.jsonGabarit === null || riotUserInfo.jsonGabarit.data.length === 0) {
            riotUserInfo.loadRiotUserInfo();
        }

        var existingUser = riotUserInfo.jsonGabarit.data.find(e => e.id === id);
        return existingUser;
    },


    updateFile: async function () {
        const jsonData = JSON.stringify(riotUserInfo.jsonGabarit, null, 2);
        await fs.writeFileSync(riotUserInfo.filePathName, jsonData, 'utf8');
        console.log('Saved data to file.');
    },

    loadOrCreateFile: async function () {
        var filename = `bedyApi_userData.json`;
        var filepath = riotUserInfo.defaultPath + filename;
        riotUserInfo.filePathName = filepath;

        // Vérifie si le fichier existe, s'il n'existe pas on le créer
        if (!fs.existsSync(riotUserInfo.filePathName)) {
            //   await fs.exists(filepath, function (exists) {
            try {
                await this.updateFile();
                /*
                const jsonData = JSON.stringify(riotUserInfo.jsonGabarit, null, 2);
                await fs.writeFileSync(riotUserInfo.filePathName, jsonData, 'utf8');
*/
                /*
                fs.writeFile(riotUserInfo.filePathName, jsonData, 'utf8', function callBack() {
                    console.log("Write Success");
                });
                */
                /*
                 console.log('Saved data to file.');
                 */
            } catch (error) {
                console.log("Err during save")
                console.error(error)
            }
            //  });
        } else {
            await this.loadRiotUserInfo();
        }


    },

}

module.exports = riotUserInfo;