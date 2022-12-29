import fs, { readFileSync } from 'fs';
import axios, { ResponseType } from 'axios';
import path from 'path';
import util from 'util';

// **** Variables **** //
export const basicPath = {
    basePath: path.join(`${__dirname}`, '/..'),
    staticFolder: path.join(`${__dirname}`, '/..', '/static/'),
} as const;


// Errors
export const errors = {
    errGetExternal: 'An error occured in FileService.downloadExternalFile',
    errInternalGetExternal: 'An internal error occured in FileService.downloadExternalFile',
    errWriteFile: 'An error occured in FileService.writeFile',
    errCreateFolder: 'An error occured in FileService.createFolder',
    uninitialized: 'The \'Dragon\' files have not been initialized. Please initialize it first.',
} as const;


class FileService {

    /**
     * Check if a file or directory exists
     * @param filePath
     * @returns
     */
    static checkFileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Create folder recursively
     * @param folderPath
     * @returns
     */
    static async createFolder(folderPath: string): Promise<string> {
        const folder = new Promise<string>((resolve, reject) => {
            try {
                if (!FileService.checkFileExists(folderPath)) {
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    fs.promises.mkdir(folderPath, { recursive: true }).catch((err: any) => {
                        if (err) reject(err);
                    });

                    console.info(`The folder ${folderPath} has been created.`);
                    resolve(`The folder ${folderPath} has been created.`);
                }

            } catch (ex) {
                console.error(errors.errCreateFolder);
                console.error(ex);
                reject(ex);
            }
        });

        return Promise.resolve(folder);
    }

    static async writeFile(filePath: string, fileContent: string): Promise<string> {
        const file = new Promise<string>((resolve, reject) => {
            try {
                if (typeof (fileContent) !== 'string') {
                    util.promisify(fs.writeFile)(filePath, castDataToJSON(fileContent));
                } else {
                    util.promisify(fs.writeFile)(filePath, fileContent);
                }

                console.info(`The file ${filePath} has been created or updated.`);
                resolve(`The file ${filePath} has been created or updated.`);

            } catch (ex) {
                console.error(errors.errWriteFile);
                console.error(ex);
                reject(ex);
            }
        });

        return Promise.resolve(file);
    }


}

// https://www.geeksforgeeks.org/node-js-fs-readfilesync-method/
async function readInternalFile(filePath: string, fileEncoding: BufferEncoding = 'utf8', flag = 'r') {
    const rawdata = readFileSync(filePath, { encoding: fileEncoding, flag: flag });
    const data = JSON.parse(rawdata);
    return data;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function castDataToJSON(data: any) {
    return JSON.stringify(data, null, 2);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function downloadExternalFile(requestUrl: string, responseType: ResponseType = 'json'): Promise<any> {
    const downloadResult = new Promise<any>(function (resolve, reject) {
        try {
            console.info(`Downloading the '${requestUrl}' file`);
            axios(encodeURI(requestUrl),
                {
                    method: 'GET',
                    responseType: responseType,
                    responseEncoding: 'utf8', // default
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
                    } else {
                        console.error(errors.errGetExternal);
                        console.error(response);
                        reject(response);
                    }

                }).catch(error => {
                    console.error(errors.errGetExternal);
                    console.error(error);

                    reject(error);
                });

        } catch (ex) {
            console.error(errors.errInternalGetExternal);
            console.error(ex);

            reject(ex);
        }
    });

    return Promise.resolve(downloadResult);
}

export default {
    basicPath,
    errors,
    FileService,
    readInternalFile,
    downloadExternalFile,
    castDataToJSON,
} as const;
