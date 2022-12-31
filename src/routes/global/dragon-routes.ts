import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import dragonService from '../../services/dragon-service';
import { Request, Response } from 'express';
import { IDragonData } from '../../models/dragon/dragon-model';
import { DragonCulture } from '../../declarations/enum';
import { IReturnData, ReturnData } from '../../models/IReturnData';

const modulePath = '/dragon';

const routes = {
    HOME: '/',
    GET_VERSION: '/version',
    UPDATE: '/update',
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
        const returnData: ReturnData<IDragonData> = new ReturnData<IDragonData>;

        const data: IDragonData = await dragonService.getVersion(returnData);
        if (data.currentVersion && typeof data.currentVersion !== 'undefined') {
            return response.status(HttpStatusCodes.OK).send(data.currentVersion);
        } else {
            return response.status(HttpStatusCodes.OK).send(returnData.messages);
        }
    } catch (ex) {
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
    }
}

/**
 * Performs the update of the dragons files
 * @param req
 * @param response
 * @returns
 */
async function updateDragon(req: Request, response: Response) {
    try {
        const forceUpdate: boolean = ((req.query?.forceUpdate == 'true' || (req.query?.forceUpdate == '1')) || false);
        const culture: string = (req.query.culture as string);

        let dragonCulture : DragonCulture = DragonCulture.fr_fr;
        if (typeof culture !== 'undefined' && culture == 'en') {
            dragonCulture = DragonCulture.en_us;
        } else if (typeof culture !== 'undefined' && (culture !== 'fr' && culture !== 'en')) {
            return response.status(HttpStatusCodes.BAD_REQUEST).send('Culture invalid');
        }

        const data: IReturnData<IDragonData> = await dragonService.updateDragon(forceUpdate, dragonCulture);
        if (data) {
            return response.status(HttpStatusCodes.OK).send(data.messages);
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
    updateDragon,
} as const;
