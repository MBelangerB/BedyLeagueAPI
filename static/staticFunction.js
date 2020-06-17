var jsonConfig = require('../class/jsonConfig');
var routeInfo = require('./info.json');

class staticFunction {
    /*
        League of Legend
    */
    static validateSummonerAndRegion(queryString, configPath) {
        var err = [];

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
            // queryString[key.toLowerCase()] = encodeURI(queryString[key]);    
        }

        // Pré-validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region, summonerName)");

        } else {

            if (typeof queryString.userId !== "undefined" && queryString.userId.trim().length !== 0) {
                var config = new jsonConfig(configPath);
                this.configDta = [];
                config.loadDataNoSync();
                this.configDta = config.data;


                // Si on passe un userID alors on doit obtenir les info par CLIENT.JSON
                var id = queryString.userId;
                var userInfo = this.configDta.configuration.find(e => e.userId === id.toString());


                var region = userInfo.region;
                var username = userInfo.summonerName;
                var queue = userInfo.queue;

                queryString.summonername = username;
                queryString.region = region;
                queryString.queueType = queue;

            } else {
                if (typeof queryString.summonername === "undefined" || queryString.summonername.trim().length === 0) {
                    err.push("Le paramètre 'summonerName' est obligatoire.");
                }
                if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                    err.push("Le paramètre 'region' est obligatoire.");
                }
            }

        }

        // https://developer.riotgames.com/getting-started.html
        //  Validating Calls (^[0-9\\p{L} _\\.]+$)
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Pour pseudo avec caractère accentué
        if (typeof queryString.summonername !== "undefined" && queryString.summonername.trim().length >= 0) {

            var arrUsernames = queryString.summonername.trim().split(";");
            arrUsernames.forEach(function myFunction(summonerName) {
                var re = new RegExp('^[0-9\u00C0-\u024F _.\\w]+$', 'giu');
                if (!re.test(summonerName)) {
                    err.push("Le paramètre 'summonerName' est invalide.");
                }
            });
        }

        // VALIDER SI LA REGION EST VALIDE
        if (!staticFunction.isValidRegion(queryString.region)) {
            err.push("La paramètre 'region' est invalide.");
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
    }
    static validateRegion(queryString) {
        var err = [];
        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region)");
        } else {
            if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                err.push("Le paramètre 'region' est obligatoire.");
            }
        }

        // VALIDER SI LA REGION EST VALIDE
        if (!staticFunction.isValidRegion(queryString.region)) {
            err.push("La paramètre 'region' est invalide.");
        }

        var result = {
            isValid: (err.length === 0),
            errors: err
        }

        return result;
    }
    static isValidRegion(region) {
        var valid = false;
        switch (region) {
            case 'NA1':
            case 'EUW1':
                valid = true;
                break;
            default:
                valid = false;
                break
        }
        return valid;
    }
    static isValidQueueType(type) {
        var valid = false;
        switch (type) {
            case 'solo5', 'solo', 'soloq':
                valid = true;
                break;
            case 'tft':
                valid = true;
                break;
            case 'flex5', 'flex':
                valid = true;
                break;
            case 'team5':
            case 'team3':
                valid = false;
                break
        }
        return valid;
    }

    /*
        Overwatch
    */
    static validateOverwatchParameters(queryString) {
        var err = [];

        // Cast parameters to Lower
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré-validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (platform, region, tag)");

        } else {
            let validPlatform = routeInfo.overwatch.platform;
            let validRegion = routeInfo.overwatch.region;

            if (typeof queryString.platform === "undefined" || queryString.platform.trim().length === 0) {
                err.push("Le paramètre 'platform' est obligatoire.");
            } else if (!validPlatform.includes(queryString.platform)) {
                err.push("La paramètre 'platform' est invalide.");
            } 

            if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                err.push("Le paramètre 'region' est obligatoire.");
            } else if (!validRegion.includes(queryString.region)) {
                err.push("La paramètre 'region' est invalide.");
            }
            
            if (typeof queryString.tag === "undefined" || queryString.tag.trim().length === 0) {
                err.push("Le paramètre 'tag' est obligatoire.");
            }
        }

        let baseUrl = routeInfo.overwatch.routes.profile;
        baseUrl = baseUrl.replace("{platform}", queryString.platform)
        baseUrl = baseUrl.replace("{region}", queryString.region)
        baseUrl = baseUrl.replace("{profileName}", queryString.tag)

        var result = {
            isValid: (err.length === 0),
            errors: err,
            url: baseUrl
        }

        return result;
    }
}

module.exports = staticFunction;