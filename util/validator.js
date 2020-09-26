'use strict';

var routeInfo = require('../static/info.json');

var validator = validator || {};


validator.ow = {
    errors: [],

    validateQueryString: function (queryString) {
        this.errors = [];

        if (this.requireArguments(queryString)) {
            this.validatePlatform(queryString.platform);
            this.validateRegion(queryString.region);
            this.validateTag(queryString.tag);
        }
        return this.errors;
    },
    validateParams: function (params) {
        this.errors = [];

        if (this.requireArguments(params)) {
            this.validatePlatform(params.platform);
            this.validateRegion(params.region);
            this.validateTag(params.tag);
        }
        return this.errors;
    },
    fixOptionalParams: function (optionalParams, queryParameters) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters.json || 0);
        if (optionalParams && optionalParams.json && (optionalParams.json === "1" || optionalParams.json === 1)) {
            queryParameters.json = 1;
        } else {
            queryParameters.showlevel = 0;
            if (optionalParams && optionalParams.showlevel && (optionalParams.showlevel === "1" || optionalParams.showlevel === 1)) {
                queryParameters.showlevel = 1;
            }
            queryParameters.fullstring = 0;
            if (optionalParams && optionalParams.fullstring && (optionalParams.fullstring === "1" || optionalParams.fullstring === 1)) {
                queryParameters.fullstring = 1;
            }
        }
    },

    requireArguments: function (queryString) {
        if (Object.keys(queryString).length === 0) {
            this.errors.push("Paramètres marquant (region, platform, tag) / missing parameters (region, platform, tag)");
            return false;
        }
        return true;
    },

    validatePlatform: function (platform, isParam = false) {
        // Obtenir les plateforms disponibles
        let validPlatform = routeInfo.overwatch.platform;

        // Valider la présence de la plateforme en parametre
        if (typeof platform === "undefined" || platform.trim().length === 0) {
            this.errors.push("Le paramètre 'platform' est obligatoire.");
        } else if (!validPlatform.includes(platform)) {
            this.errors.push("La paramètre 'platform' est invalide.");
        }
    },

    validateRegion: function (region, isParam = false) {
        // Obtenir les region disponibles
        let validRegion = routeInfo.overwatch.region;

        // Valider la présence de la region en parametre
        if (typeof region === "undefined" || region.trim().length === 0) {
            this.errors.push("Le paramètre 'region' est obligatoire.");
        } else if (!validRegion.includes(region)) {
            this.errors.push("La paramètre 'region' est invalide.");
        }
    },

    validateTag: function (tag, isParam = false) {
        if (typeof tag === "undefined" || tag.trim().length === 0) {
            this.errors.push("Le paramètre 'tag' est obligatoire.");
        }
    }
}

