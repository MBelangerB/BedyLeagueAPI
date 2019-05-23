/*
    Import Data
*/
const http = require('http');
const https = require('https');
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
const SummonerDTO = require('./class/SummonerDTO');
const SummonerLeague = require('./class/SummonerLeague');
const RiotUrlApi = require('./class/League/RiotUrlApi');
// const RegionEndPoint = require('./class/League/RegionEndPoint');
const LoLRank = require('./module/LoLRank')

/*
    Init Class
*/


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
app.get('*', function(req, res) {
    res.redirect('/')
});
*/

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

        fullText        : (facultatif) Si Vrai (1) retourne la phrase complète. Sinon retourne seulement $rank ($lp) $series
*/
app.get('/rank', async function (req, res) {
    try {
     //   console.time("ValidateQueryString")
        var isValid = LoLRank.validateQueryString(req.query);
        if (!isValid.isValid) {
            res.json(isValid.errors)
            return;
        }
        var ranking = new LoLRank(req.query)
  //      console.timeEnd("ValidateQueryString")

        var result = await ranking.getSummonerDTO();
        if (typeof result.statusCode !== 'undefined' && result.statusCode !== 200) {
            res.json(result);
            return;
        }

        var resultLeague = await ranking.getSummonerLeague();
        if (typeof result.statusCode !== 'undefined' && resultLeague.statusCode !== 200) {
            res.json(resultLeague);
            return;
        }
  //      if (process.env.DEBUG) { console.debug(ranking) }

        /*
       var t =  Regions.getTagByName('EUW');
       var z =  Regions.isValid(req.query.region);
        */

        var returnValue = ranking.getReturnValue;
        // console.log(returnValue);
        res.send(returnValue);

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