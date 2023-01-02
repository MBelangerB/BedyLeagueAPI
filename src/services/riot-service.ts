import infoData from '../static/info.json';
import axios, { AxiosError, ResponseType } from 'axios';
import { ApiRiotMethod, DragonCulture, RiotTokenType } from '../declarations/enum';
import EnvVars from '../declarations/major/EnvVars';
import { RegionData } from '../declarations/types';
import { RouteError } from '../declarations/classes';
import HttpStatusCodes from '../declarations/major/HttpStatusCodes';
import { IChampion, IChampionInfo, ChampionInfoExt } from '../models/riot/ChampionInfo';
import { DragonService } from './dragon-service';
import { getBoolean } from '../declarations/functions';
import { ApiParameters } from '../models/riot/ApiParameters';

// **** Variables **** //

// Errors
export const errors = {
    unauth: 'Unauthorized',
    errParamsIsInvalid: (paramsName: string, region: string) => `The parameters '${paramsName}' with value '${region}' is invalid.`,
    errParamsIsMissing: (params: string) => `The parameter '${params}' is mandatory.`,
    errInFunction: (functionName: string) => `An error occured in "RiotService.${functionName}"`,
    errChampionNotExist: (list: string, championId: string) => `Cannot add ${championId} in ${list}. Champion doesn't exists, please try to update dragon file.`,

} as const;

export class RiotService {

    static autorizedRegion = ['BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU'];
    static regionDataMapping: RegionData = {
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
    static convertToRealRegion(region: string): string {
        const realRegion: string = RiotService.regionDataMapping[region.toUpperCase()];
        if (typeof region === 'undefined' || region.trim().length === 0) {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, errors.errParamsIsMissing('region'));
        } else if (!RiotService.autorizedRegion.includes(realRegion)) {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, errors.errParamsIsInvalid('region', region));
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    static async callRiotAPI(requestUrl: string, tokenType: RiotTokenType, responseType: ResponseType = 'json'): Promise<any> {
        const token = RiotService.getToken(tokenType);

        const axiosQuery = new Promise(function (resolve, reject) {
            try {
                console.info(`Call Riot API with '${requestUrl}'`);
                axios(encodeURI(requestUrl),
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

        return Promise.resolve(axiosQuery);
    }

    /**
     * Read Dragon file and initialize IChampionInfoExt
     * @param rotate
     * @returns
     */
    static async getRotate(rotate: IChampionInfo): Promise<ChampionInfoExt> {
        const dragonChampionData: Array<IChampion> = await DragonService.readDragonChampionFile(DragonCulture.fr_fr);

        const process = new Promise<ChampionInfoExt>(function (resolve: any, reject: any) {
            const rotateResult: ChampionInfoExt = new ChampionInfoExt();

            try {
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

        return Promise.resolve(process);
    }
}

export class RiotQueryValidation {

      /**
     * Valid the summonerName
     * @param summonerName 
     */
       static validateSummonerName(summonerName: string): void {
        if (typeof summonerName === 'undefined' || summonerName.trim().length === 0) {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, errors.errParamsIsMissing('summonerName'));

        } else if (!RiotQueryValidation.isValidSummonerName(summonerName)) {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, errors.errParamsIsInvalid('summonerName', summonerName));
        }
    }

    private static isValidSummonerName(summonerName: string) {
        // https://developer.riotgames.com/getting-started.html
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Ex: βlue Łagoon
        let valid = false;
        if (typeof summonerName !== 'undefined' && summonerName.trim().length >= 0) {

            const arrUsernames = summonerName.trim().split(';');
            /* eslint-disable no-shadow */
            /* eslint-disable no-unused-vars */
            arrUsernames.forEach(function myFunction(summonerName) {
                if (summonerName.length < 3 || summonerName.length > 16) {
                    return false;
                }

                // MBB 2021-08-31 : Désactivation temporaire de la validation
                /*
                var re = new RegExp('^[0-9\u00C0-\u024F _.αβŁ\\w]+$', 'giu');
                if (re.test(summonerName)) {
                    valid = true;
                }
                */
                valid = true;
            });
        }
        return valid;
    }

    /**
     * Fix optional parameters for RIOT Query
     * @param method 
     * @param queryParams 
     */
    static fixOptionalParams(method: ApiRiotMethod, queryParameters: any): ApiParameters {
        let optionalParam: ApiParameters = new ApiParameters();

        switch (method) {
            case ApiRiotMethod.RANK:
                const defaultLp: boolean = true;
                const defaultShowType: boolean = true;
                const defaultShowWinRate: boolean = true;
                const defaultShowAllQueue: boolean = false;
                const defaultFQ: boolean = true;
                const defaultFullString: boolean = false;
                const defaultSeries: string = '✓X-';
                const defaultQueue: string = 'solo5';

                // Show LP
                // if (typeof queryParameters.lp !== 'undefined' && queryParameters.lp.trim().length > 0) {
                //     optionalParam.showLp = getBoolean(queryParameters.lp);
                // }
                optionalParam.showLp = (queryParameters?.lp ?? defaultLp);
                optionalParam.showQueueType = (queryParameters?.type ?? defaultShowType);
                optionalParam.showAllQueueInfo = ((queryParameters?.all) ?? defaultShowAllQueue);
                optionalParam.showFQ = (queryParameters?.fq ?? defaultFQ);

                optionalParam.series = (queryParameters?.series ?? defaultSeries);
                optionalParam.queueType = ((queryParameters?.queuetype || queryParameters?.qt) ?? defaultQueue);
                optionalParam.showFullString = ((queryParameters?.fullstring || queryParameters?.fs) ?? defaultFullString);

                optionalParam.showWinRate = ((queryParameters?.winrate || queryParameters?.wr) ?? defaultShowWinRate);

                // Series value [Win/Lose/NoResult]
                // if (!queryParams || typeof queryParams?.series == "undefined" || queryParams?.series.length !== 3) {
                //     queryParams.series = defaultSeries;
                // }

                break;

            case ApiRiotMethod.ROTATE:
                // No optional parameters
                break;

            case ApiRiotMethod.SUMMONER_INFO:
                // No optional parameters
                break;

            case ApiRiotMethod.TOP_MASTERIES:
                optionalParam.nbMasteries = (queryParameters?.nb ?? 5);
                // if (!queryParameters || typeof queryParameters?.nb == "undefined" || queryParameters?.nb < 0) {
                //     queryParameters.nb = defaultNbValue;
                // }
                break;
        }

        return optionalParam;
    }
}

// **** Functions **** //

/**
 * Function called by API for prepare the data
 * @param region
 * @param json
 * @returns
 */
async function getRiotRotate(region: string): Promise<ChampionInfoExt> {
    const RotateUrl = infoData.lol.routes.champion.v3.championRotation.replace('{region}', region);
    let rotate: IChampionInfo | null = null;
    let rotateResult: ChampionInfoExt = new ChampionInfoExt();

    // Step 1 : Get Rotate Info
    // TODO: Cache for Riot Info
    await RiotService.callRiotAPI(RotateUrl, RiotTokenType.LOL).then(result => {
        rotate = result;

    }).catch(err => {
        // TODO: Est-ce que le retour devrait être un type avec : code, errMessage, data (ChampionInfoExt)
        console.error(errors.errInFunction('getRiotRotate'));

        if (err instanceof AxiosError) {
            console.error(err.message);
        } else {
            console.error(err);
        }

        throw err;
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
    RiotQueryValidation,
    getRiotRotate,
} as const;