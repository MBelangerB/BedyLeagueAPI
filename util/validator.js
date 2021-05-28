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

    METHOD_ENUM: { ROTATE: 0, SUMMONER_INFO: 2, RANK: 3, MASTERIES: 4, LIVEGAME: 5, OVERLAY: 6 },
    OVERLAY_MODE_ENUM: { MINIMALIST: 1, FULL: 2},

    validateParams: function (params, method) {
        this.errors = [];

        switch (method) {
            case this.METHOD_ENUM.ROTATE:
                if (this.requireArguments(params)) {
                    this.validateRegion(params.region);

                    this.convertToRealRegion(params);
                }
                break;

            case this.METHOD_ENUM.MASTERIES:
            case this.METHOD_ENUM.SUMMONER_INFO:
                if (this.requireArguments(params)) {
                    this.validateRegion(params.region);
                    this.validateSummonerName((params.summonerName || params.summonername));

                    this.convertToRealRegion(params);
                }
                break;

            case this.METHOD_ENUM.RANK:
            case this.METHOD_ENUM.OVERLAY:
                if (this.requireArguments(params)) {
                    this.validateRegion(params.region);
                    this.validateSummonerName((params.summonerName || params.summonername));
                    this.validateQueueType(params.queuetype);

                    this.convertToRealRegion(params);
                    this.convertToRealQueueType(params);
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
     * TODO: A remove
     * @param {*} params 
     */
    validateRotateParams: function (params) {
        this.errors = [];
        this.validateRegion(params.region);
        this.convertToRealRegion(params);
        return this.errors;
    },



    fixOptionalParams: function (optionalParams, queryParameters, method) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters.json || 0);
        if (optionalParams && optionalParams.json && (optionalParams.json === "1" || optionalParams.json === 1)) {
            queryParameters.json = 1;

            queryParameters.series = '✓X-';
            if (optionalParams && optionalParams.series) {
                queryParameters.series = optionalParams.series;
            }
            
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

                case this.METHOD_ENUM.RANK:
                case this.METHOD_ENUM.OVERLAY:
                    queryParameters.lp = 1;
                    if (optionalParams && optionalParams.lp && (optionalParams.lp === "0" || optionalParams.lp === 0)) {
                        queryParameters.lp = 0;
                    }
                    queryParameters.type = 1;
                    if (optionalParams && optionalParams.type && (optionalParams.type === "0" || optionalParams.type === 0)) {
                        queryParameters.type = 0;
                    }
                    queryParameters.winrate = 1;
                    if (optionalParams && optionalParams.winrate && (optionalParams.winrate === "0" || optionalParams.winrate === 0)) {
                        queryParameters.winrate = 0;
                    }
                    queryParameters.all = 0;
                    if (optionalParams && optionalParams.all && (optionalParams.all === "1" || optionalParams.all === 1)) {
                        queryParameters.all = 1;
                    }
                    queryParameters.queuetype = 'solo5';
                    if (optionalParams && optionalParams.queuetype && this.isValidQueueType(optionalParams.queuetype)) {
                        queryParameters.queuetype = optionalParams.queuetype;
                    }
                    queryParameters.fq = 1;
                    if (optionalParams && optionalParams.fq && (optionalParams.fq === "0" || optionalParams.fq === 0)) {
                        queryParameters.fq = 0;
                    }
                    // series
                    queryParameters.series = '✓X-';
                    if (optionalParams && optionalParams.series) {
                        queryParameters.series = optionalParams.series;
                    }
                    queryParameters.fullstring = 0;
                    if (optionalParams && optionalParams.fullstring && (optionalParams.fullstring === "1" || optionalParams.fullstring === 1)) {
                        queryParameters.fullstring = 1;
                    }

                    // If Overlay = mode
                    if (method === this.METHOD_ENUM.OVERLAY) {
                        queryParameters.mode = 1;
                        if (optionalParams && optionalParams.mode && Number.isInteger(parseInt(optionalParams.mode))) {
                            queryParameters.mode = optionalParams.mode;
                        }
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
            case 'EUN1':
            case 'EUNE':
                valid = true;
                break;
            default:
                valid = false;
                break
        }
        return valid;
    },
    convertToRealRegion: function(params) {
        var region = params.region;
        var regionData =  {
            'EUW': 'EUW1',
            'EUW1': 'EUW1',
            'NA': 'NA1',
            'NA1': 'NA1',
            'EUNE': 'EUN1',
            'EUN1': 'EUN1'
        };
        params.region = regionData[region];
        return regionData[region];
    },

    validateQueueType: function (queueType) {
        // Valider la présence de la region en parametre
        if (typeof queueType !== "undefined" && queueType.trim().length > 0 && !this.isValidQueueType(queueType)) {
            this.errors.push("La paramètre 'queueType' est invalide.");
        }
    },
    isValidQueueType(queueType) {
        var valid = false;
        switch (queueType.toLowerCase()) {
            case 'solo5':
            case 'solo':
            case 'soloq':
                valid = true;
                break;
            case 'tft':
                valid = true;
                break;
            case 'flex5':
            case 'flex':
                valid = true;
                break;
            case 'team5':
            case 'team3':
                valid = false;
                break
        }
        return valid;
    },
    convertToRealQueueType: function(params) {
        var queueTypeInfo = params.queuetype;
        var typeData =  {
            'tft': 'tft',
            'solo5': 'solo5',
            'solo': 'solo5',
            'soloq': 'solo5'
        };

        if (typeof queueTypeInfo !== "undefined" && queueTypeInfo.trim().length > 0) {
            queueTypeInfo = queueTypeInfo.toLowerCase();
        } else {
            queueTypeInfo = "solo5";
        }
     
        params.queuetype = typeData[queueTypeInfo];
        return typeData[queueTypeInfo];
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

validator.api = {
    errors: [],

    validateRegister: function (queryString) {
        this.errors = [];

        if (this.requireArguments(queryString)) {
            this.validateRequire(queryString.token || queryString.t);
            this.validateUsername((queryString.username || queryString.u));
        }
        return this.errors;
    }, 

    validateAddSong: function (queryString) {
        this.errors = [];

        if (this.requireArguments(queryString)) {
            this.validateRequire(queryString.token || queryString.t);
        }
        return this.errors;
    }, 

    requireArguments: function (queryString) {
        if (Object.keys(queryString).length === 0) {
            this.errors.push("Paramètres marquant (username, token) / missing parameters (username, token)");
            return false;
        }
        return true;
    },
    validateRequire: function(token) {
        if (typeof token === "undefined" || token.trim().length === 0) {
            this.errors.push("Le paramètre 'token' est obligatoire.");
        }
    },
    validateUsername: function (username) {
        // Valider la présence de la region en parametre
        if (typeof username === "undefined" || username.trim().length === 0) {
            this.errors.push("Le paramètre 'username' est obligatoire.");

        }
    },


}

module.exports = validator;