import fs, { readFileSync } from 'fs';
import axios, { isCancel, AxiosError, ResponseType } from 'axios';
import path, { basename } from 'path';
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
    static async createFolder(folderPath: string) : Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!FileService.checkFileExists(folderPath)) {
                    await fs.promises.mkdir(folderPath, { recursive: true }).catch((err: any) => {
                        if (err) reject(err);
                    });

                    console.info(`The folder ${folderPath} has been created.`);
                }

                // resolve(true);
                resolve(`The folder ${folderPath} has been created.`);

            } catch (ex) {
                console.error(errors.errCreateFolder);
                console.error(ex);
                reject(ex);
            }
        });
    }

    static async writeFile(filePath: string, fileContent: string) : Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof (fileContent) !== 'string') {
                    await util.promisify(fs.writeFile)(filePath, castDataToJSON(fileContent));
                } else {
                    await util.promisify(fs.writeFile)(filePath, fileContent);
                }
        
                console.info(`The file ${filePath} has been created or updated.`);
                // resolve(true);
                resolve(`The file ${filePath} has been created or updated.`);

            } catch (ex) {
                console.error(errors.errWriteFile);
                console.error(ex);
                reject(ex);
            }
    
        });
    }


}

// https://www.geeksforgeeks.org/node-js-fs-readfilesync-method/
async function readInternalFile(filePath: string, fileEncoding: BufferEncoding = "utf8", flag: string = "r") {
    // try {
        const rawdata = readFileSync(filePath, { encoding: fileEncoding, flag: flag });
        const data = JSON.parse(rawdata);
        return data;
    // } catch (ex: any) {
    //     if (ex && ex?.message == "Unexpected end of JSON input") {
    //         return "";
    //     }
    //     throw ex;
    // }

}

// function checkFileExists(filePath: string): boolean {
//     return fs.existsSync(filePath);
// }

function castDataToJSON(data: any) {
    return JSON.stringify(data, null, 2);
}

async function downloadExternalFile(requestUrl: string, responseType: ResponseType = "json"): Promise<any> {
    return new Promise(async function (resolve, reject) {
        try {
            console.info(`Downloading the '${requestUrl}' file`);
            await axios(encodeURI(requestUrl),
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
}



// async function writeTextFile(filePath: string, fileContent: string) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             await util.promisify(fs.writeFile)(filePath, fileContent);
//             resolve(true);
//         } catch (ex) {
//             console.error(errors.errWriteFile);
//             console.error(ex);
//             reject(ex);
//         }

//     });
// }

// async function writeJsonFile(filePath: string, fileContent: string) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             // if (checkFileExists(filePath)) {
//             await fs.promises.writeFile(filePath, castDataToJSON(fileContent), {
//                 encoding: "utf8",
//                 flag: "w",
//                 mode: 0o666
//             },)
//             // await util.promisify(fs.writeFile)(filePath, castDataToJSON(fileContent), );

//             // }
//             resolve(true);
//         } catch (ex) {
//             console.error(errors.errWriteFile);
//             console.error(ex);
//             reject(ex);
//         }

//     });
// }


export default {
    basicPath,
    errors,
    FileService,
    readInternalFile,
    // checkFileExists,
    downloadExternalFile,
    // writeTextFile,
    // writeJsonFile,
    castDataToJSON
} as const;
