const jwt = require('jsonwebtoken');
const { AuthController } = require('../../controller/api/AuthController');

// Obsolet route, dont use ATP
// Trying for custom Login/JWT

const tokenList = {}
// https://github.com/DInuwan97/REACT_Login_RegistartionDummy_App/blob/master/Routes/api/users.js
// https://www.npmjs.com/package/jsonwebtoken
// https://gist.github.com/ziluvatar/a3feb505c4c0ec37059054537b38fc48
// https://github.com/codeforgeek/node-refresh-token/blob/master/app.js
// https://codeforgeek.com/refresh-token-jwt-nodejs-authentication/
const authRouter = {

    /**
     * Personnal login - JWT Test
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async login(req, res, next) {
        try {
            console.log('Enter in Login');
            let { username, email, passwd } = req.body;

            let userInfo = await AuthController.createOrLoadUser(username, email, passwd, false);
            if (userInfo && userInfo.user) {
                // Si le compte existe, on s'assure que le mot de passe est identique
                if (userInfo.user.validatePassword(passwd)) {
                    const user = userInfo.jwtUser;

                    jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_LIFE }, (err, token) => {
                        if (err) {
                            console.warn(err);
                            return res.status(403);
                        } else {
                            console.info(token);
                            return res.status(200).json(token);
                        }
                    });


                } else {
                    return res.status(503).send('503 - Unauthorized.')
                }
            } else {
                // Pas acccès
                return res.status(401).send('Le compte n\'existe pas.')
            }
        } catch (ex) {
            console.error('An error occured in /api/login')
            console.error(ex);
            return res.status(500).json({
                msg: 'Cannot login process.',
                OK: false,
                err: ex
            });
        }
    },

    /**
     * Not OK - Not availabled in jwt
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async refreshToken(req, res, next) {
        try {
            console.log('Enter in Login');
            let { payload } = req;
            let { token } = req.body;

            if (payload) {
                // let userInfo = await AuthController.getUserByPayload(payload);

                let data = jwt.verify(token, process.env.JWT_SECRET);
                delete data.iat;
                delete data.exp;
                delete data.nbf;
                delete data.jti;

                jwt.sign({ payload }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_LIFE }, (err, token) => {
                    if (err) {
                        console.warn(err);
                        return res.status(403);
                    } else {
                        console.info(token);
                        return res.status(200).json(token);
                    }
                });

                // return res.status(200).json({
                //     message: 'Token is refresh',
                //     userData: req.payload
                // });
            } else {
                // Pas acccès
                return res.status(401).send('Le compte n\'existe pas.')
            }

        } catch (ex) {
            console.error('An error occured in /api/refreshToken')
            console.error(ex);
            return res.status(500).json({
                msg: 'Cannot login process.',
                OK: false,
                err: ex
            });
        }
    },

    // profile = async function (req, res, next) {
    async profile(req, res, next) {
        try {
            // Soluce 1
            // jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
            //     if (err) {
            //         console.warn(err.message);
            //         res.status(403).send('403 - Forbidden');
            //     } else {
            //         console.info(authData);
            //         return res.status(200).json({
            //             message: 'Welcome to profile',
            //             userData: authData
            //         });
            //     }
            // });

            // Soluce 2
            return res.status(200).json({
                message: 'Welcome to profile',
                userData: req.payload
            });

        } catch (ex) {
            console.error('An error occured in /api/profile')
            console.error(ex);
            return res.status(500).json({
                msg: 'Cannot login process.',
                OK: false,
                err: ex
            });
        }
    }
}

/**
 * Get Headers authorization value
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        // Soluce 2
        const bearer = bearerHeader.split(' ');
        const tokenType = bearer[0].toLowerCase();
        const token = bearer[1];
        if (tokenType == 'jwt') {
            jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
                if (err) {
                    console.warn(err.message);
                    res.status(401).json({
                        error: true,
                        message: 'Unauthorized access.'
                    });
                } else {
                    req.token = token;
                    req.payload = payload;
                    next();
                }
            });
        } else {
            res.status(403).json({
                error: true,
                message: 'Invalid tokem type.'
            });
        }


    } else {
        res.status(403).json({
            error: true,
            message: 'No token provided.'
        });
    }
}

module.exports = { authRouter, verifyToken }