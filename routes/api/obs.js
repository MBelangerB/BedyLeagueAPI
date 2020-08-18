'use strict';

const express = require('express');
const morgan = require('morgan');
const moment = require("moment");
const handlebars = require("handlebars");
const path = require('path');
const fs = require('fs');

const router = express.Router();

const staticFunction = require('../../static/staticFunction');
const SummonerQueue = require('../../module/v2/SummonerQueue');
// const { json } = require('express');
// const { dirname } = require('path');

// Logger
router.use(morgan(function (tokens, req, res) {
    //   if (res.statusCode === 302) { return null; }
    let autorized = ['/obs/rank'];
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
}));

/*
    SummonerName    : Nom de l'invocateur
    Region          : EUW, NA               
    queueType       : Flex, Solo  (mix possible. par défaut Solo)
    series          : ✓X-

    queue           : 0,1 (Afficher/Masquer le type de queue)
    LP              : 0,1 (Afficher/Masquer les LP)
    WinRate         : 0,1 (Afficher/Masquer les winrate)
    icon            : 0,1 (Afficher/Masquer l'icone du rang)
    showSerie       : 0,1 (Afficher/Masquer les series)
*/

router.get('/obs/rank', async function (req, res) {
    try {
        const { query, protocol } = req;
        query.json = true;

        if (query && typeof query.passwd === "undefined" || query.passwd !== 't0t0S@b') {
            res.status(404).send(`Désoler, ceci n'est pas disponible`);
            return;
        }

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
        var jsonData = response;

        try {
            var fullUrl = `${protocol}://${req.get('host')}`;
            //``req.protocol + '://' + req.get('host') + req.originalUrl;

            var result = jsonData.queue.find(f => f.QueueType === locSummoner.queueType);
            var imgName;
            // var folder = path.join(__dirname, '../..', '/static/images/ranked-emblems');
            var folder = `${fullUrl}/static/images/ranked-emblems`; // path.join(fullUrl, '/static/images/ranked-emblems');
            switch (result.tiers.toUpperCase()) {
                case 'IRON':
                    imgName = `/Emblem_Iron.png`
                    break;

                case 'BRONZE':
                    imgName = `/Emblem_Bronze.png`
                    break;

                case 'SILVER':
                    imgName = `/Emblem_Silver.png`
                    break;

                case 'GOLD':
                    imgName = `/Emblem_Gold.png`
                    break;

                case 'PLATINUM':
                    imgName = `/Emblem_Platinum.png`
                    break;

                case 'DIAMOND':
                    imgName = `/Emblem_Diamond.png`
                    break;

                case 'MASTER':
                    imgName = `/Emblem_Master.png`
                    break;

                case 'GRANDMASTER':
                    imgName = `/Emblem_GrandMaster.png`
                    break;

                case 'CHALLENGER':
                    imgName = `/Emblem_Challenger.png`
                    break;
            }

            var queue = "SoloQ";
            switch (result.QueueType.toUpperCase()) {
                case 'SOLO5':
                    queue = "SoloQ";
                    break;
                case 'FLEX':
                    queue = "Flex";
                    break;
                case 'TFT':
                    queue = "TFT";
                    break;
            }

            if (result) {
                var templateData = {
                    summonerName: locSummoner.summonerName,
                    queueType: queue,
                    rank: `${result.tiers} ${result.rank}`,
                    lp: `${result.LP}`,
                    stats: result.stats,
                    option: {
                        showLp: locSummoner.showLp,
                        showWR: locSummoner.showWinRate
                    },
                    image: {
                        src: `${folder}/${imgName}`,
                        alt: `${result.tiers} ${result.rank}`
                    },
                    colorRank: result.tiers.toLowerCase()
                }

                var templateFilePath = path.join(__dirname, '../..', '/web/template/obs.hbs');
                var templ = fs.readFileSync(templateFilePath, 'utf8');
                var aTemplate = TemplateAPI.getTemplate(templ, templateData);

                res.send(aTemplate);
            } else {
                res.json(jsonData);
            }

        } catch (ex) {
            console.error(ex);
        }

    } catch (ex) {
        console.error(ex);
    }
});

var TemplateAPI = {

    getTemplate: function (html, data) {
        var template = handlebars.compile(html, { strict: true });
        var result = template(data);
        return result;
    }
};


module.exports = router;
