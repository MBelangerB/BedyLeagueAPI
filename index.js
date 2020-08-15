/*
    Import Data
*/
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const url = require('url');
const moment = require("moment");
const morgan = require('morgan');

// Secure
const https = require('https');
const http = require('http');
const fs = require('fs');


/*    Initialize Modules   */
var app = express();
dotenv.config();

/*
    Custom Module V2
*/
var Logging = require('./module/logging');

/*
    Init custom class
*/
require('./static/Prototype.js');

/*
    Loading ROUTE
*/
app.use(require('./routes/api/config'));

app.use(require('./routes/ow/rank'));

app.use(require('./routes/lol/rank'));
app.use(require('./routes/lol/summoner'));
app.use(require('./routes/lol/league'));

/*
    Affectation APP
*/

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use('/web', express.static(__dirname + '/web'));

// Logger
app.use(morgan(function (tokens, req, res) {
    if (res.statusCode === 302) { return null; }

    var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");
    return [
        `[${currentDateTime}] : `,
        `${req.protocol} - `, 
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}));


// Default webpage
app.use(express.static(__dirname + "/web/"));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/web/index.html'));
});

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


/*
    Update DATA File
*/
const dragonUpdate = require('./controller/cronTask');

app.get('/updateDragon', async function (req, res) {
    try {
        var ds = new dragonUpdate();

        await ds.initFolder().then(async init => {
            console.log(`initFolder : ${init}`);
            await ds.loadAPIConfigFile().then(async loading => {
                console.log(`Loading REsult : ${loading}`);
                await ds.downloadVersionFile().then(async updateVersion => {
                    console.log(`update version : ${updateVersion}`);
                    if (updateVersion) {
                        await ds.downloadFileData().then(result => {
                            console.log(`Download State: ${result}`)
                        });
                    }

                });
            });
        });

        res.send('La mise-à-jour des fichiers est terminée.');
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});



if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
    /* Démarrage du serveur */
    http.createServer(app).listen(process.env.PORT || 3000, function () {
        var port = process.env.PORT || 3000;
        Logging = new Logging(process.env);

        console.log(`Démarrage du serveur HTTP le '${new Date().toString()}' sur le port ${port}`)
    });
} else {
    https.createServer({
        key: fs.readFileSync('ssl/server.key'),
        cert: fs.readFileSync('ssl/server.cert')
    }, app)
    .listen(process.env.PORT_HTTPS || 3000, function () {
        var port = process.env.PORT_HTTPS || 3000;
        if (!Logging) { Logging = new Logging(process.env); }

        console.log(`Démarrage du serveur HTTPS le '${new Date().toString()}' sur le port ${port}`)
    })
}

app.on('close', function () {
    console.log(`Serveur Close at '${new Date().toString()}'`);
})
