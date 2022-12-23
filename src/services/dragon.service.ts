import path, { basename } from 'path';
import fs from 'fs';
import fileService from './file.service';

// **** Variables **** //

// Errors
export const errors = {
    unauth: 'Unauthorized',
    uninitialized: 'The \'Dragon\' files have not been initialized. Please initialize it first.',
    errGetDragonVersion: 'An error occured in DragonService.getDragonVersion',
} as const;

export const dragonPath = {
    basePath: path.join(`${__dirname}`, '/..'),
    staticFolder: path.join(`${__dirname}`, '/..', '/static/'),
    dragonStaticFolder: path.join(`${__dirname}`, '/..', '/static/dragon'),
    versionFilePath: path.join(`${__dirname}`, '/..', '/static/dragon', 'version.json'),
} as const;

export class DragonService {

    /**
     * Retourne la localisation complète du répetoire «Dragon»
     * @param {*} culture
     */
    private static getDragonFullPath(culture: string): string {
        if (!culture || typeof culture === 'undefined') { culture = 'fr_fr'; }
        return path.join(`${dragonPath.dragonStaticFolder}`, culture);
    }

    /**
     * Returns the base path for dragon folder
     * @returns {string} Path des fichiers statics
     */
    private static getDragonBasePath(): string {
        return dragonPath.dragonStaticFolder;
    }

    private static getDragonVersionPath(): string {
        return dragonPath.versionFilePath;
    }

    static getDragonVersion() : any {
        let data = {
            version: '',
            errorMsg: ''
        };

        return new Promise(async (resolve: any, reject: any) => {
            try {
                if (!fileService.JSONFileExist(this.getDragonBasePath())) {
                    data.errorMsg = errors.uninitialized;
                    reject(data);
                    return;
                }

                let tmpData!: any[];
                await fileService.JSONFileReader(this.getDragonVersionPath()).then(f => {
                    tmpData = f;
                });

                if (typeof tmpData !== 'undefined' && tmpData.length > 0) {
                    data.version = tmpData[0];
                }
            } catch (ex) {
                data.errorMsg = errors.errGetDragonVersion;

                console.error(`An error occured in DragonService.getDragonVersion`);
                console.error(ex);

                reject(data);
                return;
            }

            resolve(data);
        });
    }

}

// **** Functions **** //

async function getVersion(): Promise<string> {
    let version = await DragonService.getDragonVersion();
    return version;
}

async function updateDragon(): Promise<void> {

}


// **** Export default **** //

export default {
    dragonPath,
    getVersion,
    updateDragon
} as const;
