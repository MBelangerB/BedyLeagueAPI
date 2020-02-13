
class Logging {

    constructor(procEnv) {
        this.isDebug = procEnv.DEBUG;
        this.LogExecuteTime = procEnv.LOG_EXECUTION_TIME;
    }

    writeLog(routeName, message, step, start) {
        if (this.isDebug && message && message.length > 0) {
            console.log(`In ${routeName}: ${message}`);
        }

        if (this.LogExecuteTime && start) {
            console.time(`Timer for ${routeName}: ${step}`);
        } else if  (this.LogExecuteTime && !start) {
            console.timeEnd(`Timer for ${routeName}: ${step}`);
        }
    } 

}

module.exports = Logging;