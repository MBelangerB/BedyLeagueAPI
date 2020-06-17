var request = require('request');

class RequestManager {

    constructor(data) {
        this.summonerName = data.summonerName;
        this.region = data.region;

        this.header = {
            "Origin": null,
            "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Riot-Token": `${process.env.apiKey}`,
            "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0"
        }
    }

    /*
        Methode base pour executer Query
    */
    async ExecuteRequest(requestUrl) {
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
        if (typeof header === "undefined") {
            header = {
                "Origin": null,
                "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
                "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0"
            }
        }

        return new Promise(function (resolve, reject) {
            var options = {
                url: encodeURI(requestUrl),
                headers: header,
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
};

module.exports = RequestManager;