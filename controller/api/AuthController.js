'use strict';

const { sequelize } = require('../../db/dbSchema');
const { API_Users, API_Tokens } = sequelize.models;
const RequestManager = require('../../util/RequestManager');
const qs = require('qs');
const { api } = require('../../util/validator');

class AuthController {


    // OnCreate : 
    //  If already exist
    //      res.status(403).json({ message: "User already registered" });
    //  If error occured encrypt
    //      res.status(400).json({ 'error': err });
    //  If Global error (catch)
    //      res.status(500).json({ 'error': err });
    // static async createOrLoadUser(username, email, decryptedPassword, createUserIfNotExist) {
    //     try {
    //         const data = {
    //             isNew: false,
    //             user: await API_Users.findOne({ where: { username: username, email: email } }),
    //             jwtUser: {}
    //         }

    //         if (createUserIfNotExist && data.user == null) {
    //             data.isNew = true;

    //             data.user = await API_Users.create({
    //                 username: username,
    //                 password: decryptedPassword,
    //                 email: email,
    //             });

    //         } else if (data.user) {
    //             // payload
    //             data.jwtUser = {
    //                 id: data.user.id,
    //                 username: data.user.username,
    //                 email: data.user.email,
    //             }
    //         }

    //         return data;

    //     } catch (error) {
    //         if (error.name === 'SequelizeUniqueConstraintError') {
    //             return console.error('That Users already exists.', error);
    //         }
    //         return console.error('A error occured in AuthController.createOrLoadUser.', error);
    //     }
    // }

    static async getUser(payload) {
        try {
            return await API_Users.findOne({ where: { id: payload.id, username: payload.username, email: payload.email } });
        } catch (error) {
            return console.error('A error occured in AuthController.getUser.', error);
        }
    }


    /**
     * 
     * @returns 
     */
    static async getDiscordAccessToken(code) {
        const API_ENDPOINT = 'https://discord.com/api/v10'
        const REDIRECT_URI = 'http://localhost:3000/discord/callback'

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

        return await RequestManager.ExecuteRequest(API_ENDPOINT + '/oauth2/token', headers, qs.stringify(data), 'post').then(function (queryRes) {
            console.log(queryRes);
            const result = {
                data: queryRes,
                OK: true,
            };

            return result;
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
     * Contact Discord API for get UserInfo
     * @param {*} token_type 
     * @param {*} access_token 
     * @returns 
     */
    static async getDiscordUserInfo(token_type, access_token) {
        const userInfoUrl = 'https://discord.com/api/users/@me';
        const headers = {
            'authorization': `${token_type} ${access_token}`,
        }

        return await RequestManager.ExecuteRequest(userInfoUrl, headers, null, 'get').then(function (userinfo) {
            const result = {
                OK: true,
                data: userinfo
            }
            return result;

        }, function (error) {
            const result = {
                code: error.error,
                msg: error.error_description,
                OK: false,
            };
            return result;
        });
    }

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

            } else if (data.user) {
                data.payload = {
                    token_type: data.user.API_Token?.token_type,
                    access_token: data.user.API_Token?.access_token,
                    refresh_token: data.user.API_Token?.refresh_token,
                    username: data.user.username,
                    userid: data.user.id,
                    avatar: data.user.avatar,
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

    static async createOrLoadApiToken(apiUser, source, access_Token, refresh_token, token_type) {
        try {
            const apiToken = await API_Tokens.findOne({ where: { userId: apiUser.id }});

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

            return apiToken;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That API Token already exists.', error);
            }
            return console.error('A error occured in AuthController.createOrLoadApiToken.', error);
        }
    }

// TODO: Pour les catch error de Sequelize, il faudrait  retourne une erreur pour interrompre le traitement

}

AuthController.TokenSource = {
    DISCORD: 1,
};

module.exports = {
    AuthController,
};