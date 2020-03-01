/*
    Import Data
*/
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const url = require('url');  

/*
    Init Module
*/
var app = express();

/*
    Load Config
*/
dotenv.config();

/*
    Custom Class V1
*/
const LoLRank = require('./module/v1/LoLRank');
const LoLRotate = require('./module/v1/LolRotate');

/*
    Custom Class V2
*/
const SummonerQueue = require('./module/v2/SummonerQueue');
const LeagueRotate = require('./module/v2/LeagueRotate');
const LeagueChampionMasteries = require('./module/v2/LeagueChampionMasteries');
const LeagueActiveGame = require('./module/v2/LeagueLiveGame');

/*
    Init custom class
*/
var Logging = require('./module/logging');
var static = require('./static/staticFunction');
require('./static/Prototype.js');

/*
    Affectation APP
*/

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use('/web', express.static(__dirname + '/web'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/web/index.html'));
});

/*
    League API

    get query&params in express etc. example.com/user/000000?sex=female
    app.get('/user/:id', function(req, res) {
        const query = req.query;// query = {sex:"female"}
        const params = req.params; //params = {id:"000000"}

})
http://localhost:3000/rank/euw/name/bohe
app.get('/rank/:region/name/:summonerName', async function (req, res) {
    res.send(req.params)
})
*/

/*
    Redirecton version
*/

/*
    Paramètre
        summonername    : Nom de l'invocateur
        region          : Serveur Riot

        lp              : (facultatif) Afficher les LP
        short           : (facultatif) Si possible, afficher le rang raccourcit. (Plat au lieu Platinium)
        series          : (facultatif) Remplacer les symboles Win/Loose/Pending pour les séries
        queueType           : (facultatif) Permet de spécifier le type de queue qu'on désire valider.

*/
app.get('/rank', async function (req, res) {
    /*
    var currentUrl = req.originalUrl;
    var newUrl = `v2${currentUrl}`;
    */
    var passedUrl = url.format({
        pathname:'/v2/rank',
        query:req.query,
      });

    res.redirect(passedUrl);
});
/*
    Paramètre
        region          : Serveur Riot
*/
app.get('/rotate', async function (req, res) {
    var passedUrl = url.format({
        pathname:'/v2/rotate',
        query:req.query,
      });

    res.redirect(passedUrl);
});
/*
    Paramètre
        summonername    : Nom de l'invocateur
        region          : Serveur Riot
*/
app.get('/livegame', async function (req, res) {
    var passedUrl = url.format({
        pathname:'/v2/livegame',
        query:req.query,
      });

    res.redirect(passedUrl);
});
/*
    Paramètre
        summonername    : Nom de l'invocateur
        region          : Serveur Riot
        nb              : Nombre de champions a afficher
*/
app.get('/topMasteries', async function (req, res) {
    var passedUrl = url.format({
        pathname:'/v2/topMasteries',
        query:req.query,
      });

    res.redirect(passedUrl);
});

