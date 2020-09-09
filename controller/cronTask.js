'use strict';

const infoJson = require('../static/info.json');

const path = require('path');
const fs = require('fs');
// var request = require('request');
var axios = require('axios'); 

const util = require("util");
const { basename } = require('path');
const writeFile = util.promisify(fs.writeFile);
const { JSONFileReader } = require(__dirname + "/fileReader");

class dragonUpdate {
    /* Définition des chemins */
    basePath = path.join(`${__dirname}`, '/..');

    configPath = path.join(`${__dirname}`, '/..', '/config/');
    configFileName = 'bedyapi.json';

    dragonPath = path.join(`${__dirname}`, '/..', '/dragon/');

    /* Définition du data */
    apiConfig = {};
    currentVersion = "";

    needUpdate = false;


    /* Mis en place des fonctions */
    constructor() {
    }

    async loadAPIConfigFile() {
        /*
        delete require.cache[require.resolve('../config/bedyapi.json')]   // Deleting loaded module
        config = require("../config/bedyapi.json");
        */
        let data;
        return new Promise(async (resolve, reject) => {
            try {
                if (fs.existsSync(this.getConfigFullPath())) {
                    await this.readFile(this.getConfigFullPath()).then(f => {
                        data = f;
                    });
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
            this.apiConfig = data;
            this.currentVersion = data.dragonVersion;
            resolve(data);
        });
    }


    async initFolder() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.createNewFolder(this.configPath);

                if (!fs.existsSync(this.getConfigFullPath())) {
                    await writeFile(this.getConfigFullPath(), this.castDataToJSON({ "dragonVersion": "1.0" }));
                }

                await this.createNewFolder(this.getDragonFullPath());
                await this.createNewFolder(this.getDragonFullPath("/en_us/"));
                await this.createNewFolder(this.getDragonFullPath("/fr_fr/"));
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
            resolve(true);
        });
    }


    /*
        Effectue la création des répertoires
    */
    async createNewFolder(folder) {
        return new Promise(async (resolve, reject) => {
            try {
                if (folder) {
                    if (!fs.existsSync(folder)) {
                        await fs.mkdirSync(folder);
                        console.log(`  Le répertoire '${folder}' a été crée avec succès.`);
                    } else {
                        console.log(`  Le répertoire ${folder} existe déjà.`)
                    }
                    resolve(true);
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }


    async downloadVersionFile() {
        let url = infoJson.dragon.version;
        let data;
        let requestComplete = false;
        let latestVersion = "";

        return new Promise(async (resolve, reject) => {
            try {
                await this.ExecuteRequest(url).then(function (res) {
                    data = res;

                    latestVersion = data[0];
                    console.log(`  Latest : ${data[0]}`);

                    requestComplete = true;

                }, function (error) {
                    console.log(error);
                    data = null;
                });

                if (requestComplete) {
                    var filepath = this.getDragonFullPath(`/version.json`);
                    await writeFile(filepath, data);

                    this.needUpdate = (this.currentVersion < latestVersion);
                    if (this.needUpdate) {
                        this.currentVersion = latestVersion;
                        await this.updateAPIConfig();
                        await this.loadAPIConfigFile();
                    } else {
                        console.log('  Les fichiers sont à jours');
                    }
                }

                resolve(this.needUpdate);
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }
    async downloadFileData() {
        let championsUrl = infoJson.dragon.champions.replace(`{version}`, this.currentVersion).replace(`{lang}`, 'fr_FR');
        let iconsUrl = infoJson.dragon.profileIcons.replace(`{version}`, this.currentVersion).replace(`{lang}`, 'fr_FR');
        let spellsUrl = infoJson.dragon.summonerSpells.replace(`{version}`, this.currentVersion).replace(`{lang}`, 'fr_FR');
        let runesReforgedUrl = infoJson.dragon.runesReforged.replace(`{version}`, this.currentVersion).replace(`{lang}`, 'fr_FR');

        let fileName = '';
        let data;
        let ext = this;
        return new Promise(async function (resolve, reject) {

            await ext.ExecuteRequest(championsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/fr_fr/${basename(championsUrl)}`;
                    var filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            await ext.ExecuteRequest(iconsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/fr_fr/${basename(iconsUrl)}`;
                    var filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            await ext.ExecuteRequest(spellsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/fr_fr/${basename(spellsUrl)}`;
                    var filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            await ext.ExecuteRequest(runesReforgedUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/fr_fr/${basename(spellsUrl)}`;
                    var filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            resolve(true);
        });
    }

    /*
        Methode base pour executer Query
    */
    async ExecuteRequest(requestUrl) {
        return new Promise(function (resolve, reject) {
  
            const instance = axios({
                url: encodeURI(requestUrl),
                method: 'get',
                responseType: 'json',
                transformResponse: [function (data) {
                    // Do whatever you want to transform the data         
                    return JSON.parse(data);
                }],
            }).then(response => {
                if (response.status === 200 && response.statusText === 'OK') {
                    resolve(response.data);

                } else if (response.status === 404) {
                    reject(response)
                }
            }).catch(error => {
                console.error(error);
                reject(error);
            });
        });

        return new Promise(function (resolve, reject) {

            var options = {
                url: encodeURI(requestUrl),
                json: true
            };

            request.get(options, function (err, respo, body) {
                if (err) {
                    console.error(err);
                    reject(err);

                } else if (respo.statusCode === 200) {
                    resolve(body);

                } else if (respo.statusCode === 404) {
                    reject(body)

                } else {
                    reject(respo);
                }
            });
        });
    }

    /*
        Write data to file
    */
    async updateAPIConfig() {
        return new Promise(async resolve => {
            if (fs.existsSync(this.getConfigFullPath())) {
                await writeFile(this.getConfigFullPath(), this.castDataToJSON({ "dragonVersion": this.currentVersion }));
                console.log('  Mise-à-jour de BedyConfig')
            }
            resolve(true);
        });
    }

    async readFile(filePath) {
        var data;
        return new Promise(async resolve => {
            await JSONFileReader(filePath).then(function (f) {
                data = f;
            });

            resolve(data)
        });
    }

    /*
        Private function
    */

    getDragonFullPath(culture) {
        if (!culture || typeof culture === "undefined") { culture = ""; }
        var fpath = `${this.dragonPath}${culture}`;
        return path.join(fpath);
    }
    castDataToJSON(data) {
        return JSON.stringify(data, null, 2)
    }
    getConfigFullPath() {
        return path.join(`${this.configPath}`, `${this.configFileName}`);
    }

    /* Charge le fichier de configuration */
    async loadAPIConfig() {
        await this.loadAPIConfigFile().then(f => {
            this.apiConfig = f;
            if (this.apiConfig) {
                this.currentVersion = this.apiConfig.dragonVersion;
                this.needUpdate = false;
            }
        });
    }
}

module.exports = dragonUpdate;