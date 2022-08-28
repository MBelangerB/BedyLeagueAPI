
var info = require('../../static/info.json');
var RequestManager = require(`../../util/RequestManager`);

exports.validateReCAPTCHA = async function (req, res, next) {
    try {
        console.log('Enter in validateReCAPTCHA');
        let { token, action } = req.body;

        // SECRET - RESPONSE
        let baseUrl = info.google.routes.validation;
        baseUrl = baseUrl.replace("{SECRET}", process.env.RECAPTCHA_V3);
        baseUrl = baseUrl.replace("{RESPONSE}", token);

        let t = await RequestManager.ExecuteRequest(baseUrl, 'post').then(function (queryRes) {
            console.log(queryRes);
            if (queryRes && queryRes.success && queryRes.score >= 0.5) {
                return res.status(200).json({
                    msg: 'Token is validate for' + action,
                    OK: true
                });
            } else {
                return res.status(200).json({
                    msg: 'Token is invalide for' + action,
                    err: queryRes.error-codes,
                    OK: false
                });        
            }
        }, function (error) {
            result.err = {
                statusCode: error.status,
                statusMessage: error.statusText,
                OK: false
            }
            return res.status(400).send(result);
        });

    } catch (ex) {
        console.error('An error occured in exports.validateReCAPTCHA')
        console.error(ex);
        return res.status(500).json({
            msg: 'Cannot validate reCaptcha token. An error occurred while processing.',
            OK: false,
            err: ex
        });
    }
}
// https://umbraco.com/knowledge-base/http-status-codes/