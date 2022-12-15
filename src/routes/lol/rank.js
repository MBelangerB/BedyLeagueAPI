/* Get Rank */
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { RiotSummonerController } = require('../../controller/riot/RiotSummonerController');
const { SummonerInfo } = require('../../module/lol/summoner');
const LeagueEntry = require('../../module/lol/rank');

/* GET Rank. */
exports.rankRework = async function (req, res) {
    // TODO: Replace by doc URL
    return res.send('Invalid URL, please use \'api.bedyapi.com/lol/rank/\' or contact the suppor on \'bedyapi.com\' for more informations.');
};

exports.rank = async function (req, res) {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.RANK);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.RANK);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            console.error('Error in validationErrors');
            console.error(validationErrors);
            return res.status(400).send('Invalid parameters, please try again');
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.RANK);

        /*
            On call le RiotSummoner controller qui vérifie si l'information est dans la BD
            Si oui, on utilise cette information.
            Si non, on call API de Riot et on ajoutes l'item en BD.

            Si l'information est présente en BD, on valide qu'elle soit a jours (1 update au 12 heures)
        */
        let result = await RiotSummonerController.findSummoner(queryParameters).then(success => {
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
            queryParameters.dbSummoner = result;

            if (res.statusCode === 200 && result.riotId !== '') {
                const leagueEntries = new LeagueEntry(queryParameters);
                await leagueEntries.getLeagueRank().then(async function (rankResult) {
                    if (rankResult.code === 200) {
                        await leagueEntries.getReturnValue().then(result => {
                            if (leagueEntries.getJson && leagueEntries.getJson == true) {
                                res.json(result);
                            } else {
                                res.send(result);
                            }
                        });
                    }
                    return;
        
                }).catch(error => {
                    console.error('An error occured during getLeagueRank');
                    console.error(`${error.code} - ${error.err.statusMessage}`);
                    res.status(400).send('A error occured, please try again');
                    return;
                });
            }
        }

    } catch (ex) {
        console.error('A error occured in GetRank');
        console.error(ex);
        res.status(500).send(ex);

        // console.error('Error in GetRank');
        // console.error(ex);
        // res.status(500).send('A error occured, please try again');
    }
};
