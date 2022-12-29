import path, { basename } from 'path';
import services from './file-service';
import infoData from '../static/info.json';
import dragonModel, { IChampionData, IDragonData } from '../models/dragon/dragon-model';
import { DragonCulture } from '../declarations/enum';
import { IChampion } from '../models/riot/ChampionInfo';

// **** Variables **** //

// Errors
export const errors = {
    unauth: 'Unauthorized',
    uninitialized: 'The \'Dragon\' files have not been initialized. Please initialize it first.',
    errGetDragonVersion: 'An error occured in DragonService.getDragonVersion',
    errReadDragonFile: 'An error occured in DragonService.readDragonFile',
} as const;

// Dragon file path
export const dragonPath = {
    basePath: path.join(`${__dirname}`, '/..'),
    staticFolder: path.join(`${__dirname}`, '/..', '/static/'),
    dragonStaticFolder: path.join(`${__dirname}`, '/..', '/static/dragon'),
    versionFilePath: path.join(`${__dirname}`, '/..', '/static/dragon', 'version.json'),
    dragonFilePath: (filename: string) => path.join(`${__dirname}`, '/..', '/static/dragon', filename),
} as const;

export const dragonFileName = {
    champion: 'champion.json',
};

// Class
export class DragonService {

    /**
     * Retourne la localisation complète du répetoire «Dragon»
     * @param {string} culture Culture @default DragonCulture.fr_fr
     * @param fileName file to open
     * @returns File path
     */
    static getDragonFullPath(culture?: DragonCulture, fileName = ''): string {
        if (!culture) {
            return dragonPath.dragonStaticFolder;

        } else if (!fileName || fileName.length == 0) {
                return path.join(`${dragonPath.dragonStaticFolder}`, culture);
            } else {
                return path.join(`${dragonPath.dragonStaticFolder}`, culture, fileName);
            }
    }

    /**
     * Returns the base path for dragon folder
     * @returns {string} Path des fichiers statics
     */
    private static getDragonBasePath(): string {
        return dragonPath.dragonStaticFolder;
    }

    /**
     * Return dragon version path location
     * @returns {string}
     */
    private static getDragonVersionPath(): string {
        return dragonPath.versionFilePath;
    }

    /**
     * Read Dragon Version file for check last version
     * @returns
     */
    static getDragonVersion(): Promise<IDragonData> {
        const data: IDragonData = {
            currentVersion: null,
            errorMsg: null,
        };

        return new Promise(async (resolve: any, reject: any) => {
            try {
                // Check if Dragon file and dragon version exists
                if (await !services.FileService.checkFileExists(this.getDragonBasePath()) ||
                    await !services.FileService.checkFileExists(this.getDragonVersionPath())) {
                    data.errorMsg = errors.uninitialized;
                    resolve(data);
                    return;
                }

                // Read version file if exists
                let tmpData!: any[];
                let invalidFile = false;
                await services.readInternalFile(this.getDragonVersionPath()).then(fileContent => {
                    if (typeof (fileContent) !== 'string') {
                        tmpData = fileContent;
                    } else {
                        tmpData = JSON.parse(fileContent);
                    }

                }).catch(err => {
                    if (err && err?.message == 'Unexpected end of JSON input') {
                        invalidFile = true;
                        return;
                    } else {
                        throw err;
                    }

                });

                if (invalidFile) {
                    data.errorMsg = errors.uninitialized;
                    resolve(data);
                    return;
                }

                if (typeof tmpData !== 'undefined' && tmpData.length > 0) {
                    data.currentVersion = tmpData[0];
                }

            } catch (ex) {
                data.errorMsg = errors.errGetDragonVersion;

                console.error(errors.errGetDragonVersion);
                console.error(ex);

                reject(data);
                return;
            }

            resolve(data);
        });
    }

    static readDragonFile(filename: string, culture: DragonCulture): Promise<any> { // Promise<Array<IChampionData>> {
        return new Promise(async (resolve: any, reject: any) => {
            let fileData: any = null;
          //  let result: Array<IChampionData> = new Array<IChampionData>;

            try {
                await services.readInternalFile(this.getDragonFullPath(culture, filename)).then(fileContent => {
                    if (typeof (fileContent) !== 'string') {
                        fileData = fileContent;
                    } else {
                        fileData = JSON.parse(fileContent);
                    }
                    // Impossible de FIND dans ca
                    // if (fileData && fileData.data) {
                    //     result = fileData.data;
                    // }

                }).catch(err => {
                    if (err && err?.message == 'Unexpected end of JSON input') {
                        return;
                    } else {
                        throw err;
                    }

                });
            } catch (ex) {
                console.error(errors.errReadDragonFile);
                console.error(ex);

                reject(fileData);
            }

            resolve(fileData);
        });
    }

    /**
     * Process on reading on champion dragon file.
     * @param culture 
     * @returns 
     */
    static async readDragonChampionFile(culture: DragonCulture) : Promise<IChampion[]> {
        const readResult = new Promise<IChampion[]>(async (resolve: any, reject: any) => {
            const championData: Array<IChampion> = new Array<IChampion>;

            try {
                const dragonChampion: any = await DragonService.readDragonFile(dragonFileName.champion, culture);
                if (dragonChampion.type == 'champion') {
                    for (const keyName in dragonChampion.data) {
                        const dragonChampionInfo = dragonChampion.data[keyName];
                        if (dragonChampionInfo) {
                            const champion: IChampion = {
                                id: dragonChampionInfo.key,
                                name: dragonChampionInfo.name,
                            };
                            championData.push(champion);
                        }
                    }
                }
            } catch (ex) {
                reject(ex);
            }

            resolve(championData);
        });

        return Promise.resolve(readResult);
    }

