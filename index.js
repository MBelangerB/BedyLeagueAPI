/*
    Import Data
*/
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const url = require('url');
const moment = require("moment");
const morgan = require('morgan')

/*  
    HTML Parser
*/
/*
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
*/

/*
    Init Module
*/
var app = express();

/*    Initialize Modules   */
dotenv.config();

/*
    Custom Module V2
*/
const SummonerQueue = require('./module/v2/SummonerQueue');
const LeagueRotate = require('./module/v2/LeagueRotate');
const LeagueChampionMasteries = require('./module/v2/LeagueChampionMasteries');
const LeagueActiveGame = require('./module/v2/LeagueLiveGame');
var Logging = require('./module/logging');

/*
    OW Module
*/
const OverwatchProfilStats = require('./module/ow/OverwatchProfilStats');

/*
    Init custom class
*/
var jsonConfig = require('./class/jsonConfig');
var riotUserInfo = require('./webModule/riotUserInfo')
var staticFunction = require('./static/staticFunction');
require('./static/Prototype.js');

/*
    Affectation APP
*/

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use('/web', express.static(__dirname + '/web'));

/*
// since logger only returns a UTC version of date, I'm defining my own date format - using an internal module from console-stamp
express.logger.format('mydate', function() {

    var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");
    return `${currentDateTime}`;
  //  var df = require('console-stamp/node_modules/dateformat');
  //  return df(new Date(), 'HH:MM:ss.l');
});
app.use(express.logger('[:mydate] :method :url :status :res[content-length] - :remote-addr - :response-time ms'));
*/

 
app.use(morgan(function (tokens, req, res) {
    if (res.statusCode === 302) { return null; }

    var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");
    return [
      `[${currentDateTime}] : `,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res), 'ms'
    ].join(' ')
  }))  

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
        pathname: '/v2/rank',
        query: req.query,
    });

    res.redirect(passedUrl);
});
/*
    Paramètre
        region          : Serveur Riot
*/
app.get('/rotate', async function (req, res) {
    var passedUrl = url.format({
        pathname: '/v2/rotate',
        query: req.query,
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
        pathname: '/v2/livegame',
        query: req.query,
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
        pathname: '/v2/topMasteries',
        query: req.query,
    });

    res.redirect(passedUrl);
});



