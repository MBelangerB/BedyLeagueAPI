const { AuthController } = require('../../controller/api/AuthController');
const { DiscordRestController } = require('../../controller/discord/RestDiscordController');
const { DiscordMapper } = require('../../module/discord/DiscordMapper');
const jwt = require('jsonwebtoken');
const { CDN } = require('../../module/discord/cdn');

require('dotenv').config();

const discordAuth = {

    /**
     * Use the Code in Query param for get the AccessToken and create a JWT.
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async accessToken(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [code, token] = [fragment.get('code'), fragment.get('token')];
        const cdnInfo = new CDN();

        try {
            if (code) {
                // We have code, we try to call Discord API for get a AccessToken
                const accessTokenInfo = await AuthController.getDiscordAccessToken(code);

                if (accessTokenInfo && accessTokenInfo.OK) {
                    // We have accessToken we try to call Discord API for get UserInfo
                    const userInfo = await DiscordRestController.getDiscordUserInfo(accessTokenInfo.data.token_type, accessTokenInfo.data.access_token);

                    if (userInfo && userInfo.OK) {
                        const payload = {
                            token_type: accessTokenInfo.data.token_type,
                            access_token: accessTokenInfo.data.access_token,
                            refresh_token: accessTokenInfo.data.refresh_token,
                            username: userInfo.data.username,
                            userid: userInfo.data.id,
                       //     avatar: cdnInfo.avatar(userInfo.data.id, userInfo.data?.avatar, userInfo.data.discriminator) || userInfo.data?.avatar,
                            avatar: {
                                xSmall: cdnInfo.avatar(userInfo.data.id, userInfo.data?.avatar,  userInfo.data.discriminator, {size: CDN.SIZES[16]} ) || userInfo.data?.avatar,
                                small:  cdnInfo.avatar(userInfo.data.id, userInfo.data?.avatar,  userInfo.data.discriminator, {size: CDN.SIZES[32]} ) || userInfo.data?.avatar,
                                medium: cdnInfo.avatar(userInfo.data.id, userInfo.data?.avatar,  userInfo.data.discriminator, {size: CDN.SIZES[64]} ) || userInfo.data?.avatar,
                                large:   cdnInfo.avatar(userInfo.data.id, userInfo.data?.avatar, userInfo.data.discriminator, {size: CDN.SIZES[128]} ) ||userInfo.data?.avatar,
                            }, 
                            email: userInfo.data.email,
                        }

                        // Save User on db
                        const dbApiUser = await AuthController.createOrLoadApiUser(userInfo.data, AuthController.TokenSource.DISCORD, true);
                        // If process is success
                        if (dbApiUser && dbApiUser.user) {
                            await AuthController.createOrLoadApiToken(dbApiUser.user, AuthController.TokenSource.DISCORD,
                                accessTokenInfo.data.access_token, accessTokenInfo.data.refresh_token, accessTokenInfo.data.token_type);

                            // Save JWT
                            AuthController.BuildJWT(res, payload, null, accessTokenInfo.data.access_token);
                        } else {
                            const result = {
                                code: 0,
                                msg: 'An error occured, please try again.',
                                OK: false,
                            };
                            return res.status(400).send(result);
                        } // Call DB for create User
                    } else {
                        return res.status(400).send(userInfo);
                    } // After call Discord API (getDiscordUserInfo)
                } else {
                    return res.status(400).send(accessTokenInfo);
                } // After call Discord API (getDiscordAccessToken)

            } else if (token && !code) {
                // We have a token, we check if he exist in DB and we refresh the JWT
                const dbToken = await AuthController.getUserToken(token, AuthController.TokenSource.DISCORD);

                if (dbToken) {
                    const dbUser = await AuthController.getUserById(dbToken.userId);

                    const payload = {
                        token_type: dbToken.tokenType,
                        access_token: dbToken.accessToken,
                        refresh_token: dbToken.refreshToken,
                        username: dbUser.username,
                        userid: dbUser.id,
                        avatar: cdnInfo.avatar(dbUser.id, dbUser.avatar, dbUser.discriminator) || dbUser?.avatar,
                        email: dbUser.email,
                    }

                    AuthController.BuildJWT(res, payload, null, payload.access_token);
                } else {
                    return res.status(401);
                }

            } else {
                return res.sendStatus(401);
            }

        } catch (ex) {
            console.error('A error occured in DiscordAuth.accessToken')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },

    /**
     * Use the JWT in Authorization Header for get the AccessToken and revoke it
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async revokeToken(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [accessToken] = [fragment.get('token')];

        try {
            const payload = req.payload;
            if (!payload) {
                return res.sendStatus(401);
            }

            const result = await AuthController.revokeAccessToken(accessToken);
            if (result && result.OK) {
                res.status(200).send({
                    OK: true,
                    msg: 'Token is revoked.'
                });

            } else {
                res.status(400).send({
                    OK: false,
                    msg: 'An error occured. Token is not revoked.'
                });
            }
        } catch (ex) {
            console.error('A error occured in DiscordAuth.revokeToken')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },


    async userInfo(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [token] = [fragment.get('token')];

        try {
            // We have accessToken we try to call Discord API for get UserInfo
            const userInfo = await DiscordRestController.getDiscordUserInfo('Bearer', token);
            if (userInfo && userInfo.OK) {        
                return res.status(200).json({
                    data : userInfo.data,
                    OK: true,
                });
            } else {
                res.status(400).send({
                    OK: false,
                    msg: 'An error occured. Token is not revoked.'
                });      
            }
        } catch (ex) {
            console.error('A error occured in DiscordAuth.userInfo')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },

    async serverList(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [token] = [fragment.get('token')];

        try {
            const guildInfo = await DiscordRestController.getGuilds('Bearer', token);
            if (guildInfo && guildInfo.OK) {
                const mapper = new DiscordMapper();
                const frontData = mapper.castServerDataList(guildInfo.data);
                if (frontData && frontData.length > 0) {
                    res.status(200).send({
                        OK: true,
                        data: frontData
                    });      
                } else {
                    res.status(400).send({
                        OK: false,
                        msg: 'An error occured. Cant obtains data'
                    });   
                }     
            } else {
                res.status(400).send({
                    OK: false,
                    msg: 'An error occured. Cant obtains data'
                });      
            }
            
        } catch (ex) {
            console.error('A error occured in DiscordAuth.serverList')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },



    // BuildJWT(res, payload, expireDelay, access_token) {
    //     // Save JWT
    //     const defaultInterval = (process.env.TOKEN_LIFE + process.env.TOKEN_INTERVAL);
    //     return jwt.sign({ payload }, process.env.SECRET, { expiresIn: (expireDelay || defaultInterval) }, (err, token) => {
    //         if (err) {
    //             console.warn(err);
    //             return res.status(403);
    //         } else {
    //             console.info(token);
    //             return res.status(200).json({
    //                 jwt: token,
    //                 accessToken: access_token,
    //                 expiresIn: (expireDelay || process.env.TOKEN_LIFE),
    //                 OK: true,
    //             });
    //         }
    //     });
    // }
}

module.exports = { discordAuth }