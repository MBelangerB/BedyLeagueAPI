'use strict';

const path = require('path');
const fs = require('fs');

const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const { JSONFileReader } = require(__dirname + '/../util/fileReader');

class extensionFileData {
    /* Définition des chemins */
    basePath = path.join(`${__dirname}`, '/..');
    dataPath = path.join(`${__dirname}`, '/..', '/data/');

    /* Définition du data */
    username = '';
    token = '';
    userData = {};

    /* Mis en place des fonctions */
    constructor(username, token) {
        this.username = username;
        this.token = token;
        this.createDate = new Date();
    }

    /**
     * Effectue la lecture du JSON contenant les X dernières chansons.
     */
    async loadUserPlaylist() {
        let data;
        return new Promise(async (resolve, reject) => {
            try {
                if (fs.existsSync(this.getExtensionFileFullPath(this.token))) {
                    await this.readFile(this.getExtensionFileFullPath(this.token)).then(f => {
                        data = f;
                    });
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
                return;
            }
            this.userData = data;
            resolve(data);
        });
    }

    /**
     * Effectue la création des répertoires pour la configuration et la gestion des fichiers dragons.
     */
    async initFolder() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.createNewFolder(this.dataPath);

            } catch (ex) {
                console.error(ex);
                reject(ex);
                return;
            }
            resolve(true);
        });
    }
    async createExtensionFile(token) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs.existsSync(this.getExtensionFileFullPath(token))) {
                    this.userData = { 'username': this.username,
                                        'createDate': this.createDate.toLocaleDateString('fr-CA'),
                                        'current': {},
                                        'playlist': [] };

                    await writeFile(this.getExtensionFileFullPath(token), this.castDataToJSON(this.userData));
                }

            } catch (ex) {
                console.error(ex);
                reject(ex);
                return;
            }
            resolve(this.userData);
        });
    }
    async updateExtensionFile(token) {
        return new Promise(async resolve => {
            if (fs.existsSync(this.getExtensionFileFullPath(token))) {
                await writeFile(this.getExtensionFileFullPath(token), this.castDataToJSON(this.userData));
                console.log(`  Mise-à-jour du fichier pour ${token}`);
            }
            resolve(this.userData);
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
    castDataToJSON(data) {
        return JSON.stringify(data, null, 2);
    }
    getExtensionFileFullPath(token) {
        return path.join(`${this.dataPath}`, `${token}.json`);
    }


    /**
     *   Effectue la création des répertoires
     */
    async createNewFolder(folder) {
        return new Promise(async (resolve, reject) => {
            try {
                if (folder) {
                    if (!fs.existsSync(folder)) {
                        await fs.mkdirSync(folder);
                        console.log(`  Le répertoire '${folder}' a été crée avec succès.`);
                    } else {
                        console.log(`  Le répertoire '${folder}' existe déjà.`);
                    }
                    resolve(true);
                } else {
                    console.log(`  Erreur! Il est impossible d'effectuer la création du répertoire '${folder}'.`);
                    reject(false);
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }


}

module.exports = extensionFileData;