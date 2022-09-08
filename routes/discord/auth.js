const RequestManager = require('../../util/RequestManager');
const { AuthController } = require('../../controller/api/AuthController');
const jwt = require('jsonwebtoken');


require('dotenv').config();

const discordAuth = {

    async login(req, res, next) {

        // jwt.sign({ user }, process.env.SECRET, { expiresIn: process.env.TOKEN_LIFE }, (err, token) => {
        //     if (err) {
        //         console.warn(err);
        //         return res.status(403);
        //     } else {
        //         console.info(token);
        //         return res.status(200).json(token);
        //     }
        // });

        // windows.location.hash.slice(1)
        // const fragment = new URLSearchParams(req.query);
        // const [accessToken, tokenType, code] = [fragment.get('access_token'), fragment.get('token_type'), fragment.get('code')];

        // // if (!accessToken) {
        // //     return (document.getElementById('login').style.display = 'block');
        // // }

        // fetch('https://discord.com/api/users/@me', {
        //     headers: {
        //         authorization: `${tokenType} ${accessToken}`,
        //     },
        // })
        //     .then(result => result.json())
        //     .then(response => {
        //         const { username, discriminator } = response;
        //         document.getElementById('info').innerText += ` ${username}#${discriminator}`;
        //     })
        //     .catch(console.error);


        // res.send('test');
    },

    /**
     * Use the Code in Query param for get the AccessToken and create a JWT
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async accessToken(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [code] = [fragment.get('code')];

        if (code) {
            // We have code, we try to call Discord API for get a AccessToken
            const accessTokenInfo = await AuthController.getDiscordAccessToken(code);

            if (accessTokenInfo && accessTokenInfo.OK) {
                // We have accessToken we try to call Discord API for get UserInfo
                const userInfo = await AuthController.getDiscordUserInfo(accessTokenInfo.data.token_type, accessTokenInfo.data.access_token);

                if (userInfo && userInfo.OK) {
                    const payload = {
                        token_type: accessTokenInfo.data.token_type,
                        access_token: accessTokenInfo.data.access_token,
                        refresh_token: accessTokenInfo.data.refresh_token,
                        username: userInfo.data.username,
                        userid: userInfo.data.id,
                        avatar: userInfo.data?.avatar,
                        email: userInfo.data.email,
                    }
                    // let expireIn = accessTokenInfo.data.expires_in;

                    // Remove 30sec for processing
                    const expireDelay = null; // (expireIn - 30) + 's'
                    // var expireDate = new Date();
                    // expireDate = new Date(expireDate.getTime() + (1000 * (expireIn - 30)));

                    // Save User on db
                    const dbApiUser = await AuthController.createOrLoadApiUser(userInfo.data, AuthController.TokenSource.DISCORD, true);

                    // If process is success
                    if (dbApiUser && dbApiUser.user) {
                        await AuthController.createOrLoadApiToken(dbApiUser.user, AuthController.TokenSource.DISCORD, accessTokenInfo.data.access_token,
                            accessTokenInfo.data.refresh_token, accessTokenInfo.data.token_type);

                        // Save JWT
                        jwt.sign({ payload }, process.env.SECRET, { expiresIn: (expireDelay || process.env.TOKEN_LIFE) }, (err, token) => {
                            if (err) {
                                console.warn(err);
                                return res.status(403);
                            } else {
                                console.info(token);
                                return res.status(200).json({
                                    jwt: token,
                                    OK: true,
                                });
                            }
                        });

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

        } else {
            return res.sendStatus(401);
        }
    },

    /**
     * Use the JWT in Authorization Header for get the AccessToken and revoke it
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async revokeToken(req, res, next) {
        // https://discord.com/api/oauth2/token/revoke
        const payload = req.payload;
        if (!payload) {
            return res.sendStatus(401);
        }

        const accessToken = payload.accessToken;
        const result = await AuthController.revokeAccessToken(accessToken);
        if (result && result.OK) {
            res.status(200).send('Token is revoked.')
        } else {
            res.sendStatus(400).send('An error occured. Token is not revoked.')
        }
    },


    async callback(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [code] = [fragment.get('code')];
        console.log('callback :', code);

        // const [code, access_token, refresh_token, expires_in, scope, token_type] = [fragment.get('code'), fragment.get('access_token'),
        // fragment.get('refresh_token'), fragment.get('expires_in'),
        // fragment.get('scope'), fragment.get('token_type')];


        // Step 1 : Use the code for get AccessToken
        if (code) {
            // If Code we trying to connect we dont have TOKEN
            const accessTokenInfo = await AuthController.getDiscordAccessToken(code)

            // const API_ENDPOINT = 'https://discord.com/api/v10'
            // const REDIRECT_URI = 'http://localhost:3000/discord/callback'

            // const data = {
            //     'client_id': process.env.DISCORD_CLIENTID,
            //     'client_secret': process.env.DISCORD_SECRET,
            //     'grant_type': 'authorization_code',
            //     'code': code,
            //     'redirect_uri': REDIRECT_URI
            // }

            // const headers = {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            // }

            // await RequestManager.ExecuteRequest(API_ENDPOINT + '/oauth2/token', headers, qs.stringify(data), 'post').then(function (queryRes) {
            //     console.log(queryRes);
            //     return queryRes;

            // }, function (error) {
            //     const result = {
            //         code: error.error,
            //         msg: error.error_description,
            //         OK: false,
            //     };
            //     return res.status(400).send(result);
            // });


            // } else if (!code && access_token) {
            // If no code but accessToken. We are authentificated

            if (accessTokenInfo && accessTokenInfo.OK) {
                // We have accessToken we try to call Discord API for get UserInfo
                const userInfo = await AuthController.getDiscordUserInfo(accessTokenInfo.data.token_type, accessTokenInfo.data.access_token);

                if (userInfo && userInfo.OK) {
                    const payload = {
                        token_type: accessTokenInfo.data.token_type,
                        access_token: accessTokenInfo.data.access_token,
                        refresh_token: accessTokenInfo.data.refresh_token,
                        username: userInfo.data.username,
                        userid: userInfo.data.id,
                        avatar: userInfo.data?.avatar,
                    }
                    let expireIn = accessTokenInfo.data.expires_in;

                    // Remove 30sec for processing
                    const expireDelay = (expireIn - 30) + 's'
                    var expireDate = new Date();
                    expireDate = new Date(expireDate.getTime() + (1000 * (expireIn - 30)));

                    // Save User on db
                    const dbApiUser = await AuthController.createOrLoadApiUser(userInfo.data, AuthController.TokenSource.DISCORD, true);

                    if (dbApiUser && dbApiUser.user) {
                        await AuthController.createOrLoadApiToken(dbApiUser.user, AuthController.TokenSource.DISCORD, accessTokenInfo.data.access_token,
                            accessTokenInfo.data.refresh_token, accessTokenInfo.data.token_type);

                        // Save JWT
                        jwt.sign({ payload }, process.env.SECRET, { expiresIn: (expireDelay || process.env.TOKEN_LIFE) }, (err, token) => {

                            if (err) {
                                console.warn(err);
                                return res.status(403);
                            } else {
                                console.info(token);
                                return res.status(200).json(token);
                            }
                        }); // TODO: Maybe safe JWT ?

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
                } // Call Discord API for GetUserInfo
            } else {
                return res.status(400).send(accessTokenInfo);
            } // Call Discord API for GetAccessToken
        } else {
            // no code do anything
        } // Callback
    },


    async userInfo(req, res, next) {

    },

    async serverList(req, res, next) {

    }
}

module.exports = { discordAuth }