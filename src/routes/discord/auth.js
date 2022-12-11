const { AuthController } = require('../../controller/api/AuthController');
const { DiscordRestController } = require('../../controller/discord/DiscordRestController');
const { DiscordMapper } = require('../../module/discord/DiscordMapper');
// const jwt = require('jsonwebtoken');
const { CDN } = require('../../module/discord/cdn');

require('dotenv').config();

const discordAuth = {

    /**
     * Callback when we install the bot
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async callback_auth(req, res, next) {
        console.log(req.body);

        res.send('OK')
        return
    },

    /**
     * Use the Code in Query param for get the AccessToken and create a JWT.
     * Or use the JWT to auth the user.
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async accessToken(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [code, token] = [fragment.get('code'), fragment.get('token')];

        try {
            if (code) {
                // We have code, we try to call Discord API for get a AccessToken
                const accessTokenInfo = await AuthController.getDiscordAccessToken(code);

                if (accessTokenInfo && accessTokenInfo.OK) {
                    // We have accessToken we try to call Discord API for get UserInfo
                    const userInfo = await DiscordRestController.getDiscordUserInfo(accessTokenInfo.data.token_type, accessTokenInfo.data.access_token);

                    if (userInfo && userInfo.OK) {
                        // Prepare the payload
                        const payload = AuthController.callbackToPayload(accessTokenInfo.data, userInfo.data);
                        // Save User on db
                        const dbApiUser = await AuthController.createOrLoadApiUser(userInfo.data, AuthController.TokenSource.DISCORD, true);

                        // If process is success
                        if (dbApiUser && dbApiUser.user) {
                            await AuthController.createOrLoadApiToken(dbApiUser.user, AuthController.TokenSource.DISCORD, accessTokenInfo.data);
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
                    // Get DB User
                    const dbUser = await AuthController.getUserByExternalId(dbToken.userId);
                    // Prepare the payload
                    const payload = AuthController.callbackToPayload(dbToken, dbUser, "db");

                    AuthController.BuildJWT(res, payload, null, payload.access_token);
                } else {
                    return res.status(401).send('No token');
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
                //TODO: Remove from database
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

}

module.exports = { discordAuth }