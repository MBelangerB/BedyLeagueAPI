
var moment = require('moment');

class Logging {

    constructor(procEnv) {
        if (procEnv) {
            this.isDebug = procEnv.DEBUG;
            this.LogExecuteTime = procEnv.LOG_EXECUTION_TIME;
        } else {
            this.isDebug = false;
            this.LogExecuteTime = false;
        }
      

    }

    writeLog(routeName, message, step, start) {
        var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");
        var strLog = [`[${currentDateTime}] - `];
       

        if (this.isDebug && message && message.length > 0) {
            strLog.push(`In ${routeName}: ${message}`);
        }

        if (this.LogExecuteTime) {
            if (start) {
                console.time(`Timer start for ${routeName}: ${step}`);
            } else if (!start) {
                console.timeEnd(`Timer end for ${routeName}: ${step}`);
            }
        }

        console.log(strLog.join(' '));
    } 

}

module.exports = Logging;