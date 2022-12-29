
import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import { Request, Response } from "express";
import riot, { RiotService } from '../../services/riot-service';
import { RouteError } from '../../declarations/classes';
import { BedyBot } from '../../lib/logger';
import { ChampionInfoExt } from '../../models/riot/ChampionInfo';


// **** Export const **** //
const modulePath: string = '/lol';

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
    //TODO: If not JSON add QueryParams for get « Free » or « Free4Newbies »
    let { region } = req.params;
    let json: boolean = ((req.query?.json == "true" || (req.query?.json == "1")) || false);

    try {
        region = RiotService.convertToRealRegion(region);
        console.log(BedyBot.logType.API, `BaseUrl: ${req.originalUrl}, Params: ${JSON.stringify(req.params)}, Query: ${JSON.stringify(req.query)}`);

        let rotateResult: ChampionInfoExt = await riot.getRiotRotate(region, json);
        if (rotateResult) {
            if (json) {
                response.status(HttpStatusCodes.OK).json(rotateResult);
            } else {
                // TODO: Add function for return list to string.
                response.status(HttpStatusCodes.OK).send(rotateResult.getFreeChampionStr()); 
            }
        }

  
    } catch (ex) {
        if (ex instanceof RouteError) {
            return response.status((ex as RouteError).status).send((ex as RouteError).message); 
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
