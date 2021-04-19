/*
    BedyAPI - Chrome Extension
*/
const validator = require('../../util/validator');
const staticFunc = require('../../util/staticFunction');
const extensionFileData = require('../../module/extensionFile');
const headerAccess = require('../../config/authorizedAPI.json');

/**
 * Permet a l'extension de s'enregistrer a API (POST)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.registerAPI = async function (req, res, next) {
    try {
        let { query, params } = req;

        // var access = headerAccess.authorized;
        // var authorized = false;
        //  access.forEach(key => {
        //     if (authorized) { return; }

        //     var result = req.rawHeaders.find(e => e.includes(key));
        //     if (result && result.length > 0) {
        //         authorized = true;
        //     }     
        // });
        // if (!authorized) {
        //     res.send(401);
        //     return;
        // }

        // Gestion des paramètres
        let queryParameters;
        let queryString = staticFunc.request.lowerQueryString(query);
        console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

        /*
            On effectue initialement la validation des Params (username/token).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        var validationErrors = [];
        if (params && Object.keys(params).length > 0) {
            validationErrors = validator.api.validateRegister(params);
            queryParameters = params;
        } else {
            validationErrors = validator.api.validateRegister(queryString);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }

        let extData = new extensionFileData(queryParameters.username, queryParameters.token);
        var resData = null;
        var isNew = true;
        await extData.loadUserPlaylist().then(async data => {
            if (!data) {
                return await extData.createExtensionFile(queryParameters.token);
            }
            isNew = false;
            return data;
        }).then(userData => {
            if (userData) {
                resData = userData;
            }
        }).catch(error => {
            console.log(`A error occured during Registration`);
            console.error(error);
            res.send(error);
            return;
        });
        // Pas de MAJ de username si même GUID
        

        var returnValue = {
            "message": `L'inscription de l'usager ${queryParameters.username} a été validé.`,
            "token": queryParameters.token
        }
        if (!isNew) {
            returnValue.message = `L'usager ${queryParameters.username} existe déjà.`
        }

        res.json(returnValue);
    }
    catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

/**
 * Permet de mettre a jour la chanson en cours (PUT)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.addSong = async function (req, res, next) {
    try {
        let { query, params, body } = req;

        // Validation
        // var access = headerAccess.authorized;
        // var authorized = false;
        //  access.forEach(key => {
        //     if (authorized) { return; }

        //     var result = req.rawHeaders.find(e => e.includes(key));
        //     if (result && result.length > 0) {
        //         authorized = true;
        //     }     
        // });
        // if (!authorized) {
        //     res.send(401);
        //     return;
        // }

        // Gestion des paramètres
        let queryParameters;
        let queryString = staticFunc.request.lowerQueryString(query);
        console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

        /*
            On effectue initialement la validation des Params (username/token).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        var validationErrors = [];
        if (params && Object.keys(params).length > 0) {
            validationErrors = validator.api.validateAddSong(params);
            queryParameters = params;
        } else {
            validationErrors = validator.api.validateAddSong(queryString);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }

        let extData = new extensionFileData("", queryParameters.token);
        var resData;
        await extData.loadUserPlaylist().then(async data => {
            resData = data;
        }).catch(error => {
            console.log(`A error occured during Registration`);
            console.error(error);
            res.send(error);
            return;
        });

        if (!resData) {
            res.send(`Le token n'existe pas`);
            return;

        } else if (!body || body === {}) {
            res.send('Vous devez mentionner les informations');
            return;

        } else {
            // Si body est vide
            if (body && body.title && body.title.length === 0) {
                return;
            } else if (body.title === resData.current.title) {
                // on F5 la même chanson XXX fois.
                return;
            }
            console.log(body)
            var newSong = body;
            // si une chanson est déjà présente on l'envoie dans la playlist
            if (resData.current && JSON.stringify(resData.current) !== '{}' && typeof resData.current.title !== "undefined") {
                resData.playlist.push(resData.current);
            }
            // TODO: Formatter URL pour retirer les Param inutile (list & index)
            // "https://www.youtube.com/watch?v=n43SAJ361Y4&list=PL7NDfWdeJCVKZevVhSoD2IeSoNDDeFs8l&index=66"
            resData.current = {
                title: newSong.title,
                url: newSong.url
            } 

            extData.updateExtensionFile(queryParameters.token)
            // Retourner en JSON
            var result = {
                "code": 200,
                "message": `La chanson ${body.title} est en cours.`
            }
            res.json(result);

            //res.send(`La chanson ${body.title} est en cours.`);
        }

    }
    catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.clearPlaylist = async function (req, res, next) {
    try {
        let { query, params } = req;

        // Validation
        // var access = headerAccess.authorized;
        // var authorized = false;
        //  access.forEach(key => {
        //     if (authorized) { return; }

        //     var result = req.rawHeaders.find(e => e.includes(key));
        //     if (result && result.length > 0) {
        //         authorized = true;
        //     }     
        // });
        // if (!authorized) {
        //     res.send(401);
        //     return;
        // }

        // Gestion des paramètres
        let queryParameters;
        let queryString = staticFunc.request.lowerQueryString(query);
        console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);

        /*
            On effectue initialement la validation des Params (username/token).
            Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
            en QueryString
        */
        var validationErrors = [];
        if (params && Object.keys(params).length > 0) {
            validationErrors = validator.api.validateAddSong(params);
            queryParameters = params;
        } else {
            validationErrors = validator.api.validateAddSong(queryString);
            queryParameters = queryString;
        }
        if (validationErrors && validationErrors.length > 0) {
            res.send(validationErrors)
            return;
        }

        let extData = new extensionFileData("", queryParameters.token);
        var resData;
        await extData.loadUserPlaylist().then(async data => {
            resData = data;
        }).catch(error => {
            console.log(`A error occured during Registration`);
            console.error(error);
            res.send(error);
            return;
        });

        if (!resData) {
            res.send(`Le token n'existe pas`);
            return;

        } else {
            resData.playlist = [];
            resData.current = {};
         

            extData.updateExtensionFile(queryParameters.token)
            // Retourner en JSON
            var result = {
                "code": 200,
                "message": `La playlist a été réinitialisé.`
            }
            res.json(result);
        }

    }
    catch (ex) {
        console.error(ex);
        res.send(ex);
    }
}

