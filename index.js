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

/*
    Init custom class
*/
var Logging = require('./module/logging');
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

        lp              : (facultatif) Afficher les LP
        short           : (facultatif) Si possible, afficher le rang raccourcit. (Plat au lieu Platinium)
        series          : (facultatif) Remplacer les symboles Win/Loose/Pending pour les séries
        queueType           : (facultatif) Permet de spécifier le type de queue qu'on désire valider.

*/
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
                         'validateQueryString', true);

        // Valider les paramètres
        var validation = SummonerQueue.validateQueryString(req.query);
        if (validation && validation.isValid === false) {
            res.json(validation.errors)
            Logging.writeLog('/v2/rank', ``, 'validateQueryString', false);
            return;
        }    
        Logging.writeLog('/v2/rank', ``, 'validateQueryString', false); 

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/v2/rank', `Before init SummonerQueue`, 'SummonerQueue', true);
        var locSummoner = new SummonerQueue(req.query);
        var result = await locSummoner.getSummonerInfo();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.json(result.err.statusMessage);
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
        var isValid = LeagueRotate.validateQueryString(req.query);
        if (!isValid.isValid) {
            res.json(isValid.errors)
            return;
        }    

        var legData = new LeagueRotate(req.query);
        var result = await legData.getLeagueRotate();

        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.json(result.err.statusMessage);
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

});
app.get('/v2/lastgame', async function (req, res) {

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