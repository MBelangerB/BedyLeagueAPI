/* Get Rotate */
const routeInfo = require('../../static/info.json');
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

/* Temp */
const ChampionRotations = require('../../module/lol/league');

/* GET home page. */
exports.rotate = async function (req, res) {
    try {
        const { query, params } = req;

        // Gestion de la culture
        validator.parameters.validateCulture(params);

        // Gestion des paramètres
        let queryParameters;
        const queryString = staticFunc.request.lowerQueryString(query);
        console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

        /*
            On effectue initialement la validation des Params (region/platform/tag).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        let validationErrors = [];
        if (params && Object.keys(params).length > 1) {
            validationErrors = validator.lol.validateRotateParams(params);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateRotateParams(queryString);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.status(400).send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters);

        const championRotate = new ChampionRotations(queryParameters, generateUrl(queryParameters));

        await championRotate.getLeagueRotate().then(async function(rotateResult) {
            if (rotateResult.code === 200) {
                await championRotate.getReturnValue().then(result => {
                    if (championRotate.getJson && championRotate.getJson == true) {
                        res.status(200).json(result);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
            return;

        }).catch(error => {
            res.status(400).send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });

    } catch (ex) {
        console.error(ex);
        res.status(500).send(ex);
    }
};


function generateUrl(queryParameters) {
    let baseUrl = routeInfo.lol.routes.champion.v3.championRotation;
    baseUrl = baseUrl.replace('{region}', queryParameters.region);

    return baseUrl;
}

