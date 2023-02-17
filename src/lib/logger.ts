import moment from 'moment';
import chalk from 'chalk';
import util from 'node:util';

/* eslint-disable-next-line no-shadow */
export enum logType {
    VERBOSE = 1,
    DEBUG,
    INFORMATION,
    WARNING,
    ERROR,
    API,
    DB,
    SERVER,
    BUILD
}

const showPrefix = (process.env.showPrefix || true);
const showDateTime = (process.env.showDateTime || true);

const fontColor = {
    chalkDebug: chalk.hex('##FFB52E'),
    chalkDateTime: chalk.hex('#ADD8E6'),
    chalkGreen: chalk.hex('#47ff51'),
};

const logPrefix = {
    verbose: chalk.white('[VERBOSE]'.padEnd(10, ' ')),
    debug: fontColor.chalkDebug('[DEBUG]'.padEnd(10, ' ')),
    info: chalk.blueBright('[INFO]'.padEnd(10, ' ')),
    warning: chalk.yellow('[WARN]'.padEnd(10, ' ')),
    error: chalk.red('[ERROR]'.padEnd(10, ' ')),
    api: fontColor.chalkGreen('[API]'.padEnd(10, ' ')),
    db: fontColor.chalkGreen('[DB]'.padEnd(10, ' ')),
    server: chalk.magenta('[SERVER]'.padEnd(10, ' ')),
    build: chalk.magenta('[BUILD]'.padEnd(10, ' ')),
};

const getCurrentDateFormat = function () {
    if (showDateTime) {
        return fontColor.chalkDateTime(moment().format('YYYY-MM-DD HH:mm:ss:SSS') + ' : ');
    }
    return '';
};

const formatString = function (message: string) {
    const boldRegex = new RegExp('([*]{2})', 'gd');
    const matches = message.match(boldRegex);

    if (matches && matches.length > 0) {
        const nbMatch = matches.length / 2;
        let currentMatch = 0;

        let newMessage = '';
        let idx = 0;
        let isComplete = false;

        while (!isComplete) {
            const firstIndex = message.indexOf('**', idx);
            const lastIndex = message.indexOf('**', firstIndex + 1);
            if (firstIndex < 0) {
                break;
            }

            newMessage += message.substring(idx, firstIndex - idx);
            newMessage += chalk.bold(message.substring(firstIndex + 2, (lastIndex - (firstIndex + 2))));

            currentMatch += 1;
            if (currentMatch == nbMatch) {
                newMessage += message.substring(lastIndex + 2);
                isComplete = true;
            } else {
                newMessage += message.substring(lastIndex + 2, 0);
                idx = lastIndex + 2;
                isComplete = idx < message.length ? false : true;
            }
        }

        return newMessage;
    }

    return message;
};

// Step 1 : Format orignal string
/* eslint-disable @typescript-eslint/no-explicit-any */
const formatOrignalString = function (message: string, params: any[]) {
    let newMessage = message;
    if (params && params.length > 0) {
        for (let index = 0; index < params.length; index++) {
            newMessage = util.format(newMessage, params[index]);
        }
    }
    return newMessage;
};

// Step 2 : Add PREFIX + DateTime
const prefixMessage = function (prefix: string, message: string) {
    if (showPrefix) {
        const currentDateTime = getCurrentDateFormat();
        const newArgs = [];

        if (typeof message === 'string') {
            newArgs.unshift(formatString(message));
            newArgs.unshift(currentDateTime);
            newArgs.unshift(prefix);
        } else {
            // This handles console.log( object )
            // (util.inspect(message, false, null, true /* enable colors */))
            newArgs.unshift(util.inspect(message, { showHidden: false, depth: null, colors: false }));
            newArgs.unshift(currentDateTime);
            newArgs.unshift(prefix);
        }

        const search = ',';
        const searchRegExp = new RegExp(search, 'gi'); // Throws SyntaxError
        const replaceWith = '';

        return newArgs.toString().replace(searchRegExp, replaceWith);
    }
    return '';
};

// Get original logger
const exLog = console.log;
const exDebug = console.debug;
const exError = console.error;
const exInfo = console.info;
const exWarning = console.warn;

/* eslint-disable @typescript-eslint/no-explicit-any */
console.log = function (type: logType, message?: any, ...params: any[]) {
    switch (type) {
        case logType.VERBOSE: {
            exLog.apply(this, [prefixMessage(logPrefix.verbose, formatOrignalString(message, params))]);
            break;
        }
        case logType.DEBUG: {
            exDebug.apply(this, [prefixMessage(logPrefix.debug, formatOrignalString(message, params))]);
            break;
        }
        case logType.INFORMATION: {
            exInfo.apply(this, [prefixMessage(logPrefix.info, formatOrignalString(message, params))]);
            break;
        }
        case logType.WARNING: {
            exWarning.apply(this, [prefixMessage(logPrefix.warning, formatOrignalString(message, params))]);
            break;
        }
        case logType.ERROR: {
            exError.apply(this, [prefixMessage(logPrefix.error, formatOrignalString(message, params))]);
            break;
        }

        case logType.API: {
            exLog.apply(this, [prefixMessage(logPrefix.api, formatOrignalString(message, params))]);
            break;
        }
        case logType.DB: {
            exLog.apply(this, [prefixMessage(logPrefix.db, formatOrignalString(message, params))]);
            break;
        }
        case logType.SERVER: {
            exLog.apply(this, [prefixMessage(logPrefix.server, formatOrignalString(message, params))]);
            break;
        }
        default: {
            if (typeof(type) == "string") {
                exLog.apply(this, [prefixMessage(logPrefix.verbose, formatOrignalString(type, message))]);
            } else {
                exLog.apply(this, [prefixMessage(logPrefix.verbose, formatOrignalString(message, params))]);
            }
            break;
        }
    }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
console.debug = function (message?: any, ...params: any[]) {
    exDebug.apply(this, [prefixMessage(logPrefix.debug, formatOrignalString(message, params))]);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
console.info = function (message?: any, ...params: any[]) {
    exInfo.apply(this, [prefixMessage(logPrefix.info, formatOrignalString(message, params))]);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
console.warn = function (message?: any, ...params: any[]) {
    exWarning.apply(this, [prefixMessage(logPrefix.warning, formatOrignalString(message, params))]);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
console.error = function (message?: any, ...params: any[]) {
    exError.apply(this, [prefixMessage(logPrefix.error, formatOrignalString(message, params))]);
};

declare global {
    interface Console {
        api: (message?: any, ...params: any[]) => void
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
console.api = function (message?: any, ...params: any[]) {
    exLog.apply(this, [prefixMessage(logPrefix.api, formatOrignalString(message, params))]);
};

module.exports.log = console.log;
module.exports.debug = console.debug;
module.exports.warn = console.warn;
module.exports.info = console.info;
module.exports.error = console.error;

module.exports.api = console.api;

