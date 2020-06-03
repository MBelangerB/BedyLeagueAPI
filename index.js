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
    Init custom class
*/
var jsonConfig = require('./class/jsonConfig');
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
        Logging.writeLog('/v2/rank', `Execute GetRank with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);

        // Valider les paramètres
        var fpath = path.join(__dirname + '/config/client.json')
        var validation = staticFunction.validateSummonerAndRegion(req.query, fpath);
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
        if (response.getJson) {
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
        Logging.writeLog('/v2/rotate', `Execute GetRotate`,
            'GetRotate', true);

        // Valider les paramètres
        var isValid = staticFunction.validateRegion(req.query);
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
        Logging.writeLog('/v2/livegame', `Execute livegame with data ${JSON.stringify(req.query)}`,
            'validateSummonerAndRegion', true);

        // Valider les paramètres
        var fpath = path.join(__dirname + '/config/client.json')
        var validation = staticFunction.validateSummonerAndRegion(req.query, fpath);
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
        var fpath = path.join(__dirname + '/config/client.json')
        var validation = staticFunction.validateSummonerAndRegion(req.query, fpath);
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
        Logging.writeLog('/insertNewUser', `Execute insertNewUser with data ${JSON.stringify(req.query)}`,
            'insertNewUser', true);

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
        await config.addNewClient(query.summonername, query.region, query.twitchname, query.queue, query.userid) .then(function (usr) {
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

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});


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