validator.lol = {
    errors: [],

    METHOD_ENUM: { ROTATE: 0, SUMMONER_INFO: 2, RANK: 3, MASTERIES: 4, LIVEGAME: 5 },

    validateParams: function (params, method) {
        this.errors = [];

        switch (method) {
            case this.METHOD_ENUM.ROTATE:
                if (this.requireArguments(params)) {
                    this.validateRegion(params.region);
                }
                break;

            case this.METHOD_ENUM.MASTERIES:
            case this.METHOD_ENUM.SUMMONER_INFO:

                if (this.requireArguments(params)) {
                    this.validateRegion(params.region);
                    this.validateSummonerName((params.summonerName || params.summonername));
                }
                break;

            default:
                // Ne rien faire
                break;
        }

        return this.errors;
    },
    /**
     * Validation des paramètre pour la call Rotate
     * @param {*} params 
     */
    validateRotateParams: function (params) {
        this.errors = [];
        this.validateRegion(params.region);
        return this.errors;
    },


    fixOptionalParams: function (optionalParams, queryParameters, method) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters.json || 0);
        if (optionalParams && optionalParams.json && (optionalParams.json === "1" || optionalParams.json === 1)) {
            queryParameters.json = 1;
        } else {
            switch (method) {
                case this.METHOD_ENUM.MASTERIES:
                    queryParameters.nb = 5;
                    if (optionalParams && optionalParams.nb && optionalParams.nb > 0) {
                        queryParameters.nb = optionalParams.nb;
                    }
                    break;

                case this.METHOD_ENUM.SUMMONER_INFO:
                    // Aucun paramètre facultatif
                    break;

                default:
                    queryParameters.lp = 0;
                    if (optionalParams && optionalParams.lp && (optionalParams.lp === "1" || optionalParams.lp === 1)) {
                        queryParameters.lp = 1;
                    }
                    queryParameters.winrate = 0;
                    if (optionalParams && optionalParams.winrate && (optionalParams.winrate === "1" || optionalParams.winrate === 1)) {
                        queryParameters.winrate = 1;
                    }
                    queryParameters.queuetype = 0;
                    if (optionalParams && optionalParams.queuetype && (optionalParams.queuetype === "1" || optionalParams.queuetype === 1)) {
                        queryParameters.queuetype = 1;
                    }
                    // series
                    queryParameters.fullstring = 0;
                    if (optionalParams && optionalParams.fullstring && (optionalParams.fullstring === "1" || optionalParams.fullstring === 1)) {
                        queryParameters.fullstring = 1;
                    }
                    break;
            }


        }
    },

    requireArguments: function (queryString) {
        if (Object.keys(queryString).length === 0) {
            this.errors.push("Paramètres marquant (region, summonerName) / missing parameters (region, summonerName)");
            return false;
        }
        return true;
    },

    validateSummonerName: function (summonerName) {
        // Obtenir les region disponibles
        // let validRegion = routeInfo.lol.region;

        // Valider la présence de la region en parametre
        if (typeof summonerName === "undefined" || summonerName.trim().length === 0) {
            this.errors.push("Le paramètre 'summonerName' est obligatoire.");

        } else if (!this.isValidSummonerName(summonerName)) {
            this.errors.push("La paramètre 'summonerName' est invalide.");
        }
    },
    isValidSummonerName: function (summonerName) {
        // https://developer.riotgames.com/getting-started.html
        //  Validating Calls (^[0-9\\p{L} _\\.]+$)
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Pour pseudo avec caractère accentué
        var valid = false;
        if (typeof summonerName !== "undefined" && summonerName.trim().length >= 0) {

            var arrUsernames = summonerName.trim().split(";");
            arrUsernames.forEach(function myFunction(summonerName) {
                var re = new RegExp('^[0-9\u00C0-\u024F _.\\w]+$', 'giu');
                if (re.test(summonerName)) {
                    valid = true;
                }
            });
        }
        return valid;
    },

    validateRegion: function (region) {
        // Obtenir les region disponibles
        let validRegion = routeInfo.lol.region;

        // Valider la présence de la region en parametre
        if (typeof region === "undefined" || region.trim().length === 0) {
            this.errors.push("Le paramètre 'region' est obligatoire.");

        } else if (!this.isValidRegion(region)) {
            this.errors.push("La paramètre 'region' est invalide.");
        }
    },
    isValidRegion: function (region) {
        var valid = false;
        switch (region.toUpperCase()) {
            case 'NA':
            case 'NA1':
            case 'EUW':
            case 'EUW1':
                valid = true;
                break;
            default:
                valid = false;
                break
        }
        return valid;
    }
}

validator.parameters = {
    /**
     * Validate la culture pour la localization
     * @param {string} params 
     */
    validateCulture: function (params) {
        let culture = params.lang;

        // Obtenir les region disponibles
        let validCulture = routeInfo.api.culture;
        if (typeof culture === "undefined" || culture.trim().length === 0) {
            params.lang = "fr";
        } else if (!validCulture.includes(culture)) {
            this.errors.push("La paramètre 'culture' est invalide.");
        }
    }
}


module.exports = validator;