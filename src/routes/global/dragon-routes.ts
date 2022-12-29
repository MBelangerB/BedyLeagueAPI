
import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import dragonService from "../../services/dragon-service";
import { Request, Response } from "express";
import { IDragonData } from '../../models/dragon/dragon-model';
import { DragonCulture } from '../../declarations/enum';

const modulePath: string = '/dragon';

const routes = {
    HOME: '/',
    GET_VERSION: '/version',
    UPDATE: '/update'
} as const;

/**
 * Get full routes path
 * @param routes Routes name 
 * @returns Full path route (module/routes)
 */
function getPath(routes: string) {
    return modulePath + routes;
}

/**
 * Get current dragon module version
 * @param req 
 * @param response 
 * @returns 
 */
async function getCurrentVersion(req: Request, response: Response) {
    try {
        const data: IDragonData = await dragonService.getVersion();
        if (data.currentVersion && typeof data.currentVersion !== "undefined") {
            return response.status(HttpStatusCodes.OK).send(data.currentVersion);
        } else {
            return response.status(HttpStatusCodes.OK).send(data.errorMsg); 
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
        let { forceUpdate } = req.body;
        let { culture } = req.query; // req.params;

        if (typeof forceUpdate == "undefined") {
            forceUpdate = false;
        }

        let dragonCulture : DragonCulture = DragonCulture.fr_fr;
        if (typeof culture !== "undefined" && culture == "en") {
            culture = DragonCulture.en_us;

        } else if (typeof culture !== "undefined" && (culture !== "fr" && culture !== "en")) {
            return response.status(HttpStatusCodes.BAD_REQUEST).send('Culture invalid');  
        }
           

        const data: IDragonData = await dragonService.updateDragon(forceUpdate, dragonCulture);
        if (data) {
            return response.status(HttpStatusCodes.OK).send(data.currentVersion);
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
    updateDragon
} as const;
