const axios = require('axios');

class RequestManager {

    static TokenType = {
        TFT: 'TFT',
        LOL: 'LOL',
    };

    static getToken(tokenType) {
        let token;
        switch (tokenType) {
            case this.TokenType.TFT:
                token = `${process.env.tftKey}`;
                break;

            case this.TokenType.LOL:
                token = `${process.env.lolKey}`;
                break;

            default:
                // token = '';
                // TODO: Add TokenType (SummonerInfo)
                token = `${process.env.lolKey}`;
                break;
        }
        return token;
    }

    /*
        Methode base pour executer Query.
    */
    static async ExecuteTokenRequest(requestUrl, tokenType) {
        const authToken = this.getToken(tokenType);
        return new Promise(function (resolve, reject) {

            // HEADER ==> , 'Origin': 'https://bedyapi.com' },
            axios({
                url: encodeURI(requestUrl),
                method: 'get',
                headers: { 'X-Riot-Token': authToken },
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
                }
            }).catch(error => {
                if (error.response.status === 404 || error.response.status === 403) {
                    reject(error.response);
                } else {
                    console.error(`An error occured in (base static) RequestManager.ExecuteRequest(url, token).\n ${error}`);
                    reject(error);
                }
            });
        });
    }

    /**
     * Execute une requête AXIOS
     * @param {string} requestUrl
     */
    static async ExecuteRequest(requestUrl, method = 'get', responseType = 'json') {
        return new Promise(function (resolve, reject) {

            axios({
                url: encodeURI(requestUrl),
                method: method,
                responseType: responseType,
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
                    console.error(`An error occured in (Axios static) RequestManager.ExecuteRequest(url).\n ${error}`);
                    reject(error);
                }
            });
        });
    }


        /*
            Methode base pour executer Query.
        */
        static async ExecuteRequest(requestUrl, headers, bodyData, method = 'get', responseType = 'json') {
            console.info(requestUrl);

            return new Promise(function (resolve, reject) {

                axios({
                    url: encodeURI(requestUrl),
                    method: method,
                    headers: headers,
                    data: bodyData,
                    responseType: responseType,
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
                    }
                }).catch(error => {
                    if (error.response.status === 404 || error.response.status === 403) {
                        reject(error.response);
                    } else {
                        console.error(`An error occured in (base static) RequestManager.ExecuteRequest(url, token).\n ${error}`);
                        reject(error);
                    }
                });
            });
        }
}

module.exports = RequestManager;