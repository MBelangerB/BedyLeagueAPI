'use strict';

const infoJson = require('../static/info.json');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

require('../util/Prototype');
const util = require('util');
const { basename } = require('path');
const writeFile = util.promisify(fs.writeFile);
const { JSONFileReader } = require(__dirname + '/../util/fileReader');

class dragonUpdate {
    /* Définition des chemins */
    basePath = path.join(`${__dirname}`, '/..');

    configPath = path.join(`${__dirname}`, '/..', '/config/');
    configFileName = 'bedyapi.json';

    dragonPath = path.join(`${__dirname}`, '/..', '/static/dragon/');

    /* Définition du data */
    apiConfig = {};
    currentVersion = '';

    needUpdate = false;

    log = { data:[] };


    /* Mis en place des fonctions */
    addLog(message) {
        this.log.data.push(message);
    }

    /**
     * Charge le fichier de configuration de API (version Dragon)
     */
    async loadAPIConfigFile() {
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
                return;
            }
            this.apiConfig = data;
            this.currentVersion = data.dragonVersion;
            resolve(data);
        });
    }

    /**
     * Effectue la création des répertoires pour la configuration et la gestion des fichiers dragons.
     */
    async initFolder() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.createNewFolder(this.configPath);
                 //   console.info(this.log);
                if (!fs.existsSync(this.getConfigFullPath())) {
                    await writeFile(this.getConfigFullPath(), this.castDataToJSON({ 'dragonVersion': '1.0' }));
                }

                await this.createNewFolder(this.getDragonFullPath());
                await this.createNewFolder(this.getDragonFullPath('/en_us/'));
                await this.createNewFolder(this.getDragonFullPath('/fr_fr/'));
            } catch (ex) {
                console.error(ex);
                reject(ex);
                return;
            }
            resolve(true);
        });
    }


    /**
     *   Effectue la création des répertoires
     */
    async createNewFolder(folder) {
        // var vm = this;
        return new Promise(async (resolve, reject) => {
            try {
                if (folder) {
                    if (!fs.existsSync(folder)) {
                        await fs.mkdirSync(folder);

                        // vm.addLog(`  Le répertoire '${folder}' a été crée avec succès.`);
                        console.log(`  Le répertoire '${folder}' a été crée avec succès.`);
                    } else {
                        // vm.addLog(`  Le répertoire '${folder}' existe déjà.`);
                        console.log(`  Le répertoire '${folder}' existe déjà.`);
                    }
                    resolve(true);
                } else {
                    console.warn(`  Erreur! Il est impossible d'effectuer la création du répertoire '${folder}'.`);
                    reject(false);
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }


    /**
    *   Télécharge le fichier de version et détermine si une MAJ est requise
    */
    async downloadVersionFile() {
        const url = infoJson.dragon.version;
        let data;
        let requestComplete = false;
        let latestVersion = '';

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
                    const filepath = this.getDragonFullPath('/version.json');
                    if (typeof (data) !== 'string') {
                        await writeFile(filepath, JSON.stringify(data));
                    } else {
                        await writeFile(filepath, data);
                    }

                    const oldestVersion = this.currentVersion.replaceAll('[.]', '');
                    const newVersion = latestVersion.replaceAll('[.]', '');

                    this.needUpdate = (parseInt(oldestVersion) < parseInt(newVersion));
                    if (this.needUpdate) {
                        this.currentVersion = latestVersion;
                        await this.updateAPIConfig();
                        await this.loadAPIConfigFile();
                        console.log('  Config interna a été mis-à-jour');
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
    async downloadFileData(lang) {
        if (!lang) { lang = 'fr_FR';}

        const championsUrl = infoJson.dragon.champions.replace('{version}', this.currentVersion).replace('{lang}', lang);
        const iconsUrl = infoJson.dragon.profileIcons.replace('{version}', this.currentVersion).replace('{lang}', lang);
        const spellsUrl = infoJson.dragon.summonerSpells.replace('{version}', this.currentVersion).replace('{lang}', lang);
        const runesReforgedUrl = infoJson.dragon.runesReforged.replace('{version}', this.currentVersion).replace('{lang}', lang);
        // const queueUrl = infoJson.dragon.queues;
        // const seasonUrl = infoJson.dragon.seasons;


        let fileName = '';
        let data;
        const ext = this;
        return new Promise(async function (resolve) {

            console.info(`[DragonUpdate] - Download file : ${championsUrl}`);
            await ext.ExecuteRequest(championsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${lang}/${basename(championsUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            console.info(`[DragonUpdate] - Download file : ${iconsUrl}`);
            await ext.ExecuteRequest(iconsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${lang}/${basename(iconsUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            console.info(`[DragonUpdate] - Download file : ${spellsUrl}`);
            await ext.ExecuteRequest(spellsUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${lang}/${basename(spellsUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            console.info(`[DragonUpdate] - Download file : ${runesReforgedUrl}`);
            await ext.ExecuteRequest(runesReforgedUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${lang}/${basename(spellsUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
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

    async downloadStaticData() {
        const queueUrl = infoJson.dragon.queues;
        const seasonUrl = infoJson.dragon.seasons;

        let fileName = '';
        let data;
        const ext = this;
        return new Promise(async function (resolve) {

            console.info(`[DragonUpdate] - Download file : ${queueUrl}`);
            await ext.ExecuteRequest(queueUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${basename(queueUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
                    data = ext.castDataToJSON(data);
                    await writeFile(filepath, data);
                }
            }, function (error) {
                console.log(error);
                data = null;
            });

            console.info(`[DragonUpdate] - Download file : ${seasonUrl}`);
            await ext.ExecuteRequest(seasonUrl).then(async function (res) {
                data = res;
                if (data) {
                    fileName = `/${basename(seasonUrl)}`;
                    const filepath = ext.getDragonFullPath(fileName);
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

            axios({
                url: encodeURI(requestUrl),
                method: 'get',
                responseType: 'json',
                transformResponse: [function (data) {
                    try {
                        if (data) {
                            // Do whatever you want to transform the data
                            return JSON.parse(data);
                        }
                    } catch (ex) {
                        return data;
                    }

                }],
            }).then(response => {
                if (response.status === 200 && response.statusText === 'OK') {
                    resolve(response.data);

                } else if (response.status === 404) {
                    reject(response);
                } else {
                    console.error(response.status);
                    reject(response);
                }
            }).catch(error => {
                console.error(`An error occured in DragonUpdate.ExecuteRequest.\n ${error}`);
                reject(error);
            });
        });
    }

    /*
        Write data to file
    */
    async updateAPIConfig() {
        return new Promise(async resolve => {
            if (fs.existsSync(this.getConfigFullPath())) {
                await writeFile(this.getConfigFullPath(), this.castDataToJSON({ 'dragonVersion': this.currentVersion }));
                console.log('  Mise-à-jour de BedyConfig');
            }
            resolve(true);
        });
    }

    async readFile(filePath) {
        let data;
        return new Promise(async resolve => {
            await JSONFileReader(filePath).then(function (f) {
                data = f;
            });

            resolve(data);
        });
    }

    /*
        Private function
    */

    /**
     * Retourne la localisation complète du répetoire «Dragon»
     * @param {*} culture
     */
    getDragonFullPath(culture) {
        if (!culture || typeof culture === 'undefined') { culture = ''; }
        const fpath = `${this.dragonPath}${culture}`;
        return path.join(fpath);
    }
    castDataToJSON(data) {
        return JSON.stringify(data, null, 2);
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