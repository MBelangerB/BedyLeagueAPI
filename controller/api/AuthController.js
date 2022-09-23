'use strict';

const { sequelize } = require('../../db/dbSchema');
const { API_Users, API_Tokens } = sequelize.models;
const RequestManager = require('../../util/RequestManager');
const qs = require('qs');
const jwt = require('jsonwebtoken');
const staticInfo = require('../../static/info.json');
const { CDN } = require('../../module/discord/cdn');
const moment = require('moment');

class AuthController {

    // OnCreate : 
    //  If already exist
    //      res.status(403).json({ message: "User already registered" });
    //  If error occured encrypt
    //      res.status(400).json({ 'error': err });
    //  If Global error (catch)
    //      res.status(500).json({ 'error': err });

    /**
     * [DB] Get User DB by payload
     * @param {*} payload 
     * @returns 
     */
    static async getUserByPayload(payload) {
        try {
            return await API_Users.getUserByPayload(payload);
        } catch (error) {
            return console.error('A error occured in AuthController.getUserByPayload.', error);
        }
    }

    /**
     * [DB] Get User DB by UserId
     * @param {*} userId 
     * @returns 
     */
    static async getUserByExternalId(externalUserId) {
        try {
            return await API_Users.getApiUserByExternalId(externalUserId);
        } catch (error) {
            return console.error('A error occured in AuthController.getUserByExternalId.', error);
        }
    }

    /**
     * [REST] Call Discord API for get AccessToken
     * @returns 
     */
    static async getDiscordAccessToken(code) {
        const API_ENDPOINT = staticInfo.discord.routes.api + staticInfo.discord.routes.version;
        const REDIRECT_URI = process.env.FRONTEND_URL + process.env.FRONTEND_CALLBACK;

        const data = {
            'client_id': process.env.DISCORD_CLIENTID,
            'client_secret': process.env.DISCORD_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI
        }

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        return await RequestManager.ExecuteRequest(API_ENDPOINT + staticInfo.discord.routes.auth.getToken, headers, qs.stringify(data), 'post').then(function (queryRes) {
            console.log(queryRes);
            const result = {
                data: queryRes,
                OK: true,
            };

            return result;
        }, function (error) {
            const result = {
                code: error.status,
                data: error.data,
                msg: error.statusText,
                OK: false,
            };
            return result;
        });
    }

    /**
     * [REST] Revoke the Discord Token
     * @param {*} accessToken 
     * @returns 
     */
    static async revokeAccessToken(accessToken) {
        const API_ENDPOINT = staticInfo.discord.routes.api + staticInfo.discord.routes.version;
        const data = {
            'client_id': process.env.DISCORD_CLIENTID,
            'client_secret': process.env.DISCORD_SECRET,
            'token': accessToken,
        }

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        return await RequestManager.ExecuteRequest(API_ENDPOINT + staticInfo.discord.routes.auth.revokeToken, headers, qs.stringify(data), 'post').then(function (queryRes) {
            if (queryRes) {
                const result = {
                    OK: true,
                };

                return result;
            }
        }, function (error) {
            const result = {
                code: error.error,
                msg: error.error_description,
                OK: false,
            };
            return result;
        });
    }