    /**
     * Prepare dragon file tree
     */
    static async prepareTree(dragonCulture: DragonCulture, dataDragon: IDragonData) {
        if (!dataDragon.message) {
            dataDragon.message = new Array<string>;
        }

        if (!services.FileService.checkFileExists(dragonPath.dragonStaticFolder)) {
            dataDragon.message.push(await services.FileService.createFolder(dragonPath.dragonStaticFolder));
        }

        let cultureFolder: string = DragonService.getDragonFullPath(dragonCulture);
        if (!services.FileService.checkFileExists(cultureFolder)) {
            dataDragon.message.push(await services.FileService.createFolder(cultureFolder));
        }

        cultureFolder = DragonService.getDragonFullPath(dragonCulture);
        if (!services.FileService.checkFileExists(cultureFolder)) {
            dataDragon.message.push(await services.FileService.createFolder(cultureFolder));
        }
    }

    /**
     * Download dragon file (not for version.json)
     * @param url
     * @param dragonCulture
     * @returns
     */
    static async downloadDragonFile(url: string, dragonCulture: DragonCulture, dataDragon: IDragonData) {
        return new Promise(async (resolve: any, reject: any) => {
            await services.downloadExternalFile(url).then(async fileContent => {

                const filename = basename(url);
                const filePath: string = DragonService.getDragonFullPath(dragonCulture, filename);
                const message: string = await services.FileService.writeFile(filePath, fileContent);

                if (message && message.length > 0) {
                    dataDragon.message?.push(message);
                }

                resolve(true);

            }).catch(err => {
                reject(err);
            });
        });
    }

    static async downloadDragonVersionFile(dataDragon: IDragonData, previousVersion: number): Promise<boolean> {
        return new Promise(async (resolve: any, reject: any) => {
            let requiredUpdate = false;
            try {
                const versionUrl = infoData.dragon.version;

                await services.downloadExternalFile(versionUrl).then(async fileContent => {
                    let newVersion: number = previousVersion;

                    if (typeof fileContent !== 'undefined' && fileContent.length > 0) {
                        newVersion = dragonModel.castToNumber(fileContent[0]);
                        dataDragon.currentVersion = fileContent[0];
                    }

                    requiredUpdate = (previousVersion < newVersion);
                    if (requiredUpdate) {
                        const message: string = await services.FileService.writeFile(dragonPath.versionFilePath, fileContent);
                        if (message && message.length > 0) {
                            dataDragon.message?.push(message);
                        }
                    }

                }).catch(err => {
                    throw err;
                });

                resolve(requiredUpdate);

            } catch (ex) {
                reject(ex);
            }
            return requiredUpdate;
        });

    }

}

// **** Functions **** //

/**
 * Call to get the current version of the dragon files.
 * @returns
 */
async function getVersion(): Promise<IDragonData> {
    return await DragonService.getDragonVersion();
}

/**
 * Call to update dragons files. Does nothing if the files are already up to date.
 * TODO: Vérifier les fichiers en fonction de la culture. Si on passe une autre culture on reçoit « deja a jour »
 */
async function updateDragon(forceUpdate = false, dragonCulture: DragonCulture): Promise<IDragonData> {
    // Get current version
    let oldestVersion = 0;

    const dataDragon: IDragonData = await DragonService.getDragonVersion();
    if (!forceUpdate && dataDragon.currentVersion && typeof dataDragon.currentVersion !== 'undefined') {
        oldestVersion = dragonModel.castToNumber(dataDragon.currentVersion as string);
    }
    dataDragon.previousVersion = (dataDragon.currentVersion || '0');

    // If the oldest version is 0. Maybe the path folder doesn't exist.
    if (oldestVersion == 0) {
        await DragonService.prepareTree(dragonCulture, dataDragon);
    }

    // Read new version file to validate if update is required
    let needUpdate = false;
    await DragonService.downloadDragonVersionFile(dataDragon, dragonModel.castToNumber(dataDragon.previousVersion)).then(requiredUpdate => {
        needUpdate = requiredUpdate;
    }).catch(err => {
        console.error(err);
    });

    dataDragon.message = new Array<string>;
    if (needUpdate) {
        const dragonChampionUrl = infoData.dragon.champions.replace('{version}', dataDragon.currentVersion as string).replace('{lang}', dragonCulture);
        const dragonProfileIconsUrl = infoData.dragon.profileIcons.replace('{version}', dataDragon.currentVersion as string).replace('{lang}', dragonCulture);

        await DragonService.downloadDragonFile(dragonChampionUrl, dragonCulture, dataDragon).then(state => {
            return true;
        }).catch(err => {
            console.error(err);
        });

        await DragonService.downloadDragonFile(dragonProfileIconsUrl, dragonCulture, dataDragon).then(state => {
            return true;
        }).catch(err => {
            console.error(err);
        });

    } else {
        dataDragon.message?.push('Les fichiers sont déjà à jour.');
    }

    return dataDragon;
}


// **** Export default **** //

export default {
    dragonPath,
    dragonFileName,
    getVersion,
    updateDragon,
} as const;
