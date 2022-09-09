'use strict';

const { sequelize } = require('../../db/dbSchema');
const { API_Users, API_Tokens } = sequelize.models;
const RequestManager = require('../../util/RequestManager');
const qs = require('qs');
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
     * Get User DB by payload
     * @param {*} payload 
     * @returns 
     */
    static async getUserByPayload(payload) {
        try {
            return await API_Users.findOne({ where: { id: payload.userid, username: payload.username, email: payload.email } });
        } catch (error) {
            return console.error('A error occured in AuthController.getUserByPayload.', error);
        }
    }

    /**
     * Get User DB by UserId
     * @param {*} userId 
     * @returns 
     */
    static async getUserById(userId) {
        try {
            return await API_Users.findOne({ where: { id: userId } });
        } catch (error) {
            return console.error('A error occured in AuthController.getUserById.', error);
        }
    }

    /**
     * Call Discord API for get AccessToken
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
     * Revoke the Discord Token
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
     * Create or Load the API User
     * @param {*} userData 
     * @param {*} source 
     * @param {*} createUserIfNotExist 
     * @returns 
     */
    static async createOrLoadApiUser(userData, source, createUserIfNotExist) {
        try {
            const data = {
                isNew: false,
                user: await API_Users.findOne({ where: { username: userData.username, email: userData.email, source: source }, include: [API_Tokens] }),
                payload: {}
            }

            if (createUserIfNotExist && data.user == null) {
                data.isNew = true;

                data.user = await API_Users.create({
                    id: userData.id,
                    username: userData.username,
                    source: source,
                    avatar: userData.avatar,
                    discriminator: userData.discriminator,
                    email: userData.email,
                });
                // https://discord.com/developers/docs/reference#image-formatting
                // UserId / AvatarId
                // https://cdn.discordapp.com/avatars/272021553745625088/9ad4cb425b89a545db549a7acec8dbfc

                // Server Icon
                // ServerId (351056134985220098) / iconId (a_e18def95a4827163cbcc4557627569d5)
                // https://cdn.discordapp.com/icons/351056134985220098/a_e18def95a4827163cbcc4557627569d5.webp?size=96

                // Perm lvl : 2147483647  (admin ??)

            } else if (data.user) {
                // Refresh User
                data.user.set({
                    username: userData.username,
                    avatar: userData.avatar,
                });
                await data.user.save();

                // Prepare Data
                const cdnInfo = new CDN();

                // const avatarUrl = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}`;  
                data.payload = {
                    token_type: data.user.API_Token?.token_type,
                    access_token: data.user.API_Token?.access_token,
                    refresh_token: data.user.API_Token?.refresh_token,
                    username: data.user.username,
                    userid: data.user.id,
                    avatar: cdnInfo.avatar(data.user.id, userData?.avatar, data.user.discriminator) || userData?.avatar,
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
     * Get the API Token
     * @param {*} token 
     * @param {*} source 
     * @returns 
     */
    static async getUserToken(token, source) {
        try {
            return await API_Tokens.findOne({ where: { accessToken: token, source: source } });
        } catch (error) {
            return console.error('A error occured in AuthController.getUserToken.', error);
        }
    }

    /**
     * Create the API Token on DB
     */
    static async createOrLoadApiToken(apiUser, source, access_Token, refresh_token, token_type, createUserIfNotExist = true) {
        try {
            const apiToken = await API_Tokens.findOne({ where: { userId: apiUser.id } });

            if (!createUserIfNotExist) {
                if (apiUser && !apiToken) {
                    apiToken = await API_Tokens.create({
                        userId: apiUser.id,
                        accessToken: access_Token,
                        refreshToken: refresh_token,
                        tokenType: token_type,
                        source: source,
                    });
                } else if (apiUser && apiToken) {
                    apiToken.set({
                        accessToken: access_Token,
                        refreshToken: refresh_token,
                        tokenType: token_type,
                    });
                    await apiToken.save();
                }
            }

            return apiToken;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That API Token already exists.', error);
            }
            return console.error('A error occured in AuthController.createOrLoadApiToken.', error);
        }
    }

    static getExpireAt(expires_in) {
        const expiresAt = moment().add(expires_in, 'seconds');
        return expiresAt;

        // Remove 30sec for processing
        // const expireDelay = null; // (expireIn - 30) + 's'
        // var expireDate = new Date();
        // expireDate = new Date(expireDate.getTime() + (1000 * (expireIn - 30)));
    }

    // TODO: Pour les catch error de Sequelize, il faudrait  retourne une erreur pour interrompre le traitement

}

AuthController.TokenSource = {
    DISCORD: 1,
};

module.exports = {
    AuthController,
};