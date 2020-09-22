// var express = require('express');
// var router = express.Router();

var OverwatchProfileController = require('../../controller/OverwatchProfile');

var routeInfo = require('../../static/info.json');
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

/*
    Mon API : region=us&tag=Bohe-11734&platform=pc
    let url = `https://playoverwatch.com/fr-fr/career/pc/Bohe-11734#competitive`;
    https://www.npmjs.com/package/jsdom
*/
/**
 * Permet d'obtenir le rang OW
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * QueryString :
 * 
 * 
 * Paramètre optionel
 *  showLevel   : Affiche le niveau du joueur
 *  fullString  : Retourne une chaine complète (avec TAG du joueur)
 *  json        : Retourne le résultat en JSON
 */
exports.rank = async function (req, res, next) {
    let { query, params } = req;

    // Gestion de la culture
    validator.parameters.validateCulture(params);

    // Gestion des paramètres
    let queryParameters;
    let queryString = staticFunc.request.lowerQueryString(query);
    console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

    /*
        On effectue initialement la validation des Params (region/platform/tag).
        Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
        en QueryString
    */
    var validationErrors = [];
    if (params && Object.keys(params).length > 1) {
        validationErrors = validator.ow.validateParams(params);
        queryParameters = params;
    } else {
        validationErrors = validator.ow.validateQueryString(queryString);
        queryParameters = queryString;   
    }    
    if (validationErrors && validationErrors.length > 0) {
        res.send(validationErrors)
        return;
    }
    validator.ow.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters);

    // Obtention des stats
    var profileStats = new OverwatchProfileController(queryParameters, generateUrl(queryParameters));

    await profileStats.getProfileStats().then(result => {
        if (result.code === 200) {
            var response = profileStats.getReturnValue();
            if (profileStats.getJson && profileStats.getJson == true) {
                res.json(response);
            } else {
                res.send(response);
            }
        }
        return;
    }).catch(error => {
        res.send(`${error.code} - ${error.err.statusMessage}`);
        return;
    });
};


function generateUrl(queryParameters) {
    let baseUrl = routeInfo.overwatch.routes.profile;
    baseUrl = baseUrl.replace("{platform}", queryParameters.platform)
    baseUrl = baseUrl.replace("{region}", queryParameters.region)
    baseUrl = baseUrl.replace("{profileName}", queryParameters.tag)

    return baseUrl;
}
