'use strict';

const express = require('express');
const router = express.Router();

const OverwatchProfilStats = require('../../module/ow/OverwatchProfilStats');
const staticFunction = require('../../static/staticFunction');

const morgan = require('morgan');
const moment = require("moment");

// Logger
router.use(morgan(function (tokens, req, res) {
  //  if (res.statusCode === 302) { return null; }
  let autorized = ['/ow/rank'];
  if (typeof req.route === "undefined" || autorized.includes(req.route.path.toLowerCase()) === false) { 
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