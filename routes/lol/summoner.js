'use strict';

const express = require('express');
const router = express.Router();

const staticFunction = require('../../static/staticFunction');
const LeagueChampionMasteries = require('../../module/v2/LeagueChampionMasteries');
const LeagueActiveGame = require('../../module/v2/LeagueLiveGame');

// Version 2
router.get('/v2/livegame', async function (req, res) {
    try {
        // Valider les paramètres
        var validation = await staticFunction.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            return;
        }

        var activeGame = new LeagueActiveGame(req.query);
        var result = await activeGame.getLiveGame();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }

        var response = activeGame.getActionGameDetails();
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});
// Top stats masteries
router.get('/v2/topMasteries', async function (req, res) {
    try {
        // Valider les paramètres
        var validation = staticFunction.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.send(validation.errors)
            return;
        }
        // Obtenir les informations sur l'invocateur
        var champMasteries = new LeagueChampionMasteries(req.query);
        var result = await champMasteries.getChampionsMasteries();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.send(result.err.statusMessage);
            return;
        }
        var response = champMasteries.getReturnValue(champMasteries.queueType);
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

router.get('/v2/currentChampion', async function (req, res) {
    // Fonctionnalité en développement
    // Permet d'obtenir les informations du joueur avec le personnage actuel
    // Perso (Masteries Pts) - Sort invocateur - Win Rates ?
    try {
        // Valider les paramètres
        var validation = staticFunction.validateSummonerAndRegion(req.query);
        if (validation && validation.isValid === false) {
            res.json(validation.errors)
            return;
        }

        // Obtenir les informations sur l'invocateur
        var activeGame = new LeagueActiveGame(req.query);
        var result = await activeGame.getLiveGame();
        if (typeof result.code !== 'undefined' && (result.code === 201 || result.code !== 200)) {
            res.json(result.err.statusMessage);
            return;
        }

        var response = activeGame.getCurrentChampionData();
        res.send(response);

    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});



// Stats 10 dernières games
router.get('/v2/lastgame', async function (req, res) {

});



module.exports = router;