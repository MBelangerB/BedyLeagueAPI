'use strict';

const express = require('express');
const router = express.Router();

const staticFunction = require('../../static/staticFunction');
const LeagueRotate = require('../../module/v2/LeagueRotate');

router.get('/v2/rotate', async function (req, res) {
    try {
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

        var response = legData.getReturnValue();
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

module.exports = router;