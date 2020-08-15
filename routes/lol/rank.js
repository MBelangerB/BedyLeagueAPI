'use strict';

const express = require('express');
const router = express.Router();

const staticFunction = require('../../static/staticFunction');
const SummonerQueue = require('../../module/v2/SummonerQueue');

const morgan = require('morgan');
const moment = require("moment");

// Logger
router.use(morgan(function (tokens, req, res) {
    if (res.statusCode === 302) { return null; }

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




router.get('/v2/rank', async function (req, res) {
    try {
        const { query } = req;

        var validation = await staticFunction.validateSummonerAndRegion(query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            return;
        }

        // Obtenir les informations sur l'invocateur
        var locSummoner = new SummonerQueue(query);
        var result = await locSummoner.getSummonerInfo();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        var response = locSummoner.getReturnValue(locSummoner.queueType);

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

module.exports = router;