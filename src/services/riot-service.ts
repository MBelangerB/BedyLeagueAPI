import infoData from '../static/info.json';
import axios, { isCancel, AxiosError, ResponseType } from 'axios';
import { DragonCulture, RiotTokenType } from '../declarations/enum';
import EnvVars from '../declarations/major/EnvVars';
import { RegionRegionData } from '../declarations/types';
import { RouteError } from '../declarations/classes';
import HttpStatusCodes from '../declarations/major/HttpStatusCodes';
import { IChampion, IChampionInfo, IChampionInfoExt, ChampionInfoExt } from '../models/riot/ChampionInfo';
import dragon, { DragonService } from './dragon-service';
import { IChampionData } from '../models/dragon/dragon-model';

// **** Variables **** //

// Errors
export const errors = {
    unauth: 'Unauthorized',
    invalidRegion: (region: string) => `Region parameters "${region}" is invalid.`,
    errInFunction: (functionName: string) => `An error occured in "RiotService.${functionName}"`,
    errChampionNotExist: (list: string, championId: string) => `Cannot add ${championId} in ${list}. Champion doesn't exists, please try to update dragon file.`
} as const;

export class RiotService {

    static autorizedRegion = ['BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU']
    static regionDataMapping: RegionRegionData = {
        // BR1
        'BR': 'BR1',
        'BR1': 'BR1',
        // EUN1
        'EUN': 'EUN1',
        'EUN1': 'EUN1',
        'EUNE': 'EUN1',
        // EUW1
        'EUW': 'EUW1',
        'EUW1': 'EUW1',
        // JP1
        'JP': 'JP1',
        'JP1': 'JP1',
        // KR
        'KR': 'KR',
        // LA1
        'LA1': 'LA1',
        'LA2': 'LA2',
        // NA1
        'NA': 'NA1',
        'NA1': 'NA1',
        // OC1
        'OC': 'OC1',
        'OC1': 'OC1',
        // TR1
        'TR': 'TR1',
        'TR1': 'TR1',
        // RU
        'RU': 'RU',
    };

    /**
     * Convert region parameters to riot region
     * @param region 
     * @returns 
     */
    static convertToRealRegion(region: string) {
        const realRegion: string = RiotService.regionDataMapping[region.toUpperCase()];
        if (!RiotService.autorizedRegion.includes(realRegion)) {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, errors.invalidRegion(region))
        } else {
            return realRegion;
        }
    }

    /**
     * Get Riot API Token
     * @param tokenType 
     * @returns 
     */
    static getToken(tokenType: RiotTokenType) {
        let token;
        switch (tokenType) {
            case RiotTokenType.TFT:
                token = `${EnvVars.riot.tftToken || process.env.riotLolToken}`;
                break;

            case RiotTokenType.LOL:
                token = `${EnvVars.riot.leagueToken || process.env.riotTftToken}`;
                break;
        }
        return token;
    }

    /**
     * Call Riot API to obtains information
     * @param requestUrl 
     * @param tokenType 
     * @param responseType 
     * @returns 
     */
    static async callRiotAPI(requestUrl: string, tokenType: RiotTokenType, responseType: ResponseType = "json"): Promise<any> {
        let token = RiotService.getToken(tokenType);

        return new Promise(async function (resolve, reject) {
            try {
                console.info(`Call Riot API with '${requestUrl}'`);
                await axios(encodeURI(requestUrl),
                    {
                        method: 'GET',
                        responseType: responseType,
                        headers: { 'X-Riot-Token': token },
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
                            reject(response);
                        }

                    }).catch(error => {
                        reject(error);
                    });

            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * Read Dragon file and initialize IChampionInfoExt
     * @param rotate 
     * @returns 
     */
    static async getRotate(rotate: IChampionInfo): Promise<ChampionInfoExt> {
        let rotateResult: ChampionInfoExt = new ChampionInfoExt();

        return new Promise(async function (resolve, reject) {
            try {
                const dragonChampionData: Array<IChampion> = await DragonService.readDragonChampionFile(DragonCulture.fr_fr);
                           
                rotate.freeChampionIds.forEach(function (championId) {
                    try {
                        const dragonChamp = dragonChampionData.find(e => e.id === championId.toString());
                        if (dragonChamp) { 
                            rotateResult.freeChampion.push(dragonChamp);
                        }         
                    } catch (ex) {
                        console.warn(errors.errChampionNotExist('freeChampions', championId.toString()));
                    }
                });

                rotate.freeChampionIdsForNewPlayers.forEach(function (championId) {
                    try {
                        const dragonChamp = dragonChampionData.find(e => e.id === championId.toString());
                        if (dragonChamp) { 
                            rotateResult.freeChampionForNewPlayers.push(dragonChamp);
                        }         
                    } catch (ex) {
                        console.warn(errors.errChampionNotExist('freeChampionsForNewPlayers', championId.toString()));
                    }
                });

            } catch (ex) {
                reject(ex);
            }

            resolve(rotateResult);
        });
    }
}

// **** Functions **** //

/**
 * Function called by API for prepare the data
 * @param region 
 * @param json 
 * @returns 
 */
async function getRiotRotate(region: string, json: boolean): Promise<ChampionInfoExt> {
    let RotateUrl = infoData.lol.routes.champion.v3.championRotation.replace('{region}', region);
    let rotate: IChampionInfo | null = null;
    let rotateResult: ChampionInfoExt = new ChampionInfoExt(); /* {
        freeChampion: new Array<IChampion>,
        freeChampionForNewPlayers: new Array<IChampion>
    };*/

    // Step 1 : Get Rotate Info
    // TODO: Cache for Riot Info
    await RiotService.callRiotAPI(RotateUrl, RiotTokenType.LOL).then(result => {
        rotate = result;

    }).catch(err => {
        // AxiosError
        console.error(errors.errInFunction('getRiotRotate'));
        console.error(err);
    });

    if (rotate) {
         await RiotService.getRotate(rotate).then(result => {
            result.freeChampion.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            result.freeChampionForNewPlayers.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });

            rotateResult = result;
        }).catch(err => {
            throw err;
        });
    }

    return rotateResult;
}

// **** Export default **** //

export default {
    errors,
    RiotService,
    getRiotRotate
} as const;
