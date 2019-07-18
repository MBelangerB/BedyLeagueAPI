/*
    Import Data
*/
//const http = require('http');
//const https = require('https');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
/*
    Init Module
*/
var app = express();
// var router = express.Router();

/*
    Load Config
*/
dotenv.config();

/*
    Custom Class
*/
const RegionalEndPoint = require('./class/League/RegionEndPoint');
const LoLRank = require('./module/LoLRank')

/*
    Init Class
*/
var Regions = new RegionalEndPoint()

/*  Init RateLimit */
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);



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
    Paramètre
        summonername    : Nom de l'invocateur
        region          : Serveur Riot

        lp              : (facultatif) Afficher les LP
        short           : (facultatif) Si possible, afficher le rang raccourcit. (Plat au lieu Platinium)
        series          : (facultatif) Remplacer les symboles Win/Loose/Pending pour les séries
        queueType           : (facultatif) Permet de spécifier le type de queue qu'on désire valider.

*/

app.get('/rank', async function (req, res) {
    try {
        if (process.env.DEBUG) { console.log(`  Execution pour : ${JSON.stringify(req.query)}`) }
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
        } else if (typeof result.statusCode !== 'undefined' && resultLeague.statusCode !== 200) {
            res.json(resultLeague);
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

/* Démarrage du serveur */
app.listen(process.env.PORT, function () {
    var port = process.env.PORT;
    console.log(`Démarrage du serveur le '${new Date().toString()}' sur le port ${port}`)
})

app.on('close', function () {
    console.log(`Serveur Close at '${new Date().toString()}'`);
})