class userConfig {
    constructor() {
      //do nothing
    }
      
    async getAllConfig(req, res, next) {
        try {
            Logging.writeLog('/getAllConfig', `Execute getAllConfig`, 'getAllConfig', true);
    
            var fpath = path.join(__dirname + '/config/client.json')
            var config = new jsonConfig(fpath);
            var data;
            await config.loadData().then(function (sumData) {
                data = sumData
            });
    
            Logging.writeLog('/getAllConfig', ``, 'getAllConfig', false);
            res.json(data);
        } catch (ex) {
            console.error(ex);
            res.send(ex);
        }

      next();
    };

  }