    /**
     * [DB] Create or Load the API User
     * @param {*} userData 
     * @param {*} source 
     * @param {*} createUserIfNotExist 
     * @returns 
     */
    static async createOrLoadApiUser(userData, source, createUserIfNotExist) {
        try {
            const data = {
                isNew: false,
                user: await API_Users.getApiUserByUserInfo(userData.username, userData.email, source, true),
                payload: {}
            }

            if (createUserIfNotExist && data.user == null) {
                data.isNew = true;
                data.user = await API_Users.addUser(userData.id, userData.username, userData.avatar, source, userData.discriminator, userData.email);

            } else if (data.user) {
                await data.user.updateUserInfo(userData.username, userData.avatar);

                // Prepare Data
                data.payload = AuthController.callbackToPayload(data.user.API_Token, data.user, 'hybrid');
            }

            return data;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That API Users already exists.', error);
            }
            return console.error('A error occured in AuthController.createOrLoadApiUser.', error);
        }
    }

    /**
     * [DB] Get the API Token
     * @param {*} token 
     * @param {*} source 
     * @returns 
     */
    static async getUserToken(token, source) {
        try {
            return await API_Tokens.findTokenByToken(token, source);
        } catch (error) {
            return console.error('A error occured in AuthController.getUserToken.', error);
        }
    }

    /**
     * [DB] Create the API Token on DB
     * @param {*} apiUser 
     * @param {*} source 
     * @param {*} accessTokenInfo 
     * @returns 
     */
    static async createOrLoadApiToken(apiUser, source, accessTokenInfo) {
        try {
            let apiToken = await API_Tokens.findTokenByUserId(apiUser.id); 

            if (apiUser && !apiToken) {
                // Token user doesn't exist in DB. We create it        
                apiToken = await API_Tokens.addAccessToken(apiUser.id, accessTokenInfo.access_token,  accessTokenInfo.refresh_token,        accessTokenInfo.token_type,  accessTokenInfo.scope, this.getExpireAt(accessTokenInfo.expires_in), source)

            } else if (apiUser && apiToken) {
                // Token exist, we update it  
                await updateAccessToken.updateAccessToken(accessTokenInfo.access_token, accessTokenInfo.refresh_token,accessTokenInfo.token_type, accessTokenInfo.scope, this.getExpireAt(accessTokenInfo.expires_in))
            }

            return apiToken;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That API Token already exists.', error);
            }
            return console.error('A error occured in AuthController.createOrLoadApiToken.', error);
        }
    }

    /**
     * Compute the expirate date 
     * @param {*} expires_in 
     * @returns 
     */
    static getExpireAt(expires_in) {
        const expiresAt = moment().add(expires_in, 'seconds');
        return expiresAt;
    }

    /**
     * Build the JWT Token
     * @param {*} res 
     * @param {*} payload 
     * @param {*} expireDelay 
     * @param {*} access_token 
     * @returns 
     */
    static BuildJWT(res, payload, expireDelay, access_token) {
        // Save JWT
        const defaultInterval = (process.env.TOKEN_LIFE + process.env.TOKEN_INTERVAL);
        return jwt.sign({ payload }, process.env.SECRET, { expiresIn: (expireDelay || defaultInterval) }, (err, token) => {
            if (err) {
                console.warn(err);
                return res.status(403);
            } else {
                console.info(token);
                return res.status(200).json({
                    jwt: token,
                    accessToken: access_token,
                    expiresIn: (expireDelay || process.env.TOKEN_LIFE),
                    OK: true,
                });
            }
        });
    }
    // TODO: Pour les catch error de Sequelize, il faudrait  retourne une erreur pour interrompre le traitement

    
    /**
     * Cast the AccessToken calllback and User info callback on payload
     * @param {*} tokenCallback 
     * @param {*} userCallback 
     * @param {*} source 
     * @returns 
     */
     static callbackToPayload(tokenCallback, userCallback, source = "callback") {
        const cdnInfo = new CDN();
        if (source == "callback") {
            return {
                token_type: tokenCallback?.token_type,
                access_token: tokenCallback?.access_token,
                refresh_token: tokenCallback?.refresh_token,
                username: userCallback.username,
                userId: userCallback.id,
                avatar: {
                    xSmall: cdnInfo.avatar(userCallback.id, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[16] }) || '',
                    small: cdnInfo.avatar(userCallback.id, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[32] }) || '',
                    medium: cdnInfo.avatar(userCallback.id, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[64] }) || '',
                    large: cdnInfo.avatar(userCallback.id, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[128] }) || '',
                },
                email: userCallback.email,
            };

        } else if (source == "db") {
            return {
                token_type: tokenCallback.tokenType,
                access_token: tokenCallback.accessToken,
                refresh_token: tokenCallback.refreshToken,
                username: userCallback.username,
                userId: userCallback.externalId,
                avatar: {
                    xSmall: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[16] }) || '',
                    small: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[32] }) || '',
                    medium: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[64] }) || '',
                    large: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[128] }) || '',
                },
                email: userCallback.email,
            };
        } else if (source == "hybrid") {
            return {
                token_type: tokenCallback?.token_type,
                access_token: tokenCallback?.access_token,
                refresh_token: tokenCallback?.refresh_token,
                username: userCallback.username,
                userId: userCallback.externalId,
                avatar: {
                    xSmall: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[16] }) || '',
                    small: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[32] }) || '',
                    medium: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[64] }) || '',
                    large: cdnInfo.avatar(userCallback.externalId, userCallback?.avatar, userCallback.discriminator, { size: CDN.SIZES[128] }) || '',
                },
                email: userCallback.email,
            };      
        }
    }
}

AuthController.TokenSource = {
    DISCORD: 1,
};

module.exports = {
    AuthController,
};