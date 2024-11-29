/* Get Rank */
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { RiotSummonerController } = require('../../controller/riot/RiotSummonerController');
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
        const urlParameters = staticFunc.request.parseUrlParameters(params, query);
        console.log(`UrlParameters: ${JSON.stringify(urlParameters)}`);

        /*
            On effectue initialement la validation des Params (region/SummonerName).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        let validationErrors = validator.lol.validateParams(urlParameters, validator.lol.METHOD_ENUM.RANK);
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors);
            return;
        }
        validator.lol.fixOptionalParams(urlParameters, validator.lol.METHOD_ENUM.RANK);

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
            urlParameters.dbSummoner = result;

            if (res.statusCode === 200 && result.riotId !== '') {
                const leagueEntries = new LeagueEntry(urlParameters);
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
    }
};
