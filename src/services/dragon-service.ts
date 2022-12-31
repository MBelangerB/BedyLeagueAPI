import path, { basename } from 'path';
import services from './file-service';
import infoData from '../static/info.json';
import dragonModel, { IDragonData } from '../models/dragon/dragon-model';
import { DragonCulture } from '../declarations/enum';
import { IChampion } from '../models/riot/ChampionInfo';
import { ReturnData } from '../models/IReturnData';
import HttpStatusCodes from '../declarations/major/HttpStatusCodes';
import { AxiosError } from 'axios';

// **** Variables **** //

// Errors
export const localization = {
    unauth: 'Unauthorized',
    uninitialized: 'The \'Dragon\' files have not been initialized. Please initialize it first.',
    errGetDragonVersion: 'An error occured in DragonService.getDragonVersion',
    errReadDragonFile: 'An error occured in DragonService.readDragonFile',
    errDownloadingFile: 'An error occurred while downloading the file.',
    msgFileAlreadyUpdated: 'The files are already up to date.',
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
    static getDragonVersion(retData: ReturnData<IDragonData>): Promise<IDragonData> {
        const data: IDragonData = {
            currentVersion: null,
            previousVersion: '0',
        };

        /* eslint-disable @typescript-eslint/no-explicit-any */
        /* eslint-disable no-async-promise-executor */
        return new Promise(async (resolve: any, reject: any) => {
            try {
                // Check if Dragon file and dragon version exists
                if (await !services.FileService.checkFileExists(this.getDragonBasePath()) ||
                    await !services.FileService.checkFileExists(this.getDragonVersionPath())) {

                    retData.addMessage(localization.uninitialized);
                    retData.code = HttpStatusCodes.OK;

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
                    retData.addMessage(localization.uninitialized);
                    retData.code = HttpStatusCodes.OK;

                    resolve(data);
                    return;
                }

                if (typeof tmpData !== 'undefined' && tmpData.length > 0) {
                    data.currentVersion = tmpData[0];
                }

            } catch (ex) {
                console.error(localization.errGetDragonVersion);
                console.error(ex);

                retData.addMessage(localization.errGetDragonVersion);
                retData.code = HttpStatusCodes.INTERNAL_SERVER_ERROR;

                reject(data);
                return;
            }

            retData.data = data;

            resolve(data);
        });
    }

    static async readDragonFile(filename: string, culture: DragonCulture): Promise<any> {
        return new Promise(async (resolve: any, reject: any) => {
            let fileData: any = null;
            try {
                await services.readInternalFile(this.getDragonFullPath(culture, filename)).then(fileContent => {
                    if (typeof (fileContent) !== 'string') {
                        fileData = fileContent;
                    } else {
                        fileData = JSON.parse(fileContent);
                    }
                }).catch(err => {
                    if (err && err?.message == 'Unexpected end of JSON input') {
                        return;
                    } else {
                        throw err;
                    }

                });
            } catch (ex: any) {
                if (!ex?.message.includes('ENOENT: no such file or directory')) {
                    console.error(localization.errReadDragonFile);
                    console.error(ex);
                }
  
                reject(fileData);
                return;
            }

            resolve(fileData);
        });
    }

    /**
     * Process on reading on champion dragon file.
     * @param culture
     * @returns
     */
    static async readDragonChampionFile(culture: DragonCulture): Promise<IChampion[]> {
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
    static async prepareTree(dragonCulture: DragonCulture, data: ReturnData<IDragonData>) {
        if (!services.FileService.checkFileExists(dragonPath.dragonStaticFolder)) {
            data.addMessage(await services.FileService.createFolder(dragonPath.dragonStaticFolder));
        }

        let cultureFolder: string = DragonService.getDragonFullPath(dragonCulture);
        if (!services.FileService.checkFileExists(cultureFolder)) {
            data.addMessage(await services.FileService.createFolder(cultureFolder));
        }

        cultureFolder = DragonService.getDragonFullPath(dragonCulture);
        if (!services.FileService.checkFileExists(cultureFolder)) {
            data.addMessage(await services.FileService.createFolder(cultureFolder));
        }
    }

    /**
     * Download dragon file (not for version.json)
     * @param url
     * @param dragonCulture
     * @returns
     *
     * ReturnData<IDragonData>
     */
    static async downloadDragonFile(url: string, dragonCulture: DragonCulture, data: ReturnData<IDragonData>) {
        const downloadFile = new Promise((resolve: any, reject: any) => {
            services.downloadExternalFile(url).then(fileContent => {
                resolve(fileContent);
            }).catch(err => {
                reject(err);
            });
        });
        const fileContent: any = await Promise.resolve(downloadFile);

        if (fileContent) {
            const filename = basename(url);
            const filePath: string = DragonService.getDragonFullPath(dragonCulture, filename);

            const processFile = new Promise<string>((resolve: any, reject: any) => {
                try {
                    resolve(services.FileService.writeFile(filePath, fileContent));
                } catch (ex) {
                    reject(ex);
                }
            });

            const message: any = await Promise.resolve(processFile);
            if (message) {
                data.addMessage(message);
            }
        } else {
            throw new Error(localization.errDownloadingFile);
        }
    }

    /**
     * Download Dragon version file and update it if necessary
     * @param dataDragon
     * @param previousVersion
     * @returns
     */
    static async downloadDragonVersionFile(dataDragon: IDragonData, data: ReturnData<IDragonData>, previousVersion: number): Promise<boolean> {
        let requiredUpdate = false;
        let newVersion: number = previousVersion;

        const downloadFile = new Promise((resolve: any, reject: any) => {
            try {
                const versionUrl = infoData.dragon.version;
                services.downloadExternalFile(versionUrl).then(async fileContent => {
                    if (typeof fileContent !== 'undefined' && fileContent.length > 0) {
                        dataDragon.currentVersion = fileContent[0];
                    }
                    resolve(fileContent);
                }).catch(err => {
                    throw err;
                });
            } catch (ex) {
                reject(ex);
            }
            return requiredUpdate;
        });

        const fileContent: any = await Promise.resolve(downloadFile);

        if (fileContent) {
            newVersion = dragonModel.castToNumber(fileContent[0]);
            requiredUpdate = (previousVersion < newVersion);

            if (requiredUpdate) {
                const processFile = new Promise<boolean>((resolve: any, reject: any) => {
                    try {
                        resolve(services.FileService.writeFile(dragonPath.versionFilePath, fileContent));
                    } catch (ex) {
                        reject(ex);
                    }
                });

                const message: any = await Promise.resolve(processFile);
                if (message) {
                    data.addMessage(message);
                }
            }
        } else {
            throw new Error(localization.errDownloadingFile);
        }

        return requiredUpdate;
    }

}

// **** Functions **** //

/**
 * Call to get the current version of the dragon files.
 * @returns
 */
async function getVersion(data: ReturnData<IDragonData>): Promise<IDragonData> {
    return await DragonService.getDragonVersion(data);
}

/**
 * Call to update dragons files. Does nothing if the files are already up to date.
 * TODO: Vérifier les fichiers en fonction de la culture. Si on passe une autre culture on reçoit « deja a jour »
 */
async function updateDragon(forceUpdate = false, dragonCulture: DragonCulture): Promise<ReturnData<IDragonData>> {
    // Read current version files for get version
    const returnData: ReturnData<IDragonData> = new ReturnData<IDragonData>();
    const dataDragon: IDragonData = await DragonService.getDragonVersion(returnData);
    returnData.clear();
    dataDragon.previousVersion = (dataDragon.currentVersion || '0');

    // Create tree if doesn't exists
    await DragonService.prepareTree(dragonCulture, returnData);

    // Read new version file to validate if update is required
    let needUpdate = false;
    await DragonService.downloadDragonVersionFile(dataDragon, returnData, dragonModel.castToNumber(dataDragon.previousVersion)).then(requiredUpdate => {
        needUpdate = requiredUpdate;

    }).catch(err => {
        // TODO: Check err value ?
        console.error(err);

        returnData.code = HttpStatusCodes.INTERNAL_SERVER_ERROR;
        returnData.addMessage(localization.errDownloadingFile);
    });

    // If we dont have update, we check if file exists

    if (!needUpdate && !forceUpdate) {
        await DragonService.readDragonFile(dragonFileName.champion, dragonCulture).then(content => {
            if (content && content.version) {
                let newVersion: number =  dragonModel.castToNumber(content.version);
                let currentVersion: number = dragonModel.castToNumber(dataDragon.currentVersion as string);
                needUpdate = (newVersion < currentVersion);
            } else {
                needUpdate = true;
            }
        }).catch((err) => {
            // Do nothing
            if (!err) {
                needUpdate = true;
            }
        })
    }

    // Si changement de langue, il faudrait un moyen de keep info pour télécharger
    if (needUpdate || forceUpdate) {
        const dragonChampionUrl = infoData.dragon.champions.replace('{version}', dataDragon.currentVersion as string).replace('{lang}', dragonCulture);
        const dragonProfileIconsUrl = infoData.dragon.profileIcons.replace('{version}', dataDragon.currentVersion as string).replace('{lang}', dragonCulture);
    
        await DragonService.downloadDragonFile(dragonChampionUrl, dragonCulture, returnData).then(state => {
            return state;
        }).catch(err => {
            // TODO: Check err value ?
            if (err.response) {
                console.error(err.response);
            } else if (err.stack) {
                console.error(err.stack);
            } else {
                console.error(err);
            }


            returnData.code = HttpStatusCodes.INTERNAL_SERVER_ERROR;
            returnData.addMessage(localization.errDownloadingFile);
        });

        await DragonService.downloadDragonFile(dragonProfileIconsUrl, dragonCulture, returnData).then(state => {
            return state;
        }).catch(err => {
            // TODO: Check err value ?
            if (err.response) {
                console.error(err.response);
            } else if (err.stack) {
                console.error(err.stack);
            } else {
                console.error(err);
            }

            returnData.code = HttpStatusCodes.INTERNAL_SERVER_ERROR;
            returnData.addMessage(localization.errDownloadingFile);
        });

    } else {
        returnData.code = 200;
        returnData.addMessage(localization.msgFileAlreadyUpdated);
    }

    return returnData;
}


// **** Export default **** //

export default {
    dragonPath,
    dragonFileName,
    getVersion,
    updateDragon,
} as const;
