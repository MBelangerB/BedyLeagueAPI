const info = require('../../static/info.json');
const RequestManager = require('../../util/RequestManager');

/**
 * validateReCAPTCHA function used by frontend
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.validateReCAPTCHA = async function (req, res) {
    try {
        console.log('Enter in validateReCAPTCHA');
        const { token, action } = req.body;

        // SECRET - RESPONSE
        let baseUrl = info.google.routes.validation;
        baseUrl = baseUrl.replace('{SECRET}', process.env.RECAPTCHA_V3);
        baseUrl = baseUrl.replace('{RESPONSE}', token);

        await RequestManager.ExecuteBasicRequest(baseUrl, 'post').then(function (queryRes) {
            // console.log(queryRes);
            if (queryRes && queryRes.success && queryRes.score >= 0.5) {
                return res.status(200).json({
                    msg: 'Token is validate for' + action,
                    OK: true,
                });
            } else {
                return res.status(200).json({
                    msg: 'Token is invalide for' + action,
                    err: 'A error occured',
                    // queryRes.error-codes,
                    OK: false,
                });
            }
        }, function (error) {
            const result = {
                code: error.status,
                msg: error.statusText,
                OK: false,
            };
            return res.status(400).send(result);
        });

    } catch (ex) {
        console.error('An error occured in exports.validateReCAPTCHA');
        console.error(ex);
        return res.status(500).json({
            msg: 'Cannot validate reCaptcha token. An error occurred while processing.',
            OK: false,
            err: ex,
        });
    }
};
// https://umbraco.com/knowledge-base/http-status-codes/