/**
 * Permet d'obtenir la chanson en cours
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getLastSong = async function (req, res, next) {
    try {
        let { query, params } = req;

               // Gestion des paramètres
               let queryParameters;
               let queryString = staticFunc.request.lowerQueryString(query);
               console.log(`Params: ${JSON.stringify(params)}, Query string : ${queryString}`);
       
               /*
                   On effectue initialement la validation des Params (username/token).
                   Si on ne retrouve pas les informations on valider ensuite si les paramètres n'ont pas été passé
                   en QueryString
               */
               var validationErrors = [];
               if (params && Object.keys(params).length > 0) {
                   validationErrors = validator.api.validateAddSong(params);
                   queryParameters = params;
               } else {
                   validationErrors = validator.api.validateAddSong(queryString);
                   queryParameters = queryString;
               }
               if (validationErrors && validationErrors.length > 0) {
                   res.send(validationErrors)
                   return;
               }
       
               let extData = new extensionFileData("", queryParameters.token);
               var resData;
               await extData.loadUserPlaylist().then(async data => {
                   resData = data;
               }).catch(error => {
                   console.log(`A error occured during Registration`);
                   console.error(error);
                   res.send(error);
                   return;
               });
       
               if (!resData) {
                   res.send(`Le token n'existe pas`);
               } else {
                   res.json(resData.current);
               }
    }
    catch (ex) {
        console.error(ex);
        res.send(ex);
    }
};

