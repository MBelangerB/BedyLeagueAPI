/*
    Get Rnak
*/
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { SummonerInfo } = require('../../module/lol/summoner');
const LeagueEntry = require('../../module/lol/rank');

/* GET Rank. */
exports.rank = async function (req, res, next) {
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.RANK);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.RANK);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.RANK);

        /*
            Obtenir initiale le summoner pour avoir EncryptedAccountID
        */
        var summoner = new SummonerInfo(queryParameters);

        await summoner.getSummonerInfo().then(async function (result) {
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
        queryParameters.summoner = summoner.summonerInfo;

        var leagueEntries = new LeagueEntry(queryParameters);
        await leagueEntries.getLeagueRank().then(async function (result) {
            if (result.code === 200) {
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
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });


    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};
