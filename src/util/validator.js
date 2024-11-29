'use strict';

const routeInfo = require('../static/info.json');

const validator = {};

// Obosolet after OW2
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

    regionData: {
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
    },

    queueTypeData: {
        'tft': 'tft',
        'solo5': 'solo5',
        'solo': 'solo5',
        'soloq': 'solo5',
        'flex': 'flex',
        'flexq': 'flex',
    },

    METHOD_ENUM: { ROTATE: 0, SUMMONER_INFO: 2, RANK: 3, MASTERIES: 4, LIVEGAME: 5, OVERLAY: 6 },
    OVERLAY_MODE_ENUM: { MINIMALIST: 1, FULL: 2 },

    validateParams: function (params, method) {
        this.errors = [];

        // Step 1 : Validate if we have any arguments
        if (!this.requireArguments(params)) {
            return this.errors;
        }

        // Step 2 : Validate if region is specified
        if (!this.requireRegion(params)) {
            return this.errors;
        } else {
            // if region is specified we convert it
            this.convertToRealRegion(params);
        }

        // Now we check specific validation if
        switch (method) {
            case this.METHOD_ENUM.ROTATE:
                // No custom validator
                break;

            case this.METHOD_ENUM.MASTERIES:
            case this.METHOD_ENUM.SUMMONER_INFO:
                this.validateSummonerName(params);
                break;

            case this.METHOD_ENUM.RANK:
            case this.METHOD_ENUM.OVERLAY:
                this.validateSummonerName(params);
                if (this.requireQueueType(params)) {
                    this.convertToRealQueueType(params);
                }

                break;

            default:
                // Ne rien faire
                break;
        }

        return this.errors;
    },

    /*
        json :
            Default: False 
            Response is return JSON object

        series : 
            Default: '✓X-' 
            Specifie les valeur a utilisé en BO.

        nb  : 
            Default: 5
            Method : Masteries
            
        lp  : 
            Default : True
            Method : Ranked
            Afficher le nombre de LP dans la chaine de retour

        type
            Default : True
            Method : Ranked
            Afficher le type de queue   

        winrate
            Default : True
            Method : Ranked
            Afficher le WinRate 

        all
            Default : False
            Method : Ranked
            Afficher les informations de toutes les Queues disponible  

        queuetype
            Default : True
            Method : Ranked
            Afficher le nom de la queue dans la réponse

        fq
            Default : False
            Method : Ranked

        series
            Default : '✓X-'
            Method : Ranked
            Symbole de remplacement pour Win/Lose/Not play

        fullstring
            Default : False
            Method : Ranked
            Afficher le nom de l'invocateur dans la réponse
    */

    /**
     * Add or fix optional parameters on the query string
     * @param {*} queryParameters 
     * @param {*} method 
     */
    fixOptionalParams: function (queryParameters, method) {
        // (json=X) -> Retour en JSON
        queryParameters.json = (queryParameters?.json == "1" ? 1 : 0);

        // If « IsJson» we fix series parameters is not exists
        queryParameters.series = (queryParameters?.series || '✓X-')

        // If not JSON return we fix params
        if (!queryParameters.json) {

            switch (method) {
                case this.METHOD_ENUM.MASTERIES:
                    queryParameters.nb = (queryParameters?.nb || 5);
                    break;

                case this.METHOD_ENUM.SUMMONER_INFO:
                    // Aucun paramètre facultatif
                    break;

                case this.METHOD_ENUM.RANK:
                case this.METHOD_ENUM.OVERLAY:
                    const defaultLp = 1;
                    const defaultShowType = 1;
                    const defaultShowWinRate = 1;
                    const defaultShowAllQueue = 0;
                    const defaultFQ = 1;
                    const defaultFullString = 0;

                    if (typeof queryParameters.lp === 'undefined' || queryParameters.lp.trim().length === 0) {
                        queryParameters.lp = defaultLp;
                    } else {
                        queryParameters.lp = parseInt(queryParameters.lp);
                    }

                    if (typeof queryParameters.type === 'undefined' || queryParameters.type.trim().length === 0) {
                        queryParameters.type = defaultShowType;
                    } else {
                        queryParameters.type = parseInt(queryParameters.type);
                    }

                    if (typeof queryParameters.winrate === 'undefined' || queryParameters.winrate.trim().length === 0) {
                        queryParameters.winrate = defaultShowWinRate;
                    } else {
                        queryParameters.winrate = parseInt(queryParameters.winrate);
                    }
                    
                    if (typeof queryParameters.all === 'undefined' || queryParameters.all.trim().length === 0) {
                        queryParameters.all = defaultShowAllQueue;
                    } else {
                        queryParameters.all = parseInt(queryParameters.all);
                    }
                    
                    if (typeof queryParameters.fq === 'undefined' || queryParameters.fq.trim().length === 0) {
                        queryParameters.fq = defaultFQ;
                    } else {
                        queryParameters.fq = parseInt(queryParameters.fq);
                    }
                    
                    if (typeof queryParameters.fullstring === 'undefined' || queryParameters.fullstring.trim().length === 0) {
                        queryParameters.fullstring = defaultFullString;
                    } else {
                        queryParameters.fullstring = parseInt(queryParameters.fullstring);
                    }
                    
                    // TO KEEP  
                    // If Overlay = mode
                    // if (method === this.METHOD_ENUM.OVERLAY) {
                    //     queryParameters.mode = 1;
                    //     if (optionalParams && optionalParams.mode && Number.isInteger(parseInt(optionalParams.mode))) {
                    //         queryParameters.mode = optionalParams.mode;
                    //     }
                    // }

                    break;
            }
        }
    },

    /**
     * Check if we have any arguments. Don't valide if is required arguments.
     * @param {Object} params 
     * @returns {boolean} False if missing
     */
    requireArguments: function (params) {
        if (Object.keys(params).length === 0) {
            this.errors.push('Paramètres marquant (region, summonerName) / missing parameters (region, summonerName)');
            return false;
        }
        return true;
    },

    /**
     * Check if "region" parameters is missing
     * @param {Object} params 
     * @returns {boolean} False if missing
     */
    requireRegion: function (params) {
        const region = params?.region;
        if (typeof region === 'undefined' || region.trim().length === 0) {
            this.errors.push('Le paramètre \'region\' est obligatoire.');
            return false;
        }
        return true;
    },

    /**
     * Check if "summonerName" parameters is missing
     * @param {Object} params 
     * @returns {boolean} False if missing
     */
    validateSummonerName: function (params) {
        const summonerName = (params.summonerName || params.summonername);
        if (typeof summonerName === 'undefined' || summonerName.trim().length === 0) {
            this.errors.push('Le paramètre \'summonerName\' est obligatoire.');
            return false;

        } else if (!this.isValidSummonerName(summonerName)) {
            this.errors.push('La paramètre \'summonerName\' est invalide.');
            return false;
        }

        return true;
    },
    /**
     * Valid summonerName pattern
     * @param {*} summonerName 
     * @returns {boolean} False if invalid
     */
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

    /**
     * Convert region to accepted RIOT API value
     * @param {*} params 
     * @returns {string} Valid region or null
     */
    convertToRealRegion: function (params) {
        const region = params?.region.toUpperCase();
        const realRegion = this.regionData[region];

        if (!this.isValidRegion(realRegion)) {
            this.errors.push('La paramètre \'region\' est invalide.');
            return null;
        } else {
            params.region = realRegion;
            return realRegion;
        }
    },

    /**
     * Check if specified region is availabled in Bedy API
     * @param {*} region 
     * @returns 
     */
    isValidRegion: function (region) {
        const availabledRegions = routeInfo.lol.region;
        return availabledRegions.includes(region);
    },

    //#region "Queue Type"

    /**
     * Check if "queueType" parameters is missing
     * @param {Object} params 
     * @returns {boolean} False if missing
     */
    requireQueueType: function (params) {
        const queueType = (params.queuetype || params.queueType);
        // Valider la présence de la region en parametre
        if (typeof queueType !== 'undefined' && queueType.trim().length > 0 && !this.isValidQueueType(queueType)) {
            this.errors.push('La paramètre \'queueType\' est invalide.');
            return false;
        }
        return true;
    },

    /**
     * Check if "queueType" parameters is accepted
     * @param {*} queueType 
     * @returns 
     */
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

    /**
     * Convert the queueType at RIOT queue type value
     * @param {*} params 
     * @returns 
     */
    convertToRealQueueType: function (params) {
        let queueTypeInfo = (params.queuetype || params.queueType);

        // Set SOLOQ on default value if not specified
        if (typeof queueTypeInfo !== 'undefined' && queueTypeInfo.trim().length > 0) {
            queueTypeInfo = queueTypeInfo.toLowerCase();
        } else {
            queueTypeInfo = 'solo5';
        }

        params.queuetype = this.queueTypeData[queueTypeInfo];
        return params.queuetype;
    },

    //#endregion
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

    concatParams: function (params, queryString) {
        return Object.assign({}, params, queryString);
    }
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
    validateRequire: function (token) {
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