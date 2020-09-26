/*
    GetSummonerInfo
    GetTopMasteries
    GEtLiveGame
*/


// var routeInfo = require('../../static/info.json');
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { SummonerInfo, SummonerMasteries } = require('../../module/lol/summoner');

/* GET summonerInfo. */
exports.summonerInfo = async function (req, res, next) {
    try {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.SUMMONER_INFO);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.SUMMONER_INFO);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters,  validator.lol.METHOD_ENUM.SUMMONER_INFO);

        var summonerInfo = new SummonerInfo(queryParameters);

        await summonerInfo.getSummonerInfo().then(async function(result) {
            if (result.code === 200) {
                await summonerInfo.getReturnValue().then(result => {
                    if (summonerInfo.getJson && summonerInfo.getJson == true) {
                        res.json(result);
                    } else {
                        res.send(result);
                    }    
                });
            }
            return;

        }).catch(error => {
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

exports.topMasteries = async function (req, res, next) {
    try {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.MASTERIES);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.MASTERIES);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters,  validator.lol.METHOD_ENUM.MASTERIES);

        /*
            Obtenir initiale le summoner pour avoir EncryptedAccountID
        */
       var summoner = new SummonerInfo(queryParameters);

       await summoner.getSummonerInfo().then(async function(result) {
           if (result.code !== 200) {
               res.send(`An error occured during getSummonerInfo`)
           } else {
               return result.data;
           }
           return;

       }).catch(error => {
           res.send(`${error.code} - ${error.err.statusMessage}`);
           return;
       });
       queryParameters.id = summoner.summonerInfo.id;

       var masteries = new SummonerMasteries(queryParameters);

        await masteries.getSummonerMasteries().then(async function(result) {
            if (result.code === 200) {
                await masteries.getReturnValue().then(result => {
                    if (masteries.getJson && masteries.getJson == true) {
                        res.json(result);
                    } else {
                        res.send(result);
                    }    
                });
            }
            return;

        }).catch(error => {
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });


    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

exports.liveGame = async function (req, res, next) {
    try {
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
            validationErrors = validator.lol.validateRotateParams(params);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateRotateParams(queryString);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters);

        // var championRotate = new ChampionRotations(queryParameters, generateUrl(queryParameters));

        // await championRotate.getLeagueRotate().then(async function(result) {
        //     if (result.code === 200) {
        //         await championRotate.getReturnValue().then(result => {
        //             if (championRotate.getJson && championRotate.getJson == true) {
        //                 res.json(result);
        //             } else {
        //                 res.send(result);
        //             }    
        //         });
        //     }
        //     return;

        // }).catch(error => {
        //     res.send(`${error.code} - ${error.err.statusMessage}`);
        //     return;
        // });

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};


// function generateUrl(queryParameters) {
//     let baseUrl = routeInfo.lol.routes.champion.v3.championRotation;
//     baseUrl = baseUrl.replace("{region}", queryParameters.region)

//     return baseUrl;
// }

