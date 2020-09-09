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

        // this.header = {
        //     "Origin": null,
        //     "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
        //     "X-Riot-Token": `${riotToken}`,
        //     "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0"
        // }
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




        var headerContent = this.header;
        return new Promise(function (resolve, reject) {
            var options = {
                url: encodeURI(requestUrl),
                headers: headerContent,
                json: true
            };

            request.get(options, function (err, respo, data) {
                if (err) {
                    console.error(err);
                    reject(err);

                } else if (respo.statusCode === 200) {
                    resolve(data);

                } else if (respo.statusCode === 404) {
                    reject(data)

                } else {
                    reject(respo);
                }
            });
        });
    }

    static async ExecuteCustomRequest(requestUrl, header) {
        // if (typeof header === "undefined") {
        //     header = {
        //         "Origin": null,
        //         "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
        //         "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        //         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0"
        //     }
        // }

        // var token = this.auth_token;

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


        // return new Promise(function (resolve, reject) {
        //     var options = {
        //         url: encodeURI(requestUrl),
        //         headers: header,
        //         json: true
        //     };

        //     request.get(options, function (err, respo, data) {
        //         if (err) {
        //             console.error(err);
        //             reject(err);

        //         } else if (respo.statusCode === 200) {
        //             resolve(data);

        //         } else if (respo.statusCode === 404) {
        //             reject(data)

        //         } else {
        //             reject(respo);
        //         }
        //     });
        // });
    }
};

module.exports = RequestManager;