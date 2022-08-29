var express = require('express');
var router = express.Router();
var dragonUpdate = require('../module/dragonUpdate')

/* GET - UPDATE Dragon Data. */
router.get('/', async function (req, res, next) {
    res.redirect('/dragon/version');
});
 
router.get('/version', async function (req, res, next) {
    try {
        var ds = new dragonUpdate();
        var strArray = [];
        await ds.initFolder().then(async isSuccess => {
            return await ds.loadAPIConfigFile();
        }).then(async loading => {
            if (loading && loading.dragonVersion) {
                strArray.push(`Version actuel : ${JSON.stringify(loading)}`);
            }
        }).catch(error => {
            console.log(`A error occured during GetDragonVersion`);
        });
        res.send(`Dragon version : ${ds.currentVersion}`);
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

router.get('/update', async function (req, res, next) {
    try {
        var ds = new dragonUpdate();
        var strArray = [];
        var complete = false;
 
        await ds.initFolder().then(async isSuccess => {
            return await ds.loadAPIConfigFile();

        }).then(async loading => {
            if (loading && loading.dragonVersion) {
                strArray.push(`Version actuel : ${JSON.stringify(loading)}`);
            }
            return await ds.downloadVersionFile();

        }).then(async updateVersion => {
            if (updateVersion) {
                strArray.push(`Mise-à-jour de la version : ${updateVersion}`);
                return await ds.downloadFileData('fr_FR');
            } else {
                strArray.push(`Les fichiers dragons sont à jour. : ${updateVersion}`);
            }

        }).then(async finalResultFR => {
            if (finalResultFR) {
                strArray.push(`Download State (FR): ${finalResultFR}`);
                return await ds.downloadFileData('en_US');
            }

        }).then(async finalResultUS => {
            if (finalResultUS) {
                strArray.push(`Download State (US): ${finalResultUS}`);
                return await ds.downloadStaticData();
            }

        }).then(async finalResultStatic => {
            if (finalResultStatic) {
                strArray.push(`Download Static : ${finalResultStatic}`);
            }
            complete = true;

        }).catch(error => {
            console.log(`A error occured during Update Dragon`);
            complete = false;
        });
        console.log(strArray.join(" - "));

        if (complete) {
            res.send('La mise-à-jour des fichiers est terminée.');
        } else {
            res.send(`Une erreur s'est produite. Veuillez essayer à nouveau.`);
        }

    } catch (ex) {
        console.error('A error occured : ', ex);
        res.send(ex);
    }
});

module.exports = router;
