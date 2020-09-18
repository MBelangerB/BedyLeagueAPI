// var express = require('express');
// var router = express.Router();

var OverwatchProfileController = require('../../controller/OverwatchProfile');
require('../../util/validator');

var routeInfo = require('../../static/info.json');
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

/*
    Mon API : region=us&tag=Bohe-11734&platform=pc
    let url = `https://playoverwatch.com/fr-fr/career/pc/Bohe-11734#competitive`;
    https://www.npmjs.com/package/jsdom
*/
exports.rank = async function (req, res, next) {
    let { query, params } = req;

    // Gestion de la culture
    validator.parameters.validateCulture(params);

    // Gestion des paramètres
    let queryParameters;
    let queryString = staticFunc.request.lowerQueryString(query);
    console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

    // Valider les QueryString ou Param en fonction de la route utilisé
    var validationResult;
    if (queryString && Object.keys(queryString).length > 0) {
        validationResult = validator.ow.validateQueryString(queryString);
        queryParameters = queryString;
    } else {
        validationResult = validator.ow.validateParams(params);
        queryParameters = params;
    }
    if (validationResult && validationResult.length > 0) {
        res.send(validationResult)
        return;
    }

    // Obtention des stats
    var profileStats = new OverwatchProfileController(queryParameters, generateUrl(queryParameters));

    await profileStats.getProfileStats().then(result => {
        if (result.code === 200) {
            var response = profileStats.getReturnValue();
            if (response.getJson && response.getJson == true) {
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

// router.get('/rank', async function (req, res, next) {
//     try {
//        let queryString = staticFunc.request.lowerQueryString(req.query);

//         var result = validator.ow.validateQueryString(queryString);
//         if (result && result.length > 0) {
//             res.send(result)
//             return;
//         }

//         var profileStats = new OverwatchProfileController(req.query, generateUrl(queryString));

//         await profileStats.getProfileStats().then(result => {
//             if (result.code === 200) {
//                 var response = profileStats.getReturnValue();
//                 if (response.getJson && response.getJson == true) {
//                     res.json(response);
//                 } else {
//                     res.send(response);
//                 }
//             }
//             return;
//         }).catch(error => {
//             res.send(`${error.code} - ${error.err.statusMessage}`);
//             return;
//         });


//     } catch (ex) {
//         console.error(ex);
//         res.send(ex);
//     }
// });


// router.get('/rank/:region/:platform/:tag', async function (req, res, next) {
//     var { params } = req;
//     console.log(`globale ${JSON.stringify(params)}`);
//     validator.parameters.validateCulture(params);

//     var result = validator.ow.validateParams(params);
//     if (result && result.length > 0) {
//         res.send(result)
//         return;
//     }

//     console.log(req);
//     res.send('OK');
// });

function generateUrl(queryParameters) {
    let baseUrl = routeInfo.overwatch.routes.profile;
    baseUrl = baseUrl.replace("{platform}", queryParameters.platform)
    baseUrl = baseUrl.replace("{region}", queryParameters.region)
    baseUrl = baseUrl.replace("{profileName}", queryParameters.tag)

    return baseUrl;
}

// module.exports = router;
