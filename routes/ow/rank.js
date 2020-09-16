var express = require('express');
var router = express.Router();

var OverwatchProfileController = require('../../controller/OverwatchProfile');
require('../../util/validator');
var routeInfo = require('../../static/info.json');
const validator = require('../../util/validator');

/*
 Mon API : region=us&tag=Bohe-11734&platform=pc
    let url = `https://playoverwatch.com/fr-fr/career/pc/Bohe-11734#competitive`;
    https://www.npmjs.com/package/jsdom
*/
router.get('/rank', async function (req, res, next) {
    try {
        // Cast parameters to Lower
        let queryString = [];
        for (var key in req.query) {
            queryString[key.toLowerCase()] = req.query[key];
        }

        var result = validator.ow.completeValidation(queryString);
        if (result && result.length > 0) {
            res.send(result)
            return;
        }

        var profileStats = new OverwatchProfileController(req.query, generateUrl(queryString));
        await profileStats.getProfileStats().then(result => {
            if (result.code === 200) {
                var response = profileStats.getReturnValue();
                if (response.getJson && response.getJson == true) {
                    res.json(response);
                } else {
                    res.send(response);
                }
            }
            return;
        }).catch(error => {
            res.send(`${error.code} - ${error.err.statusMessage}`);
            return;
        });


    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

function generateUrl(queryString) {
    let baseUrl = routeInfo.overwatch.routes.profile;
    baseUrl = baseUrl.replace("{platform}", queryString.platform)
    baseUrl = baseUrl.replace("{region}", queryString.region)
    baseUrl = baseUrl.replace("{profileName}", queryString.tag)

    return baseUrl;
}

module.exports = router;
