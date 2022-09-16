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

                data.user = await API_Users.create({
                    externalId: userData.id,
                    username: userData.username,
                    source: source,
                    avatar: userData.avatar,
                    discriminator: userData.discriminator,
                    email: userData.email,
                });

            } else if (data.user) {
                data.user.updateUserInfo(userData.username,userData.avatar);

                // Prepare Data
                const cdnInfo = new CDN();
                data.payload = {
                    token_type: data.user.API_Token?.token_type,
                    access_token: data.user.API_Token?.access_token,
                    refresh_token: data.user.API_Token?.refresh_token,
                    username: data.user.username,
                    userId: data.user.externalId,
                    avatar: {
                        xSmall: cdnInfo.avatar(data.user.externalId, userData?.avatar, data.user.discriminator, { size: CDN.SIZES[16] }) || server.icon,
                        small: cdnInfo.avatar(data.user.externalId, userData?.avatar, data.user.discriminator, { size: CDN.SIZES[32] }) || server.icon,
                        medium: cdnInfo.avatar(data.user.externalId, userData?.avatar, data.user.discriminator, { size: CDN.SIZES[64] }) || server.icon,
                        large: cdnInfo.avatar(data.user.externalId, userData?.avatar, data.user.discriminator, { size: CDN.SIZES[128] }) || server.icon,
                    },
                }
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
            return await API_Tokens.getTokenByAccessToken(token, source);
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
            let apiToken = await API_Tokens.getTokenByExternalUserId(apiUser.externalId);
           
            if (apiUser && !apiToken) {
                // Token user doesn't exist in DB. We create it
                apiToken = await API_Tokens.create({
                    apiUserId: apiUser.externalId,
                    accessToken: accessTokenInfo.access_token,
                    refreshToken: accessTokenInfo.refresh_token,
                    tokenType: accessTokenInfo.token_type,
                    scope: accessTokenInfo.scope,
                    expireAt: this.getExpireAt(accessTokenInfo.expires_in),
                    source: source,
                });

            } else if (apiUser && apiToken) {
                // Token exist, we update id
                apiToken.set({
                    accessToken: accessTokenInfo.access_token,
                    refreshToken: accessTokenInfo.refresh_token,
                    scope: accessTokenInfo.scope,
                    expireAt: this.getExpireAt(accessTokenInfo.expires_in),
                    tokenType: accessTokenInfo.token_type,
                });
                await apiToken.save();
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

        // Remove 30sec for processing
        // const expireDelay = null; // (expireIn - 30) + 's'
        // var expireDate = new Date();
        // expireDate = new Date(expireDate.getTime() + (1000 * (expireIn - 30)));
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

}

AuthController.TokenSource = {
    DISCORD: 1,
};

module.exports = {
    AuthController,
};