// Version 2 (with json)
app.get('/v2/rank', async function (req, res) {
    try {
       const { query } = req;

       /*
        Logging.writeLog('/v2/rank', `Execute GetRank with data ${JSON.stringify(query)}`,
            'validateSummonerAndRegion', true);
        */

        // Valider les paramètres
        var fpath = path.join(__dirname + '/data/client.json')
        var validation = await staticFunction.validateSummonerAndRegion(query, fpath);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
          //  Logging.writeLog('/v2/rank', ``, 'validateSummonerAndRegion', false);
            return;
        }

        // Obtenir les informations sur l'invocateur
        var locSummoner = new SummonerQueue(query);
        var result = await locSummoner.getSummonerInfo();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
           // Logging.writeLog('/v2/rank', ``, 'validateSummonerAndRegion', false);
            return;
        }
        var response = locSummoner.getReturnValue(locSummoner.queueType);

     //   Logging.writeLog('/v2/rank', ``, 'validateSummonerAndRegion', false);
        if (locSummoner.getJson) {
            res.json(response);
        } else {
            res.send(response);
        }

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/v2/rotate', async function (req, res) {
    try {
        /*
        Logging.writeLog('/v2/rotate', `Execute GetRotate`,
            'GetRotate', true);
        */
        // Valider les paramètres
        var isValid = await staticFunction.validateRegion(req.query);
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
    //    Logging.writeLog('/v2/rotate', ``, 'GetRotate', false);


      //  Logging.writeLog('/v2/rotate', `Before getReturnValue`, 'LeagueRotate', true);
        var response = legData.getReturnValue();
    //   Logging.writeLog('/v2/rotate', `Before getReturnValue`, 'LeagueRotate', false);
        if (legData.getJson) {
            res.json(response);
        } else {
            res.send(response);
        }


    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
// Version 2
app.get('/v2/livegame', async function (req, res) {
    try {
    /*    Logging.writeLog('/v2/livegame', `Execute livegame with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);*/

        // Valider les paramètres
        var fpath = path.join(__dirname + '/config/client.json')
        var validation = await staticFunction.validateSummonerAndRegion(req.query, fpath);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
        //    Logging.writeLog('/v2/livegame', ``, 'validateSummonerAndRegion', false);
            return;
        }
     //   Logging.writeLog('/v2/livegame', ``, 'validateSummonerAndRegion', false);

        // Obtenir les informations sur l'invocateur
  //      Logging.writeLog('/v2/livegame', `Before init LeagueActiveGame`, 'LeagueActiveGame', true);

        var activeGame = new LeagueActiveGame(req.query);
        var result = await activeGame.getLiveGame();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }

   //     Logging.writeLog('/v2/livegame', ``, 'LeagueActiveGame', false);

    //    Logging.writeLog('/v2/livegame', `Before getReturnValue`, 'getActionGameDetails', true);
        var response = activeGame.getActionGameDetails();
     //   Logging.writeLog('/v2/livegame', ``, 'getActionGameDetails', false);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
// Top stats masteries
app.get('/v2/topMasteries', async function (req, res) {
    try {
   /*     Logging.writeLog('/v2/topMasteries', `Execute GetTopMasteries with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);*/

        // Valider les paramètres
        var fpath = path.join(__dirname + '/config/client.json')
        var validation = staticFunction.validateSummonerAndRegion(req.query, fpath);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
    //       Logging.writeLog('/v2/topMasteries', ``, 'validateSummonerAndRegion', false);
            return;
        }
 //       Logging.writeLog('/v2/topMasteries', ``, 'validateSummonerAndRegion', false);

        // Obtenir les informations sur l'invocateur
  //      Logging.writeLog('/v2/topMasteries', `Before init LeagueChampionMasteries`, 'LeagueChampionMasteries', true);
        var champMasteries = new LeagueChampionMasteries(req.query);
        var result = await champMasteries.getChampionsMasteries();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
   //     Logging.writeLog('/v2/topMasteries', ``, 'LeagueChampionMasteries', false);

  //      Logging.writeLog('/v2/topMasteries', `Before getReturnValue`, 'LeagueChampionMasteries', true);
        var response = champMasteries.getReturnValue(champMasteries.queueType);
    //    Logging.writeLog('/v2/topMasteries', ``, 'LeagueChampionMasteries', false);
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
        Logging.writeLog('/v2/currentChampion', `Execute GetCurrentChampion with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);

        // Valider les paramètres
        var fpath = path.join(__dirname + '/config/client.json');
        var validation = staticFunction.validateSummonerAndRegion(req.query, fpath);
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


/*
    CONFIG FILE
*/
app.get('/insertNewUser', async function (req, res) {
    try {
        const { headers, method, url, body, query } = req;
      
        Logging.writeLog('/insertNewUser', `Execute insertNewUser with data ${JSON.stringify(body)}`,
            'insertNewUser', true);    

        // Valider les paramètres
        var fpath = path.join(__dirname + '/data/client.json')
        var validation = staticFunction.validateSummonerAndRegion(body, fpath);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            Logging.writeLog('/insertNewUser', ``, 'insertNewUser', false);
            return;
        }

        // Obtenir les informations sur l'invocateur
        var locSummoner = new SummonerQueue(body);
        var result = await locSummoner.getLeagueSummoner();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            Logging.writeLog('/insertNewUser', ``, 'insertNewUser', false);
            return;
        }
        Logging.writeLog('/insertNewUser', ``, 'insertNewUser', false);

        await riotUserInfo.loadOrCreateFile();
        var insertResult = await riotUserInfo.addUser(locSummoner.userInfo, true);

        if (insertResult && locSummoner.userInfo) {
            res.send(`${locSummoner.userInfo.id} : L'usager '${locSummoner.userInfo.summonerName} (${locSummoner.userInfo.region})' a été ajouté avec succès.`);
        } else {
            res.send("Une erreur s'est produite.");
        }
        /*
        // Prepare Query
        var query = {};
        for (var key in req.query) {
            query[key.toLowerCase()] = req.query[key];
        }

        // Obtient le path du JSON
        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);

        // Charge le data
        var row;
        var data;
        await config.loadData().then(function (dta) {
            data = dta;
        });

        var info = {
            "summonername": query.summonername,
            "region": query.region,
            "twitch": query.twitchname,
            "userId": query.userid,
            "queue": (query.queue || "solo5")
        }

        // Ajouter l'usager
        await config.addNewClient(query.summonername, query.region, query.twitchname, query.queue, query.userid).then(function (usr) {
            console.log(`Ajouts d'un nouvel utilisateur : '${usr}'`);
            row = usr;
        });
        Logging.writeLog('/insertNewUser', ``, 'insertNewUser', false);

        if (row && typeof row.err !== "undefined") {
            res.send(row.err);

        } else if (row) {
            config.saveFile();
            res.send(`${row.userId} : L'usager '${query.summonername} (${query.region})' a été effectué avec succès.`)

        } else {
            res.send("Une erreur s'est produites.");
        }
        */

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
/*
app.get('/setSummoner', async function (req, res) {
    try {
        Logging.writeLog('/setSummoner', `Execute setSummoner with data ${JSON.stringify(req.query)}`,
            'setSummoner', true);

        var query = {}; // = req.query;
        // Prepare Query
        for (var key in req.query) {
            query[key.toLowerCase()] = req.query[key];
        }

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        await config.loadData().then(function (sumData) {
            config.replaceSummonerName(query.userid, query.summonername);
            console.log('Update Complete')
        });
        config.saveFile();

        Logging.writeLog('/setSummoner', ``, 'setSummoner', false);
        res.send(`${query.userId} : La mise-à-jour de l'usager '${query.summonername} (${query.region}) [${query.queue}]' a été effectué avec succès.`)

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/setRegion', async function (req, res) {
    try {
        Logging.writeLog('/setRegion', `Execute setRegion with data ${JSON.stringify(req.query)}`,
            'setRegion', true);
        var query = {}; // = req.query;
        // Prepare Query
        for (var key in req.query) {
            query[key.toLowerCase()] = req.query[key];
        }

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        await config.loadData().then(function (sumData) {
            config.replaceRegionName(query.userid, query.region);
        });
        config.saveFile();

        Logging.writeLog('/setRegion', ``, 'setRegion', false);
        res.send(`${query.userId} : La mise-à-jour de l'usager '${query.summonername} (${query.region}) [${query.queue}]' a été effectué avec succès.`)

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/setQueue', async function (req, res) {
    try {
        Logging.writeLog('/setQueue', `Execute setQueue with data ${JSON.stringify(req.query)}`,
            'setQueue', true);
        var query = {}; // = req.query;
        // Prepare Query
        for (var key in req.query) {
            query[key.toLowerCase()] = req.query[key];
        }

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        await config.loadData().then(function (sumData) {
            config.replaceRegionName(query.userid, query.queue);
        });
        config.saveFile();

        Logging.writeLog('/setQueue', ``, 'setQueue', false);
        res.send(`${query.userId} : La mise-à-jour de l'usager '${query.summonername} (${query.region}) [${query.queue}]' a été effectué avec succès.`)

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
app.get('/updateConfig', async function (req, res) {
    try {
        Logging.writeLog('/updateConfig', `Execute updateConfig with data ${JSON.stringify(req.query)}`,
            'updateConfig', true);

        var query = {}; // = req.query;
        // Prepare Query
        for (var key in req.query) {
            query[key.toLowerCase()] = req.query[key];
        }

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        await config.loadData().then(function (sumData) {
            config.updateSummonerInfo(query.userid, query.summonername, query.region, query.queue);
            console.log('Update Complete')
        });
        config.saveFile();

        Logging.writeLog('/updateConfig', ``, 'updateConfig', false);
        res.send(`${query.userId} : La mise-à-jour de l'usager '${query.summonername} (${query.region}) [${query.queue}]' a été effectué avec succès.`)

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
*/
app.get('/getAllConfig', async function (req, res) {
    try {
        Logging.writeLog('/getAllConfig', `Execute getAllConfig`, 'getAllConfig', true);

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        var data;
        await config.loadData().then(function (sumData) {
            data = sumData
        });

        Logging.writeLog('/getAllConfig', ``, 'getAllConfig', false);
        res.json(data);
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

/*
    Overwatch
    Parametre
        Platform
        bnetTag
        server      [us]
*/
app.get('/ow/rank', async function (req, res) {
    try {
        Logging.writeLog('/ow/rank', `Execute GetRank with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);

        // Valider les paramètres
        var validation = staticFunction.validateOverwatchParameters(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            Logging.writeLog('/ow/rank', ``, 'validateSummonerAndRegion', false);
            return;
        }
        Logging.writeLog('/ow/rank', ``, 'validateSummonerAndRegion', false);

        // Obtenir les informations sur l'invocateur
        Logging.writeLog('/ow/rank', `Before init getProfileStats`, 'getProfileStats', true);
        var profileStats = new OverwatchProfilStats(req.query, validation);
        var result = await profileStats.getProfileStats();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        Logging.writeLog('/ow/rank', ``, 'getProfileStats', false);


        Logging.writeLog('/ow/rank', `Before getReturnValue`, 'profileStatsReturn', true);
        var response = profileStats.getReturnValue();
        Logging.writeLog('/ow/rank', ``, 'profileStatsReturn', false);
        if (response.getJson) {
            res.json(response);
        } else {
            res.send(response);
        }

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
    // let url = `https://playoverwatch.com/fr-fr/career/pc/Bohe-11734#competitive`;
    // https://www.npmjs.com/package/jsdom
    /*
    const mainDOM = new JSDOM(``, {
        url: url,
        referrer: url,
        contentType: "text/html",
        includeNodeLocations: true,
        storageQuota: 10000000
      });
    const document = mainDOM.window.document;
    const bodyEl = document.body; // implicitly created
    const pEl = document.querySelector("div#masthead");
    const testMaster = bodyEl.getElementsByClassName("masthead");

        console.log(mainDOM.window);
    */

});

/* Démarrage du serveur */
app.listen(process.env.PORT || 3000, function () {
    var port = process.env.PORT || 3000;
    Logging = new Logging(process.env);

    //  clientInfo.configuration;

    console.log(`Démarrage du serveur le '${new Date().toString()}' sur le port ${port}`)
})

app.on('close', function () {
    console.log(`Serveur Close at '${new Date().toString()}'`);
})