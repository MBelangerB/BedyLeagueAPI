'use strict';

const express = require('express');
const router = express.Router();

const OverwatchProfilStats = require('../../module/ow/OverwatchProfilStats');
const staticFunction = require('../../static/staticFunction');

/*
 Mon API : region=us&tag=Bohe-11734&platform=pc
*/
router.get('/ow/rank', async function (req, res) {
    try {
        // Valider les paramètres
        var validation = staticFunction.validateOverwatchParameters(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            return;
        }

        // Obtenir les informations sur l'invocateur
        var profileStats = new OverwatchProfilStats(req.query, validation);
        var result = await profileStats.getProfileStats();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }


        var response = profileStats.getReturnValue();
        if (response.getJson && response.getJson == true) {
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
});

module.exports = router;