
// const routeModule: string = '/dragon';
import HttpStatusCodes from '../../declarations/major/HttpStatusCodes';
import dragonService from "../../services/dragon.service";
import express, { Request, Response } from "express";

const paths = {
    HOME: '/dragon',
    GET_VERSION: '/version',
    UPDATE: '/dragon/update'
} as const;

/**
 * Get current dragon module version
 */
async function getCurrentVersion(req: Request, response: Response) {
    try {
        const data : any = await dragonService.getVersion();
        return response.status(HttpStatusCodes.OK).send(data.version);
    } catch(ex) {
        return response.status(HttpStatusCodes.BAD_REQUEST).send(ex);
    }
}

// **** Made Router **** //
const router = express.Router();

router.get('/', function (req, res) {
    res.redirect(paths.HOME + paths.GET_VERSION);
});

router.get(paths.GET_VERSION, function (req, res) {
    getCurrentVersion(req, res)
});

// **** Export default **** //

export default {
    paths,
    router,
    getCurrentVersion,
} as const;
