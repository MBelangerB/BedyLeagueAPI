/*
    Get OVerlay
*/
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');

const { SummonerInfo } = require('../../module/lol/summoner');
const LeagueEntry = require('../../module/lol/rank');


/*
    Mode 1 :
        - Embleme + Rank + LP
    Mode 2 :
        - Full
*/

/* GET Rank Overlay. */
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
            validationErrors = validator.lol.validateParams(params, validator.lol.METHOD_ENUM.OVERLAY);
            queryParameters = params;
        } else {
            validationErrors = validator.lol.validateParams(queryString, validator.lol.METHOD_ENUM.OVERLAY);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }
        validator.lol.fixOptionalParams(staticFunc.request.clone(queryString), queryParameters, validator.lol.METHOD_ENUM.OVERLAY);

        /*
            Obtenir initiale le summoner pour avoir EncryptedAccountID
        */
        var summoner = await getSummonerInfo(queryParameters);
        queryParameters.summoner = summoner.summonerInfo;
        queryParameters.json = 1;   // On force le JSON pour pouvoir traiter le data
        /*
            Obtenir les LeagueEntry
        */
        var leagueEntries = await getLeagueEntry(queryParameters);
        await leagueEntries.getLeagueRank().then(async function (result) {
            if (result.code === 200) {
                await leagueEntries.getOverlayData(queryParameters.mode).then(resultData => {
                    if (resultData.mode !== 2) {
                        res.render('overlay/lol_mode1', { title: 'BedyAPI', data: resultData  });
                    } else {
                        res.render('overlay/lol_mode2', { title: 'BedyAPI', data: resultData  });
                    }
                  
                    return resultData;
                });
            }

        }).catch(error => {
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

async function getSummonerInfo(queryParameters) {
    var summoner = new SummonerInfo(queryParameters);

    await summoner.getSummonerInfo().then(async function (result) {
        if (result.code !== 200) {
            throw new Exception(`An error occured during getSummonerInfo`)
        } else {
            return result.data;
        }
        return;

    }).catch(error => {
        res.send(`${error.code} - ${error.err.statusMessage}`);
        return;
    });    

    return summoner;
}

async function getLeagueEntry(queryParameters) {
    var leagueEntries = new LeagueEntry(queryParameters);
    await leagueEntries.getLeagueRank().then(async function (result) {
        if (result.code === 200) {
            return result;
        } else {
            throw new Exception(`An error occured during getLeagueRank`) 
        }
        return;

    }).catch(error => {
        res.send(`${error.code} - ${error.err.statusMessage}`);
        return;
    });
    return leagueEntries;
}
