// var request = require('request');
var axios = require('axios'); // .default;

class RequestManager {

    constructor(data) {
        this.summonerName = data.summonerName;
        this.region = data.region;

        let riotToken = `${process.env.lolKey}`;
        if (data.queueType === "tft") {
            riotToken = `${process.env.tftKey}`;
        }
        this.auth_token = riotToken;
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
                headers: { 'X-Riot-Token': token },
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

    static async ExecuteCustomRequest(requestUrl, header) {
        return new Promise(function (resolve, reject) {
  
            const instance = axios({
                url: requestUrl,
                method: 'get',
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
};

module.exports = RequestManager;