// Version 1
app.get('/v1/rank', async function (req, res) {
    try {
        if (process.env.DEBUG) { console.log(`  Execution pour /rank : ${JSON.stringify(req.query)}`) }
        if (process.env.LOG_EXECUTION_TIME) { console.time("Before Execute validateQueryString"); }

        // Valider les paramètres
        var isValid = LoLRank.validateQueryString(req.query);
        if (!isValid.isValid) {
            res.json(isValid.errors)
            if (process.env.LOG_EXECUTION_TIME) { console.timeEnd("After executing validateQueryString"); }
            return;
        }    
        if (process.env.LOG_EXECUTION_TIME) { console.timeEnd("After executing validateQueryString"); }
        var ranking = new LoLRank(req.query)
          
        // Cache
        if (process.env.LOG_EXECUTION_TIME) { console.time("Before Execute GetCacheDTO"); }
        var result = await ranking.GetCacheDTO(); 
        if (result && typeof result.statusCode === "undefined" && ranking.summmonerDTO.id === "") {
            ranking.summmonerDTO = result;
            if (result) { 
                ranking.ReqQuery.setSummonerDTO(result);
            }
        }
        if (process.env.LOG_EXECUTION_TIME) { console.timeEnd("After executing GetCacheDTO"); } 

        // Gestion des cas erreur
        if (typeof result.statusCode !== 'undefined' && result.statusCode === '200-1') {
            res.json(result.statusMessage);
            return;
        } else if (typeof result.statusCode !== 'undefined' && result.statusCode !== 200) {
            res.json(result);
            return;
        }


        if (process.env.LOG_EXECUTION_TIME) { console.time("Before execute getCacheLeague"); }
        // Cache
        var resultLeague = await ranking.getCacheLeague();
        if (resultLeague && ranking.summmonerLeague.length === 0) {
            ranking.summmonerLeague = resultLeague;
        }

        if (typeof resultLeague.statusCode !== 'undefined' && resultLeague.statusCode === '200-1') {
            res.json(resultLeague.statusMessage);
            return;
        } else if (typeof resultLeague.statusCode !== 'undefined' && resultLeague.statusCode !== 200) {
            res.json(resultLeague.statusMessage);
            return;
        }
        if (process.env.LOG_EXECUTION_TIME) { console.timeEnd("After executing getCacheLeague"); }

    

        if (process.env.LOG_EXECUTION_TIME) { console.time("Before execute getReturnValue"); }
        var returnValue = ranking.getReturnValue(ranking.castQueueType());
        res.send(returnValue);
        if (process.env.LOG_EXECUTION_TIME) { console.timeEnd("After execute getReturnValue"); }
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/v1/rotate', async function (req, res) {
    try {
        if (process.env.DEBUG) { console.log(`  Execution pour /rotate : ${JSON.stringify(req.query)}`) }

        // Valider les paramètres
        var isValid = LoLRotate.validateQueryString(req.query);
        if (!isValid.isValid) {
            res.json(isValid.errors)
            return;
        }    
        var rotate = new LoLRotate(req.query)
          
        // Cache
        var result = await rotate.GetCacheRotate(); 
        
        if (result && typeof result.statusCode === "undefined" && rotate.rotateData.freeChampionIds.length === 0) {
            rotate.rotateData = result;
            if (result) { 
                rotate.setCacheRotate(result);
            }
        }

        var returnValue = rotate.getReturnValue();
        res.send(returnValue);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

// Version 2
app.get('/v2/rank', async function (req, res) {
    try {
        Logging.writeLog('/v2/rank', `Execute GetRank with data ${JSON.stringify(req.query)}`, 
                         'validateSummonerAndRegion', true);

        // Valider les paramètres
        var validation = static.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            Logging.writeLog('/v2/rank', ``, 'validateSummonerAndRegion', false);
            return;
        }    
        Logging.writeLog('/v2/rank', ``, 'validateSummonerAndRegion', false); 

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/v2/rank', `Before init SummonerQueue`, 'SummonerQueue', true);
        var locSummoner = new SummonerQueue(req.query);
        var result = await locSummoner.getSummonerInfo();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        Logging.writeLog('/v2/rank', ``, 'SummonerQueue', false);

        Logging.writeLog('/v2/rank', `Before getReturnValue`, 'SummonerQueue', true);
        var response = locSummoner.getReturnValue(locSummoner.queueType);   
        Logging.writeLog('/v2/rank', ``, 'SummonerQueue', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/v2/rotate', async function (req, res) {
    try {
        Logging.writeLog('/v2/rotate', `Execute GetRotate`, 
                         'GetRotate', true);

       // Valider les paramètres
        var isValid = static.validateRegion(req.query);
        if (!isValid.isValid) {
            res.json(isValid.errors)
            return;
        }    

        var legData = new LeagueRotate(req.query);
        var result = await legData.getLeagueRotate();

        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        Logging.writeLog('/v2/rotate', ``, 'GetRotate', false); 


        Logging.writeLog('/v2/rotate', `Before getReturnValue`, 'LeagueRotate', true);
        var response = legData.getReturnValue();   
        Logging.writeLog('/v2/rotate', `Before getReturnValue`, 'LeagueRotate', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/v2/livegame', async function (req, res) {
    try {
        Logging.writeLog('/v2/livegame', `Execute livegame with data ${JSON.stringify(req.query)}`, 
                         'validateSummonerAndRegion', true);

        // Valider les paramètres
        var validation = static.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            Logging.writeLog('/v2/livegame', ``, 'validateSummonerAndRegion', false);
            return;
        }    
        Logging.writeLog('/v2/livegame', ``, 'validateSummonerAndRegion', false); 

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/v2/livegame', `Before init LeagueActiveGame`, 'LeagueActiveGame', true);
   
        var activeGame = new LeagueActiveGame(req.query);
        var result = await activeGame.getLiveGame();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
   
        Logging.writeLog('/v2/livegame', ``, 'LeagueActiveGame', false);

        Logging.writeLog('/v2/livegame', `Before getReturnValue`, 'getActionGameDetails', true);
        var response = activeGame.getActionGameDetails();   
        Logging.writeLog('/v2/livegame', ``, 'getActionGameDetails', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }   
});
// Top stats masteries
app.get('/v2/topMasteries', async function (req, res) {
    try {
        Logging.writeLog('/v2/topMasteries', `Execute GetTopMasteries with data ${JSON.stringify(req.query)}`, 
                         'validateSummonerAndRegion', true);

        // Valider les paramètres
        var validation = static.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            Logging.writeLog('/v2/topMasteries', ``, 'validateSummonerAndRegion', false);
            return;
        }    
        Logging.writeLog('/v2/topMasteries', ``, 'validateSummonerAndRegion', false); 

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/v2/topMasteries', `Before init LeagueChampionMasteries`, 'LeagueChampionMasteries', true);
        var champMasteries = new LeagueChampionMasteries(req.query);
        var result = await champMasteries.getChampionsMasteries();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        Logging.writeLog('/v2/topMasteries', ``, 'LeagueChampionMasteries', false);

        Logging.writeLog('/v2/topMasteries', `Before getReturnValue`, 'LeagueChampionMasteries', true);
        var response = champMasteries.getReturnValue(champMasteries.queueType);   
        Logging.writeLog('/v2/topMasteries', ``, 'LeagueChampionMasteries', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});




// Stats 10 dernières games
app.get('/v2/lastgame', async function (req, res) {

});
app.get('/v2/currentChampion', async function (req, res) {
    // en DEV
    try {
        Logging.writeLog('/v2/currentChampion', `Execute GetcurrentChampion with data ${JSON.stringify(req.query)}`, 
                         'validateSummonerAndRegion', true);

        // Valider les paramètres
        var validation = static.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.json(validation.errors)
            Logging.writeLog('/v2/currentChampion', ``, 'validateSummonerAndRegion', false);
            return;
        }    
        Logging.writeLog('/v2/currentChampion', ``, 'validateSummonerAndRegion', false); 

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/v2/topMasteries', `Before init LeagueChampionMasteries`, 'LeagueChampionMasteries', true);
   
        var activeGame = new LeagueActiveGame(req.query);
        var result = await activeGame.getLiveGame();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.json(result.err.statusMessage);
            return;
        }
   
        Logging.writeLog('/v2/currentChampion', ``, 'LeagueChampionMasteries', false);

        Logging.writeLog('/v2/currentChampion', `Before getReturnValue`, 'LeagueChampionMasteries', true);
        var response = activeGame.getCurrentChampionData();   
        Logging.writeLog('/v2/currentChampion', ``, 'LeagueChampionMasteries', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

/* Démarrage du serveur */
app.listen(process.env.PORT, function () {
    var port = process.env.PORT;
    Logging = new Logging(process.env);

    console.log(`Démarrage du serveur le '${new Date().toString()}' sur le port ${port}`)
})

app.on('close', function () {
    console.log(`Serveur Close at '${new Date().toString()}'`);
})