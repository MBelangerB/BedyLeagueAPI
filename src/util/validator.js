'use strict';

const routeInfo = require('../static/info.json');

const validator = {};

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
        if (optionalParams && optionalParams.json && (optionalParams.json === '1' || optionalParams.json === 1)) {
            queryParameters.json = 1;
        } else {
            queryParameters.showlevel = 0;
            if (optionalParams && optionalParams.showlevel && (optionalParams.showlevel === '1' || optionalParams.showlevel === 1)) {
                queryParameters.showlevel = 1;
            }
            queryParameters.fullstring = 0;
            if (optionalParams && optionalParams.fullstring && (optionalParams.fullstring === '1' || optionalParams.fullstring === 1)) {
                queryParameters.fullstring = 1;
            }
        }
    },

    requireArguments: function (queryString) {
        if (Object.keys(queryString).length === 0) {
            this.errors.push('Paramètres marquant (region, platform, tag) / missing parameters (region, platform, tag)');
            return false;
        }
        return true;
    },

    validatePlatform: function (platform) {
        // Obtenir les plateforms disponibles
        const validPlatform = routeInfo.overwatch.platform;

        // Valider la présence de la plateforme en parametre
        if (typeof platform === 'undefined' || platform.trim().length === 0) {
            this.errors.push('Le paramètre \'platform\' est obligatoire.');
        } else if (!validPlatform.includes(platform)) {
            this.errors.push('La paramètre \'platform\' est invalide.');
        }
    },

    validateRegion: function (region) {
        // Obtenir les region disponibles
        const validRegion = routeInfo.overwatch.region;

        // Valider la présence de la region en parametre
        if (typeof region === 'undefined' || region.trim().length === 0) {
            this.errors.push('Le paramètre \'region\' est obligatoire.');
        } else if (!validRegion.includes(region)) {
            this.errors.push('La paramètre \'region\' est invalide.');
        }
    },

    validateTag: function (tag) {
        if (typeof tag === 'undefined' || tag.trim().length === 0) {
            this.errors.push('Le paramètre \'tag\' est obligatoire.');
        }
    },
};

