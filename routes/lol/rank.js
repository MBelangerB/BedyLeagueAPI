/*
    Get Rank
*/
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { SummonerInfo } = require('../../module/lol/summoner');
const LeagueEntry = require('../../module/lol/rank');

/* GET Rank. */
exports.rankRework = async function (req, res, next) {
    //TODO: Replace by doc URL
    return res.send(`Invalid URL, please use 'api.bedyapi.com' or contact the support for more informations.`);
};


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
            console.error("Error in validationErrors")
            console.error(validationErrors);
            res.send(`'please try again'`);

        //    res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.RANK);

        /*
            Obtenir initiale le summoner pour avoir EncryptedAccountID
        */
        var summoner = new SummonerInfo(queryParameters);

        await summoner.getSummonerInfo().then(async function (result) {
            if (result.code !== 200) {
                console.error(`Return code is invalid in getSummonerInfo`);
                console.error(`${result.code} - ${result}`);
                res.send(`'please try again'`);
            } else {
                return result.data;
            }
            return;

        }).catch(error => {
            console.error(`An error occured during getSummonerInfo`);
            console.error(`${error.code} - ${error.err.statusMessage}`);
            res.send(``);
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
            console.error(`An error occured during getLeagueRank`);
            console.error(`${error.code} - ${error.err.statusMessage}`);
            res.send(``);
            return;
        });


    } catch (ex) {
        console.error("Error in GetRank")
        console.error(ex);
        res.send(`'please try again'`);
    }
};
