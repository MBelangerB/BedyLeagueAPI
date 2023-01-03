/*
    GetSummonerInfo
    GetTopMasteries
    GEtLiveGame
*/

const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { RiotSummonerController } = require('../../controller/riot/RiotSummonerController');
const { SummonerMasteries } = require('../../module/lol/summoner');

/* GET summonerInfo. */
exports.summonerInfo = async function (req, res) {
    try {
        /*
            Params => Paramètre de URL : /en/lol/summonerInfo/NA/Bohe
                - Path : lol/summonerInfo (not a params)
                - Culture : EN 
                - Region : NA
                - SummonerName : Bohe
        */
        const { query, params } = req;

        // Gestion de la culture
        validator.parameters.validateCulture(params);

        // Gestion des paramètres
        const urlParameters = staticFunc.request.parseUrlParameters(params, query);
        console.log(`UrlParameters: ${JSON.stringify(urlParameters)}`);

        /*
            On effectue initialement la validation des Params (region/SummonerName).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        let validationErrors = validator.lol.validateParams(urlParameters, validator.lol.METHOD_ENUM.SUMMONER_INFO);
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(urlParameters, validator.lol.METHOD_ENUM.SUMMONER_INFO);

        /*
            On call le RiotSummoner controller qui vérifie si l'information est dans la BD
            Si oui, on utilise cette information.
            Si non, on call API de Riot et on ajoutes l'item en BD.

            Si l'information est présente en BD, on valide qu'elle soit a jours (1 update au 12 heures)
        */
        let result = await RiotSummonerController.findSummoner(urlParameters).then(success => {
            return success;

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
            if (urlParameters.json && urlParameters.json == true) {
                res.json(result);
            } else {
                res.send(await result.getSummonerInfo());
            }
        }
        return;

    } catch (ex) {
        console.error('A error occured in GetSummonerInfo');
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
        const urlParameters = staticFunc.request.parseUrlParameters(params, query);
        console.log(`UrlParameters: ${JSON.stringify(urlParameters)}`);

        /*
            On effectue initialement la validation des Params (region/SummonerName).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        let validationErrors = validator.lol.validateParams(urlParameters, validator.lol.METHOD_ENUM.MASTERIES);
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(urlParameters, validator.lol.METHOD_ENUM.MASTERIES);


        /*
            On call le RiotSummoner controller qui vérifie si l'information est dans la BD
            Si oui, on utilise cette information.
            Si non, on call API de Riot et on ajoutes l'item en BD.

            Si l'information est présente en BD, on valide qu'elle soit a jours (1 update au 12 heures)
        */
        let result = await RiotSummonerController.findSummoner(urlParameters).then(success => {
            return success;

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
            //TODO: Voir si on peut améliorer la structure du code
            urlParameters.id = result.riotId;

            const masteries = new SummonerMasteries(urlParameters);

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
        }

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};
