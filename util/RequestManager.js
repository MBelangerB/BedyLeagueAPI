
var axios = require('axios');

class RequestManager {

    constructor(data) {
        /*
        this.summonerName = data.summonerName;
        this.region = data.region;

        let riotToken = `${process.env.lolKey}`;
        if (data.queueType === "tft") {
            riotToken = `${process.env.tftKey}`;
        }
        this.auth_token = riotToken;
        */
    }

    /*
        Methode base pour executer Query
    */
    async ExecuteRequest(requestUrl) {
        var token = this.auth_token;

        return new Promise(function (resolve, reject) {
  
            const instance = axios({
                url: encodeURI(requestUrl),
                method: 'get',
                headers: { 'X-Riot-Token': token, 'Origin': 'https://bedyapi.com' },
                responseType: 'json',
                transformResponse: [function (data) {
                    // Do whatever you want to transform the data         
                    return JSON.parse(data);
                }],
            }).then(response => {
                if (response.status === 200 && response.statusText === 'OK') {
                    resolve(response.data);

                } else if (response.status === 404) {
                    reject(response)
                }
            }).catch(error => {
                console.error(error);
                reject(error);
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
                    console.error(`An error occured in (static) RequestManager.ExecuteRequest.\n ${error}`);
                    reject(error);
                }
            });
        });
    }
};

module.exports = RequestManager;