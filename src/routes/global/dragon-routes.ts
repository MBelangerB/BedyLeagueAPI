import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
// import dragonService from '../../services/dragon-service';
import { Request, Response } from 'express';
// import { IDragonData } from '../../models/dragon/dragon-model';
import { DragonService, IDragonVersion, ReturnData } from 'bedyriot';
import { DragonCulture, DragonFile } from 'bedyriot/build/declaration/enum';
import { IDragonChampion } from 'bedyriot/build/model/DragonModel';
// import { ReturnData } from 'src/models/IReturnData';
// import { IDragonVersion } from 'bedyriot/build/model/DragonModel';
// import { ReturnData } from 'bedyriot/build/declaration/interface/IReturnData';
// import { DragonCulture } from '../../declarations/enum';
// import { IReturnData, ReturnData } from '../../models/IReturnData';

const modulePath = '/dragon';

const routes = {
    HOME: '/',
    GET_VERSION: '/version',
    UPDATE: '/update',
    // TEST: '/test'
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

// /**
//  * Get current dragon module version
//  * @param req
//  * @param response
//  * @returns
//  */
// async function getDragonChamps(req: Request, response: Response) {
//     try {
//         // const dragonVData: ReturnData<IDragonVersion> = await DragonService.getDragonVersion();

//         const dragonData: Map<number, IDragonChampion> = await DragonService.readDragonChampionFile(DragonCulture.fr_fr);
//         let test: IDragonChampion | undefined = dragonData.get(54);

//         console.log(test);
//         console.dir(test);
//         if (dragonData) {
//             // const url: string = DragonService.getFileUrl(DragonFile.Champion, DragonCulture.fr_fr, dragonData.data!);
//             // let t = await DragonService.downloadDragonFile(url, DragonCulture.fr_fr, dragonData.data!);

//             return response.status(HttpStatusCodes.OK).send(test);
//         }

//     } catch (ex) {
//         return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
//     }
// }

/**
 * Performs the update of the dragons files
 * @param req
 * @param response
 * @returns
 */
// async function updateDragon(req: Request, response: Response) {
//     try {
//         const forceUpdate: boolean = ((req.query?.forceUpdate == 'true' || (req.query?.forceUpdate == '1')) || false);
//         const culture: string = (req.query.culture as string);

//         let dragonCulture : DragonCulture = DragonCulture.fr_fr;
//         if (typeof culture !== 'undefined' && culture == 'en') {
//             dragonCulture = DragonCulture.en_us;
//         } else if (typeof culture !== 'undefined' && (culture !== 'fr' && culture !== 'en')) {
//             return response.status(HttpStatusCodes.BAD_REQUEST).send('Culture invalid');
//         }

//         const data: IReturnData<IDragonData> = await dragonService.updateDragon(forceUpdate, dragonCulture);
//         if (data) {
//             return response.status(HttpStatusCodes.OK).send(data.messages);
//         }

//     } catch (ex) {
//         return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
//     }
// }

// **** Export default **** //

export default {
    routes,
    modulePath,
    getPath,
    getCurrentVersion,
    // getDragonChamps,
    // updateDragon,
} as const;
