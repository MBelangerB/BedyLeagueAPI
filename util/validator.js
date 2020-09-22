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

    validateParams: function (params) {
        this.errors = [];

        if (this.requireArguments(params)) {
            this.validateRegion(params.region);
        }
        return this.errors;
    },
    validateRotateParams: function (params) {
        this.errors = [];
        this.validateRegion(params.region);
        return this.errors;
    },


    fixOptionalParams: function (optionalParams, queryParameters) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters.json || 0);
        if (optionalParams && optionalParams.json && (optionalParams.json === "1" || optionalParams.json === 1)) {
            queryParameters.json = 1;
        } else {
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
        }
    },

    requireArguments: function (queryString) {
        var greeting = i18n.__('Hello')
        if (Object.keys(queryString).length === 0) {
            this.errors.push("Paramètres marquant (region, summonerName) / missing parameters (region, summonerName)");
            return false;
        }
        return true;
    },

    validateRegion: function (region) {
        // Obtenir les region disponibles
        let validRegion = routeInfo.lol.region;

        // Valider la présence de la region en parametre
        if (typeof region === "undefined" || region.trim().length === 0) {
            this.errors.push("Le paramètre 'region' est obligatoire.");
        } else if (!this.isValidRegion(region)) // {
            this.errors.push("La paramètre 'region' est invalide.");
        // } else if (!validRegion.includes(region)) {
        //     this.errors.push("La paramètre 'region' est invalide.");
        // }
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