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

validator.parameters = {

    validateCulture: function (params) {
        if (!params.lang) {
            params.lang = "fr";
        }
    }
}
module.exports = validator;