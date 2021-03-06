
var axios = require('axios');

class RequestManager {

    static TokenType = {
        TFT: 'TFT',
        LOL: 'LOL'
    }

    constructor(data) {
    }

    static getToken(tokenType) {
        var token;
        switch (tokenType) {
            case this.TokenType.TFT:
                token = `${process.env.tftKey}`;
                break;
 
            case this.TokenType.LOL:
                token = `${process.env.lolKey}`;
                break;

            default:
                token = ``;
                break;
        }
        return token;
    }

    /*
        Methode base pour executer Query
    */
    static async ExecuteTokenRequest(requestUrl, tokenType) {
        var self = this;
        var authToken = this.getToken(tokenType);
        return new Promise(function (resolve, reject) {

            const instance = axios({
                url: encodeURI(requestUrl),
                method: 'get',
                headers: { 'X-Riot-Token': authToken}, // , 'Origin': 'https://bedyapi.com' },
                responseType: 'json',
                transformResponse: [function (data) {
                    try {
                        if (data && data.isJSON()) {
                            // Do whatever you want to transform the data         
                            return JSON.parse(data);
                        }
                    } catch (ex) {
                        return data;
                    }
                    return data;
                }],
            }).then(response => {
                if (response.status === 200 && response.statusText === 'OK') {
                    resolve(response.data);

                } else if (response.status === 404) {
                    reject(response)
                }
            }).catch(error => {
                if (error.response.status === 404) {
                    reject(error.response);
                } else {
                    console.error(`An error occured in (static) RequestManager.ExecuteRequest(url, token).\n ${error}`);
                    reject(error);
                }
            });
        });
    }

    /**
     * Execute une requête AXIOS
     * @param {string} requestUrl 
     */
    static async ExecuteRequest(requestUrl) {
        return new Promise(function (resolve, reject) {

            const instance = axios({
                url: encodeURI(requestUrl),
                method: 'get',
                responseType: 'json',
                transformResponse: [function (data) {
                    try {
                        if (data && data.isJSON()) {
                            // Do whatever you want to transform the data         
                            return JSON.parse(data);
                        }
                    } catch (ex) {
                        return data;
                    }
                    return data;
                }],
            }).then(response => {
                if (response.status === 200 && response.statusText === 'OK') {
                    resolve(response.data);

                } else if (response.status === 404) {
                    reject(response);
                } else {
                    console.error(response.status);
                    reject(response);
                }
            }).catch(error => {
                if (error.response.status === 404) {
                    reject(error.response);
                } else {
                    console.error(`An error occured in (static) RequestManager.ExecuteRequest(url).\n ${error}`);
                    reject(error);
                }
            });
        });
    }
};

module.exports = RequestManager;