'use strict';

var routeInfo = require('../static/info.json');

var validator = validator || { };


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
    validateParams: function (queryString) {
        this.errors = [];
        
        if (this.requireArguments(queryString)) {
            this.validatePlatform(queryString.platform);
            this.validateRegion(queryString.region);
            this.validateTag(queryString.tag);
        }
        return this.errors;
    },

    requireArguments: function (queryString) {

        if (Object.keys(queryString).length === 0) {
            this.errors.push("Paramètres marquant / missing parameters (platform, region, tag)");
            return false;
        }
        return true;
    },

    validatePlatform: function (platform) {
        // Obtenir les plateforms disponibles
        let validPlatform = routeInfo.overwatch.platform;

        // Valider la présence de la plateforme en parametre
        if (typeof platform === "undefined" || platform.trim().length === 0) {
            this.errors.push("Le paramètre 'platform' est obligatoire.");
        } else if (!validPlatform.includes(platform)) {
            this.errors.push("La paramètre 'platform' est invalide.");
        }       
    },

    validateRegion: function (region) {
        // Obtenir les region disponibles
        let validRegion = routeInfo.overwatch.region;

        // Valider la présence de la region en parametre
        if (typeof region === "undefined" || region.trim().length === 0) {
            this.errors.push("Le paramètre 'region' est obligatoire.");
        } else if (!validRegion.includes(region)) {
            this.errors.push("La paramètre 'region' est invalide.");
        }    
    },

    validateTag: function (tag) {
        if (typeof tag === "undefined" || tag.trim().length === 0) {
            this.errors.push("Le paramètre 'tag' est obligatoire.");
        } 
    }
}

validator.parameters = {

    validateCulture: function(params) {
        if (!params.lang) {
            params.lang = "fr";
        }
    }
}
module.exports = validator;