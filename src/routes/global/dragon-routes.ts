import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import { Request, Response } from 'express';
import { DragonService, DragonCulture, IDragonVersion, IDragonChampion, ReturnData } from '@mbelangerb/riotmodule';

const modulePath = '/dragon';

const routes = {
    HOME: '/',
    GET_VERSION: '/version',
    GET_CHAMPION_INFO: '/championInfo',
    GET_CHAMPION_INFO_BY_ID_PARAM: '/championInfoById/:championId',
    GET_CHAMPION_INFO_BY_NAME_PARAM: '/championInfoByName/:championName'
} as const;

/**
 * Get full routes path
 * @param route Routes name
 * @returns Full path route (module/routes)
 */
function getPath(route: string) {
    return modulePath + route;
}

/**
 * Get current dragon module version
 * @param req
 * @param response
 * @returns
 */
async function getCurrentVersion(req: Request, response: Response) {
    try {
        const dragonData: ReturnData<IDragonVersion> = await DragonService.getDragonVersion();

        if (dragonData) {
            if (dragonData.data?.internalVersion && typeof dragonData.data?.internalVersion !== 'undefined') {
                return response.status(HttpStatusCodes.OK).send(dragonData.data?.internalVersion);
            } else {
                return response.status(HttpStatusCodes.OK).send(dragonData.messages);
            }
        } else {
            return response.status(HttpStatusCodes.OK).send(`An error occured.`);
        }

    } catch (ex) {
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
    }
}

/**
 * Get current dragon module version
 * @param req
 * @param response
 * @returns
 */
async function getChampionInfo(req: Request, response: Response) {
    try {
        let championId: number = (req.query?.championId != null ? Number(req.query?.championId) : 
                                                (req.params?.championId != null ? Number(req.params?.championId) : -1));
        const championName: string = (req.query?.championName != null ? req.query?.championName.toString() : 
                                        (req.params?.championName != null ? req.params?.championName.toString() : ""));

        const culture: string = (req.query.culture as string);
        let dragonCulture: DragonCulture = DragonCulture.fr_fr;
        if (typeof culture !== 'undefined' && culture == 'en') {
            dragonCulture = DragonCulture.en_us;

        } else if (typeof culture !== 'undefined' && (culture !== 'fr' && culture !== 'en')) {
            return response.status(HttpStatusCodes.BAD_REQUEST).send('Culture invalid');
        }

        let championInfo: IDragonChampion | undefined;
        if (championId != null && championId > 0) {
            championInfo = await DragonService.getChampionInfoById(championId, dragonCulture);

        } else if (championName != null && championName.trim().length > 0) {
            championInfo = await DragonService.getChampionInfoByName(championName, dragonCulture);
        } else {
            return response.status(HttpStatusCodes.BAD_REQUEST).send('Missing parameters');  
        }

        if (championInfo != null && championInfo != undefined) {
            return response.status(HttpStatusCodes.OK).send(championInfo);
        }

    } catch (ex) {
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
    }
}


// **** Export default **** //

export default {
    routes,
    modulePath,
    getPath,
    getCurrentVersion,
    getChampionInfo,
} as const;
