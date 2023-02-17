// import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import { Request, Response } from 'express';
// import riot, { RiotQueryValidation, RiotService } from '../../services/riot-service';
import { RiotQueryValidation } from '../../services/riot-service';
import { RouteError } from '../../declarations/classes';
// import { logType } from '../../lib/logger';
// import { ChampionInfoExt } from '../../models/riot/ChampionInfo';
import { AxiosError } from 'axios';
import { ApiRiotMethod } from '../../declarations/enum';
import { ApiParameters } from '../../models/riot/ApiParameters';
import { RiotDatabaseService } from '../../services/riot-database-service';
// import { ReturnData } from '../../models/IReturnData';
import summoner, { RiotSummoner } from '../../models/riot/RiotSummoner';
// import { ChampionMastery } from '../../models/riot/ChampionMastery';
// import { isNumberObject } from 'util/types';
import { BedyMapper } from '../../mapper/mapper';
import { ChampionMasteries } from '../../models/riot/ChampionMastery';
// import { ChampionInfoExt } from '../../models/riot/ChampionInfo';

// import { ILeagueEntryDTO, ISummonerDTO, ChampionMasteryDTO, IChampionInfo} from 'bedyriot';
// import BedyRiot, { RiotService, ValidationService, RiotHttpStatusCode, ISummonerDTO, ChampionMasteryDTO, IChampionInfo } from 'bedyriot';

// import BedyRiot from 'bedyriot';
import { RiotService, ValidationService, RiotHttpStatusCode } from 'bedyriot';
import { ISummonerDTO, ILeagueEntryDTO, IChampionMasteryDTO } from 'bedyriot';
import { Rotation } from 'bedyriot/build/model/RiotModel';
// import { ChampionInfo } from 'bedyriot/build/entity/Champion-v3/ChampionInfo';

// import { SummonerV4 } from 'bedyriot/build/service/RiotService';
// import { ILeagueEntryDTO } from 'bedyriot/build/entity/League-v4/LeagueEntryDTO';
// import { ValidationService } from 'bedyriot/build/service/ValidationService';

// import RiotHttpStatusCode from 'bedyriot/build/declaration/RiotHttpStatusCode';

// **** Export const **** //
const modulePath = '/lol';

const routes = {
    HOME: '/',

    ROTATE: '/rotate',
    ROTATE_PARAMS: '/rotate/:region',

    RANK: '/rank',
    RANK_PARAMS: '/rank/:region/:summonerName',

    SUMMONER_INFO: '/summonerInfo',
    SUMMONER_INFO_PARAMS: '/summonerInfo/:region/:summonerName',

    TOP_MASTERIES: '/topMasteries',
    TOP_MASTERIES_PARAMS: '/topMasteries/:region/:summonerName',
} as const;

// **** Export function **** //

/**
 * [ROUTE] Get current rotate
 * @param req 
 * @param response 
 * @returns 
 */
