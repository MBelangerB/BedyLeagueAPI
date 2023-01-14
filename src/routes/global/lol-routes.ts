import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import { Request, Response } from 'express';
import riot, { RiotQueryValidation, RiotService } from '../../services/riot-service';
import { RouteError } from '../../declarations/classes';
// import { logType } from '../../lib/logger';
import { ChampionInfoExt } from '../../models/riot/ChampionInfo';
import { AxiosError } from 'axios';
import { ApiRiotMethod } from '../../declarations/enum';
import { ApiParameters } from '../../models/riot/ApiParameters';
import { RiotDatabaseService } from '../../services/riot-database-service';
// import { ReturnData } from '../../models/IReturnData';
import summoner, { RiotSummoner } from '../../models/riot/RiotSummoner';
import { ChampionMastery } from '../../models/riot/ChampionMastery';
// import { isNumberObject } from 'util/types';


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

    try {
        region = RiotService.convertToRealRegion(region);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        const rotateResult: ChampionInfoExt = await riot.getRiotRotate(region);
        if (rotateResult) {
            if (json) {
                response.status(HttpStatusCodes.OK).json(rotateResult);
            } else if (newPlayer) {
                response.status(HttpStatusCodes.OK).send(rotateResult.getNewbiesFreeChampionStr());
            } else {
                response.status(HttpStatusCodes.OK).send(rotateResult.getFreeChampionStr());
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
            return response.status(HttpStatusCodes.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
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
        region = RiotService.convertToRealRegion(region);
        RiotQueryValidation.validateSummonerName(summonerName);
        const optionalParams: ApiParameters = RiotQueryValidation.fixOptionalParams(ApiRiotMethod.RANK, req.query);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}, Optional: ${JSON.stringify(optionalParams)}`);

        
        return response.status(HttpStatusCodes.OK).send('To do');

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
            return response.status(HttpStatusCodes.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
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
        region = RiotService.convertToRealRegion(region);
        RiotQueryValidation.validateSummonerName(summonerName);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        let dbSummoner: RiotSummoner = await summoner.getRiotSummonerByName(summonerName, region);
        if (!dbSummoner || dbSummoner.requireUpdate()) {
            // No db result or expired
            const apiSummoner: RiotSummoner | null = await riot.getRiotSummonerByName(summonerName, region);
            if (apiSummoner) {
                dbSummoner = await RiotDatabaseService.createOrUpdateSummoner(apiSummoner, region);
            }
        }

        if (dbSummoner) {
            if (json) {
                response.status(HttpStatusCodes.OK).json(dbSummoner);
            } else {
                response.status(HttpStatusCodes.OK).send(dbSummoner.toString());
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
            return response.status(HttpStatusCodes.BAD_REQUEST).send((ex as AxiosError).message);

        } else if (ex.status !== null) {
            return response.status(ex.status).send(ex.statusText);
        }
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
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
        region = RiotService.convertToRealRegion(region);
        RiotQueryValidation.validateSummonerName(summonerName);
        const optionalParams: ApiParameters = RiotQueryValidation.fixOptionalParams(ApiRiotMethod.TOP_MASTERIES, req.query);
        console.api(`BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}, Optional: ${JSON.stringify(optionalParams)}`);

        // Get Summoner
        let dbSummoner: RiotSummoner = await summoner.getRiotSummonerByName(summonerName, region);
        if (!dbSummoner || dbSummoner.requireUpdate()) {
            // No db result or expired
            const apiSummoner: RiotSummoner | null = await riot.getRiotSummonerByName(summonerName, region);
            if (apiSummoner) {
                dbSummoner = await RiotDatabaseService.createOrUpdateSummoner(apiSummoner, region);
            }
        }

        // Get Masteries
        let masteries: ChampionMastery = await riot.getRiotMasteries(dbSummoner.id, region);
        if (masteries) {
            if (json) {
                return response.status(HttpStatusCodes.OK).json(masteries);
            } else {
                return response.status(HttpStatusCodes.OK).send(masteries.getResult(optionalParams.nbMasteries));
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
            return response.status(HttpStatusCodes.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
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
