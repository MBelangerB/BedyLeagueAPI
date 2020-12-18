'use strict';

const express = require('express');
const router = express.Router();

const jsonConfig = require('../../class/jsonConfig');
const riotUserInfo = require('../../webModule/riotUserInfo')
const staticFunction = require('../../static/staticFunction');
const SummonerQueue = require('../../module/v2/SummonerQueue');


/*
    CONFIG FILE

    TODO: A refaire avec nouveau système voir riotUserInfo
*/
router.get('/insertNewUser', async function (req, res) {
    try {
        const { headers, method, url, body, query } = req;

        // Valider les paramètres
        var validation = staticFunction.validateSummonerAndRegion(body);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            return;
        }

        // Obtenir les informations sur l'invocateur
        var locSummoner = new SummonerQueue(body);
        var result = await locSummoner.getLeagueSummoner();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }

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
router.get('/setSummoner', async function (req, res) {
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
router.get('/setRegion', async function (req, res) {
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
router.get('/setQueue', async function (req, res) {
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
router.get('/updateConfig', async function (req, res) {
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
router.get('/getAllConfig', async function (req, res) {
    try {

        var fpath = path.join(__dirname + '/config/client.json')
        var config = new jsonConfig(fpath);
        var data;
        await config.loadData().then(function (sumData) {
            data = sumData
        });

        res.json(data);
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});



module.exports = router;