validator.lol = {
    errors: [],

    METHOD_ENUM: { ROTATE: 0, SUMMONER_INFO: 2, RANK: 3, MASTERIES: 4, LIVEGAME: 5, OVERLAY: 6 },
    OVERLAY_MODE_ENUM: { MINIMALIST: 1, FULL: 2 },

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
        this.validateRegion(params?.region);
        if (this.errors && this.errors.length > 0) {
            return this.errors;
        }
        params.region = this.convertToRealRegion(params);
        return this.errors;
    },


    fixOptionalParams: function (optionalParams, queryParameters, method) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters.json || 0);
        if (optionalParams && optionalParams.json && (optionalParams.json === '1' || optionalParams.json === 1)) {
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
                    if (optionalParams && optionalParams.lp && (optionalParams.lp === '0' || optionalParams.lp === 0)) {
                        queryParameters.lp = 0;
                    }
                    queryParameters.type = 1;
                    if (optionalParams && optionalParams.type && (optionalParams.type === '0' || optionalParams.type === 0)) {
                        queryParameters.type = 0;
                    }
                    queryParameters.winrate = 1;
                    if (optionalParams && optionalParams.winrate && (optionalParams.winrate === '0' || optionalParams.winrate === 0)) {
                        queryParameters.winrate = 0;
                    }
                    queryParameters.all = 0;
                    if (optionalParams && optionalParams.all && (optionalParams.all === '1' || optionalParams.all === 1)) {
                        queryParameters.all = 1;
                    }
                    queryParameters.queuetype = 'solo5';
                    if (optionalParams && optionalParams.queuetype && this.isValidQueueType(optionalParams.queuetype)) {
                        queryParameters.queuetype = optionalParams.queuetype;
                    }
                    queryParameters.fq = 1;
                    if (optionalParams && optionalParams.fq && (optionalParams.fq === '0' || optionalParams.fq === 0)) {
                        queryParameters.fq = 0;
                    }
                    // series
                    queryParameters.series = '✓X-';
                    if (optionalParams && optionalParams.series) {
                        queryParameters.series = optionalParams.series;
                    }
                    queryParameters.fullstring = 0;
                    if (optionalParams && optionalParams.fullstring && (optionalParams.fullstring === '1' || optionalParams.fullstring === 1)) {
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
            this.errors.push('Paramètres marquant (region, summonerName) / missing parameters (region, summonerName)');
            return false;
        }
        return true;
    },

    validateSummonerName: function (summonerName) {
        // Valider la présence de la region en parametre
        if (typeof summonerName === 'undefined' || summonerName.trim().length === 0) {
            this.errors.push('Le paramètre \'summonerName\' est obligatoire.');

        } else if (!this.isValidSummonerName(summonerName)) {
            this.errors.push('La paramètre \'summonerName\' est invalide.');
        }
    },
    isValidSummonerName: function (summonerName) {
        // https://developer.riotgames.com/getting-started.html
        //  Validating Calls (^[0-9\\p{L} _\\.]+$)
        // https://stackoverflow.com/questions/20690499/concrete-javascript-regex-for-accented-characters-diacritics
        // Pour pseudo avec caractère accentué
        //  βlue Łagoon
        let valid = false;
        if (typeof summonerName !== 'undefined' && summonerName.trim().length >= 0) {

            const arrUsernames = summonerName.trim().split(';');
            /* eslint-disable no-shadow */
            /* eslint-disable no-unused-vars */
            arrUsernames.forEach(function myFunction(summonerName) {
                // TODO: Size 3 a 16 Caractère
                // MBB 2021-08-31 : Désactivation temporaire de la validation
                /*
                var re = new RegExp('^[0-9\u00C0-\u024F _.αβŁ\\w]+$', 'giu');
                if (re.test(summonerName)) {
                    valid = true;
                }
                */
               valid = true;
            });
        }
        return valid;
    },

    validateRegion: function (region) {
        // Valider la présence de la region en parametre
        if (typeof region === 'undefined' || region.trim().length === 0) {
            this.errors.push('Le paramètre \'region\' est obligatoire.');
        }
    },
    isValidRegion: function (region) {
        let valid = false;
        const availabledRegions = routeInfo.lol.region;
        if (availabledRegions.includes(region)) {
            return true;
        } else {
            return false;
        }
    },
    convertToRealRegion: function(params) {
        const region = params?.region.toUpperCase();

        const regionData = {
            // BR1
            'BR': 'BR1',
            'BR1': 'BR1',
            // EUN1
            'EUN': 'EUN1',
            'EUN1': 'EUN1',
            'EUNE': 'EUN1',
            // EUW1
            'EUW': 'EUW1',
            'EUW1': 'EUW1',
            // JP1
            'JP': 'JP1',
            'JP1': 'JP1',
            // KR
            'KR': 'KR',
            // LA1
            'LA1': 'LA1',
            'LA2': 'LA2',
            // NA1
            'NA': 'NA1',
            'NA1': 'NA1',
            // OC1
            'OC': 'OC1',
            'OC1': 'OC1',
            // TR1
            'TR': 'TR1',
            'TR1': 'TR1',
            // RU
            'RU': 'RU',         
        };
        const realRegion = regionData[region];

        if (!this.isValidRegion(realRegion)) {
            this.errors.push('La paramètre \'region\' est invalide.');
            return null;
        } else {
            params.region = realRegion;
            return realRegion;
        }     
    },

    validateQueueType: function (queueType) {
        // Valider la présence de la region en parametre
        if (typeof queueType !== 'undefined' && queueType.trim().length > 0 && !this.isValidQueueType(queueType)) {
            this.errors.push('La paramètre \'queueType\' est invalide.');
        }
    },
    isValidQueueType(queueType) {
        let valid = false;
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
                break;
        }
        return valid;
    },
    convertToRealQueueType: function(params) {
        let queueTypeInfo = params.queuetype;
        const typeData = {
            'tft': 'tft',
            'solo5': 'solo5',
            'solo': 'solo5',
            'soloq': 'solo5',
            'flex': 'flex',
            'flexq': 'flex',
        };

        if (typeof queueTypeInfo !== 'undefined' && queueTypeInfo.trim().length > 0) {
            queueTypeInfo = queueTypeInfo.toLowerCase();
        } else {
            queueTypeInfo = 'solo5';
        }

        params.queuetype = typeData[queueTypeInfo];
        return typeData[queueTypeInfo];
    },
};

validator.parameters = {
    /**
     * Validate la culture pour la localization
     * @param {string} params
     */
    validateCulture: function (params) {
        const culture = params.lang;

        // Obtenir les region disponibles
        const validCulture = routeInfo.api.culture;
        if (typeof culture === 'undefined' || culture.trim().length === 0) {
            params.lang = 'fr';
        } else if (!validCulture.includes(culture)) {
            this.errors.push('La paramètre \'culture\' est invalide.');
        }
    },
};

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
            this.errors.push('Paramètres marquant (username, token) / missing parameters (username, token)');
            return false;
        }
        return true;
    },
    validateRequire: function(token) {
        if (typeof token === 'undefined' || token.trim().length === 0) {
            this.errors.push('Le paramètre \'token\' est obligatoire.');
        }
    },
    validateUsername: function (username) {
        // Valider la présence de la region en parametre
        if (typeof username === 'undefined' || username.trim().length === 0) {
            this.errors.push('Le paramètre \'username\' est obligatoire.');

        }
    },


};

module.exports = validator;