async function getRotate(req: Request, response: Response) {
    // TODO: Replace « newPlayer » by "enum". 0 (Free champ) - 1 (New player champs) - 2 (All champ, dans NewPlayer add *)
    // Default : 0
    let region: string = (req.params?.region ?? req.query?.region);
    const json: boolean = ((req.query?.json == 'true' || (req.query?.json == '1')) || false);
    const newPlayer: boolean = ((req.query?.newPlayer == 'true' || (req.query?.newPlayer == '1')) || false);

    // Get extra
    let showChampionName: boolean = ((req.query?.showChampionName == 'true' || (req.query?.showChampionName == '1')) || false);
    const showSquare: boolean = ((req.query?.showSquare == 'true' || (req.query?.showSquare == '1')) || false);
    const showLoadingScreen: boolean = ((req.query?.showLoadingScreen == 'true' || (req.query?.showLoadingScreen == '1')) || false);

    try {
        // If we dont ask JSON return, we needs to have the champions name for show the result, we force the value.
        if (!json) {
            showChampionName = true;
        }

        region = ValidationService.convertToRealRegion(region);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        const service: RiotService = new RiotService();
        let championInfo: Rotation = await service.ChampionV3.getChampionRotations(region, { 
                                                                                    showChampionName: showChampionName, 
                                                                                    showSquare: showSquare,
                                                                                    showLoadingScreen: showLoadingScreen,
                                                                                    });
        if (championInfo) {
            if (json) {
                response.status(RiotHttpStatusCode.OK).json(championInfo);
            } else if (newPlayer) {
                response.status(RiotHttpStatusCode.OK).send(championInfo.getNewbiesFreeChampionStr());
            } else {
                response.status(RiotHttpStatusCode.OK).send(championInfo.getFreeChampionStr());
            }
        }

        // let championRotate: ChampionInfoExt = await BedyMapper.MapRotationToChampionInfo(championInfo);
        // if (championRotate) {
        //     if (json) {
        //         response.status(RiotHttpStatusCode.OK).json(championRotate);
        //     } else if (newPlayer) {
        //         response.status(RiotHttpStatusCode.OK).send(championRotate.getNewbiesFreeChampionStr());
        //     } else {
        //         response.status(RiotHttpStatusCode.OK).send(championRotate.getFreeChampionStr());
        //     }
        // }

    } catch (ex: any) {
        if (ex instanceof RouteError) {
            return response.status((ex as RouteError).status).send((ex as RouteError).message);
        } else if (ex instanceof AxiosError) {
            if (ex?.response) {
                // Riot API return a response
                const status: number = ex?.response.status;
                const message: string = ex?.response.statusText;

                return response.status(status).send(message);
            }
            return response.status(RiotHttpStatusCode.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(RiotHttpStatusCode.BAD_REQUEST).send(ex?.message);
    }
}

// Utiliser les méthodes pour obtneir l'historique des parties du joueurs selon le type ranked
// A partir de la date du début de la saison
// POur les 10 premières parti histoire d'avoir historiques
async function getRank(req: Request, response: Response) {
    // Mandatory params
    let region: string = (req.params?.region ?? req.query?.region);
    const summonerName: string = (req.params?.summonerName ?? req.query?.summonerName);

    // Optional params
    const json: boolean = ((req.query?.json == 'true' || (req.query?.json == '1')) || false);

    try {
        region = ValidationService.convertToRealRegion(region);
        RiotQueryValidation.validateSummonerName(summonerName);
        const optionalParams: ApiParameters = RiotQueryValidation.fixOptionalParams(ApiRiotMethod.RANK, req.query);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}, Optional: ${JSON.stringify(optionalParams)}`);


        const service: RiotService = new RiotService();
        // Get DB summoner info
        let dbSummoner: RiotSummoner = await summoner.getRiotSummonerByName(summonerName, region);
        if (!dbSummoner || dbSummoner.requireUpdate()) {
            // No db result or expired. We call Riot API for obtains summoner DTO
            // Cast Summoner DTO to local object
            const apiSummoner: ISummonerDTO = await service.SummonerV4.getBySummonerName(summonerName, region);
            const summoner: RiotSummoner | null = BedyMapper.MapToRiotSummoner(apiSummoner, false);
            // If we can make RiotSummoner, we create db object
            if (summoner) {
                dbSummoner = await RiotDatabaseService.createOrUpdateSummoner(summoner, region);
            }
        }

        if (dbSummoner) {
            const summonerRank: Array<ILeagueEntryDTO> = await service.LeagueV4.getLeagueEntriesByEncryptedSummonerId(dbSummoner.id, region);
            if (summonerRank) {
                if (json) {
                    response.status(RiotHttpStatusCode.OK).json(summonerRank);
                } else {
                    response.status(RiotHttpStatusCode.OK).send(summonerRank.toString());
                }
            }
        }

    } catch (ex) {
        if (ex instanceof RouteError) {
            return response.status((ex as RouteError).status).send((ex as RouteError).message);

        } else if (ex instanceof AxiosError) {
            if (ex?.response) {
                // Riot API return a response
                const status: number = ex?.response.status;
                const message: string = ex?.response.statusText;

                return response.status(status).send(message);
            }
            return response.status(RiotHttpStatusCode.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(RiotHttpStatusCode.BAD_REQUEST).send(ex);
    }
}

/**
 * [ROUTE] Get summoner info
 * @param req 
 * @param response 
 * @returns 
 */
async function getSummonerInfo(req: Request, response: Response) {
    // Mandatory params
    let region: string = (req.params?.region ?? req.query?.region);
    const summonerName: string = (req.params?.summonerName ?? req.query?.summonerName);

    // Optional params
    const json: boolean = ((req.query?.json == 'true' || (req.query?.json == '1')) || false);

    try {
        RiotQueryValidation.validateSummonerName(summonerName);
        region = ValidationService.convertToRealRegion(region);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        // Get DB summoner info
        let dbSummoner: RiotSummoner = await summoner.getRiotSummonerByName(summonerName, region);
        if (!dbSummoner || dbSummoner.requireUpdate()) {
            // No db result or expired. We call Riot API for obtains summoner DTO
            // Cast Summoner DTO to local object

            const service: RiotService = new RiotService();
            const apiSummoner: ISummonerDTO = await service.SummonerV4.getBySummonerName(summonerName, region);
            const summoner: RiotSummoner | null = BedyMapper.MapToRiotSummoner(apiSummoner, false);

            // If we can make RiotSummoner, we create db object
            if (summoner) {
                dbSummoner = await RiotDatabaseService.createOrUpdateSummoner(summoner, region);
            }
        }

        if (dbSummoner) {
            if (json) {
                response.status(RiotHttpStatusCode.OK).json(dbSummoner);
            } else {
                response.status(RiotHttpStatusCode.OK).send(dbSummoner.toString());
            }
        }

    } catch (ex: any) {
        if (ex instanceof RouteError) {
            return response.status((ex as RouteError).status).send((ex as RouteError).message);

        } else if (ex instanceof AxiosError) {
            if (ex?.response) {
                // Riot API return a response
                const status: number = ex?.response.status;
                const message: string = ex?.response.statusText;

                return response.status(status).send(message);
            }
            return response.status(RiotHttpStatusCode.BAD_REQUEST).send((ex as AxiosError).message);

        } else if (ex.status != null) {
            return response.status(ex.status).send(ex.statusText);
        }
        return response.status(RiotHttpStatusCode.BAD_REQUEST).send(ex?.message);
    }

}

/**
 * [ROUTE] Get masteries
 * @param req 
 * @param response 
 * @returns 
 */
async function getTopMasteries(req: Request, response: Response) {
    // Mandatory params
    let region: string = (req.params?.region ?? req.query?.region);
    const summonerName: string = (req.params?.summonerName ?? req.query?.summonerName);

    // Optional params
    const json: boolean = ((req.query?.json == 'true' || (req.query?.json == '1')) || false);

    try {
        RiotQueryValidation.validateSummonerName(summonerName);
        region = ValidationService.convertToRealRegion(region);
        const optionalParams: ApiParameters = RiotQueryValidation.fixOptionalParams(ApiRiotMethod.TOP_MASTERIES, req.query);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}, Optional: ${JSON.stringify(optionalParams)}`);

        const service: RiotService = new RiotService();
        // Get DB summoner info
        let dbSummoner: RiotSummoner = await summoner.getRiotSummonerByName(summonerName, region);
        if (!dbSummoner || dbSummoner.requireUpdate()) {
            // No db result or expired. We call Riot API for obtains summoner DTO
            // Cast Summoner DTO to local object


            const apiSummoner: ISummonerDTO = await service.SummonerV4.getBySummonerName(summonerName, region);
            const summoner: RiotSummoner | null = BedyMapper.MapToRiotSummoner(apiSummoner, false);
            // If we can make RiotSummoner, we create db object
            if (summoner) {
                dbSummoner = await RiotDatabaseService.createOrUpdateSummoner(summoner, region);
            }
        }

        // Get Masteries
        let masteriesDTO: Array<IChampionMasteryDTO> = await service.ChampionMasteryV4.getByEncryptedSummonerId(dbSummoner.id, region);
        let summonerMasteries: ChampionMasteries = await BedyMapper.MapChampionMasteryToMasteries(masteriesDTO);
        if (summonerMasteries) {
            if (json) {
                return response.status(RiotHttpStatusCode.OK).json(summonerMasteries);
            } else {
                return response.status(RiotHttpStatusCode.OK).send(summonerMasteries.getResult(optionalParams.nbMasteries));
            }
        }

    } catch (ex: any) {
        if (ex instanceof RouteError) {
            return response.status((ex as RouteError).status).send((ex as RouteError).message);

        } else if (ex instanceof AxiosError) {
            if (ex?.response) {
                // Riot API return a response
                const status: number = ex?.response.status;
                const message: string = ex?.response.statusText;

                return response.status(status).send(message);
            }
            return response.status(RiotHttpStatusCode.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(RiotHttpStatusCode.BAD_REQUEST).send(ex?.message);
    }
}

// **** Export default **** //

export default {
    routes,
    modulePath,
    getRotate,
    getRank,
    getSummonerInfo,
    getTopMasteries,
} as const;
