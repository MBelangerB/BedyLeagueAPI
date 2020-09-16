'use strict';

const express = require('express');
const router = express.Router();

const staticFunction = require('../../static/staticFunction');
const LeagueRotate = require('../../module/v2/LeagueRotate');

const morgan = require('morgan');
const moment = require("moment");

// Logger
router.use(morgan(function (tokens, req, res) {
 //   if (res.statusCode === 302) { return null; }
    if (typeof req.route === "undefined" || req.route.path.toLowerCase().includes("/v2/rotate") === false) { 
        return null;
    }

    var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");

    return [
        `[${currentDateTime}] : `,
        `${req.protocol} - `, 
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), 'ms'
    ].join(' ');
}))

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