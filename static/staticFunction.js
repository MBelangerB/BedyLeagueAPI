
 class staticFunction {
    static validateSummonerAndRegion(queryString) {
        var err = [];

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }

        // Pré-validation
        if (Object.keys(queryString).length === 0) {
            err.push("Paramètres marquant / missing parameters (region, summonerName)");

        } else {
            if (typeof queryString.summonername === "undefined" || queryString.summonername.trim().length === 0) {
                err.push("Le paramètre 'summonerName' est obligatoire.");
            }
            if (typeof queryString.region === "undefined" || queryString.region.trim().length === 0) {
                err.push("Le paramètre 'region' est obligatoire.");
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
            case 'solo5':
                valid = true;
                break;
            case 'tft':
                valid = true;
                break;
            case 'team5':
            case 'team3':
            case 'flex5':
                valid = false;
                break
        }
        return valid;
    }

}

module.exports = staticFunction;