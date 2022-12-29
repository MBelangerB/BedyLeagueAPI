import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import { Request, Response } from 'express';
import riot, { RiotService } from '../../services/riot-service';
import { RouteError } from '../../declarations/classes';
import { BedyBot } from '../../lib/logger';
import { ChampionInfoExt } from '../../models/riot/ChampionInfo';
import { Axios, AxiosError } from 'axios';
import { isNumberObject } from 'util/types';


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
async function getRotate(req: Request, response: Response) {
    // TODO: Replace « newPlayer » by "enum". 0 (Free champ) - 1 (New player champs) - 2 (All champ, dans NewPlayer add *)
    // Default : 0
    let { region } = req.params;
    if (typeof region == "undefined") {
        region = (req.query?.region as string);
    }
    const json: boolean = ((req.query?.json == 'true' || (req.query?.json == '1')) || false);
    const newPlayer: boolean = ((req.query?.newPlayer == 'true' || (req.query?.newPlayer == '1')) || false);

    try {
        region = RiotService.convertToRealRegion(region);
        console.log(BedyBot.logType.API, `BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        const rotateResult: ChampionInfoExt = await riot.getRiotRotate(region);
        if (rotateResult) {
            if (json) {
                response.status(HttpStatusCodes.OK).json(rotateResult);
            } else {
                if (newPlayer) {
                    response.status(HttpStatusCodes.OK).send(rotateResult.getNewbiesFreeChampionStr());
                } else {
                    response.status(HttpStatusCodes.OK).send(rotateResult.getFreeChampionStr());
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
            return response.status(HttpStatusCodes.BAD_REQUEST).send((ex as AxiosError).message);
        }
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
    }
}

async function getRank(req: Request, response: Response) {

}

async function getSummonerInfo(req: Request, response: Response) {

}

async function getTopMasteries(req: Request, response: Response) {

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
