/*
    GetSummonerInfo
    GetTopMasteries
    GEtLiveGame
*/

const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

require('dotenv').config();
const culture = (process.env.culture || 'fr');

const moment = require('moment');
moment.locale(culture);

const { RiotSummonerController } = require('../../controller/riot/RiotSummonerController');
const { SummonerInfo, SummonerMasteries } = require('../../module/lol/summoner');

/* GET summonerInfo. */
exports.summonerInfo = async function (req, res) {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.SUMMONER_INFO);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.SUMMONER_INFO);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.SUMMONER_INFO);

        /*
            On call le RiotSummoner controller qui vérifie si l'information est dans la BD
            Si oui, on utilise cette information.
            Si non, on call API de Riot et on ajoutes l'item en BD.

            Si l'information est présente en BD, on valide qu'elle soit a jours (1 update au 12 heures)
        */
        let result = await RiotSummonerController.findSummoner(queryParameters).then(async success => {
            let data;
            if (success && success.code == 200 && success.summonerInfo) {
                // Call Riot API for get SummonerInfo and create SummonerInfo in DB
                data = await RiotSummonerController.createOrUpdateSummoner(success.summonerInfo, success.region, null);

            } else if (success && success.code == 200 && success.summoner) {
                const lastUpdate = moment(success.summoner.updateAt);
                // TODO: hours
                if (moment().diff(lastUpdate, 'hours') >= 12) {
                    // Update
                    let updatedResult = await RiotSummonerController.getSummonerInfo(success, queryParameters).then(summonerInfo => {
                        return summonerInfo.data;
                    }).catch(err => {
                        throw err;
                    });
                    data = await RiotSummonerController.createOrUpdateSummoner(updatedResult, success.region, success.summoner);
                } else {
                    data = success.summoner;
                }
            }
            return data;

        }).then(dbCreate => {
            return dbCreate;

        }).catch(ex => {
            console.error(ex);
            if (ex.code == 404 && ex.error.message != '') {
                res.status(404).send(ex.error.message);
            } else if (ex.error.stack) {
                res.status(500).send(ex.error.stack);
            } else {
                res.status(500).send(ex);
            }
        });

        if (result) {
            // TODO: Voir a remove SummonerInfo et utilisé directement JSON ?
            // TODO: Switch la structure JSON pour avoir le même retour qu'avant (ou si JSON tjs faire un call a API naah ?)
            const summonerInfo = new SummonerInfo(queryParameters);
            if (summonerInfo.getJson && summonerInfo.getJson == true) {
                res.json(result);
            } else {
                res.send(await result.getSummonerInfo());
            }
        }
        return;

    } catch (ex) {
        console.error(ex);
        res.status(500).send(ex);
    }
};

exports.topMasteries = async function (req, res) {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.MASTERIES);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.MASTERIES);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.MASTERIES);

        /*
            Obtenir initiale le summoner pour avoir EncryptedAccountID
        */
        const summoner = new SummonerInfo(queryParameters);

        await summoner.getSummonerInfo().then(async function (result) {
            if (result.code !== 200) {
                res.send('An error occured during getSummonerInfo');
            } else {
                return result.data;
            }
            return;

        }).catch(error => {
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });
        queryParameters.id = summoner.summonerInfo.id;

        const masteries = new SummonerMasteries(queryParameters);

        await masteries.getSummonerMasteries().then(async function (masteriesResult) {
            if (masteriesResult.code === 200) {
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

exports.liveGame = async function (req, res) {
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
            res.send(validationErrors);
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

