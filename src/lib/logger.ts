import moment from 'moment';
import chalk from 'chalk';
import util from 'node:util';

// import { Console as C1 } from 'console'; // require('node:console');

// namespace BedyBot {
// export class BedyConsole {
//     showPrefix: boolean = (((process.env.showPrefix == "1" || process.env.showPrefix?.toLowerCase() == "true") ? true : false) || true);
//     showDateTime: boolean = (((process.env.showDateTime == "1" || process.env.showDateTime?.toLowerCase() == "true") ? true : false) || true);

//     fontColor = {
//         chalkDebug: chalk.hex('##FFB52E'),
//         chalkDateTime: chalk.hex('#ADD8E6'),
//         chalkGreen: chalk.hex('#47ff51'),
//     };

//     logPrefix = {
//         verbose: chalk.white('[VERBOSE]'.padEnd(10, ' ')),
//         debug: this.fontColor.chalkDebug('[DEBUG]'.padEnd(10, ' ')),
//         info: chalk.blueBright('[INFO]'.padEnd(10, ' ')),
//         warning: chalk.yellow('[WARN]'.padEnd(10, ' ')),
//         error: chalk.red('[ERROR]'.padEnd(10, ' ')),
//         api: this.fontColor.chalkGreen('[API]'.padEnd(10, ' ')),
//         db: this.fontColor.chalkGreen('[DB]'.padEnd(10, ' ')),
//     };

//     getCurrentDateFormat(): string {
//         // TODO: Multi date format with config
//         if (this.showDateTime) {
//             return this.fontColor.chalkDateTime(moment().format('YYYY-MM-DD HH:mm:ss:SSS') + ' : ');
//         }
//         return '';
//     };

//     formatString(message: string): string {
//         const boldRegex = new RegExp('([*]{2})', 'gd');
//         const matches = message.match(boldRegex);

//         if (matches && matches.length > 0) {
//             const nbMatch = matches.length / 2;
//             let currentMatch = 0;

//             let newMessage = '';
//             let idx = 0;
//             let isComplete = false;

//             while (!isComplete) {
//                 const firstIndex = message.indexOf('**', idx);
//                 const lastIndex = message.indexOf('**', firstIndex + 1);
//                 if (firstIndex < 0) {
//                     break;
//                 }

//                 newMessage += message.substring(idx, firstIndex - idx);
//                 newMessage += chalk.bold(message.substring(firstIndex + 2, (lastIndex - (firstIndex + 2))));

//                 currentMatch += 1;
//                 if (currentMatch == nbMatch) {
//                     newMessage += message.substring(lastIndex + 2);
//                     isComplete = true;
//                 } else {
//                     newMessage += message.substring(lastIndex + 2, 0);
//                     idx = lastIndex + 2;
//                     isComplete = idx < message.length ? false : true;
//                 }
//             }

//             return newMessage;
//         }

//         return message;
//     };

//     // Step 1 : Format orignal string
//     formatOrignalString(message: string, params: any[]): string {
//         let newMessage = message;
//         if (params && params.length > 0) {
//             for (let index = 0; index < params.length; index++) {
//                 newMessage = util.format(newMessage, params[index]);
//             }
//         }
//         return newMessage;
//     };

//     // Step 2 : Add PREFIX + DateTime
//     prefixMessage(prefix: string, message: string): string {
//         const currentDateTime = this.getCurrentDateFormat();
//         const newArgs = [];

//         if (typeof message === 'string') {
//             newArgs.unshift(this.formatString(message));
//             newArgs.unshift(currentDateTime);
//             newArgs.unshift(prefix);
//         } else {
//             // This handles console.log( object )
//             // (util.inspect(message, false, null, true /* enable colors */))
//             newArgs.unshift(util.inspect(message, { showHidden: false, depth: null, colors: false }));
//             newArgs.unshift(currentDateTime);
//             newArgs.unshift(prefix);
//         }

//         return newArgs.toString().replace('/,/gi', '');
//         // return newArgs.toString().replaceAll(',', '');
//     };

//     exLog = console.log;
//     exDebug = console.debug;
//     exError = console.error;
//     exInfo = console.info;
//     exWarning = console.warn; // globalThis.console.warn;

//     log(type: BedyBot.logType, message?: any, ...params: any[]): void {
//         switch (type) {
//             case BedyBot.logType.VERBOSE: {
//                 this.exLog.apply(this, [this.prefixMessage(this.logPrefix.verbose, this.formatOrignalString(message, params))]);
//                 break;
//             }
//             case BedyBot.logType.DEBUG: {
//                 this.exDebug.apply(this, [this.prefixMessage(this.logPrefix.debug, this.formatOrignalString(message, params))]);
//                 break;
//             }
//             case BedyBot.logType.INFORMATION: {
//                 this.exInfo.apply(this, [this.prefixMessage(this.logPrefix.info, this.formatOrignalString(message, params))]);
//                 break;
//             }
//             case BedyBot.logType.WARNING: {
//                 this.exWarning.apply(this, [this.prefixMessage(this.logPrefix.warning, this.formatOrignalString(message, params))]);
//                 break;
//             }
//             case BedyBot.logType.ERROR: {
//                 this.exError.apply(this, [this.prefixMessage(this.logPrefix.error, this.formatOrignalString(message, params))]);
//                 break;
//             }

//             case BedyBot.logType.API: {
//                 this.exLog.apply(this, [this.prefixMessage(this.logPrefix.api, this.formatOrignalString(message, params))]);
//                 break;
//             }

//             case BedyBot.logType.DB: {
//                 this.exLog.apply(this, [this.prefixMessage(this.logPrefix.db, this.formatOrignalString(message, params))]);
//                 break;
//             }
//             default: {
//                 this.exLog.apply(this, [this.prefixMessage(this.logPrefix.verbose, this.formatOrignalString(message, params))]);
//                 break;
//             }
//         }
//     };

//     debug(message?: any, ...params: any[]): void {
//         return this.log(BedyBot.logType.DEBUG, message, params);
//         // exDebug.apply(this, [prefixMessage(logPrefix.debug, formatOrignalString(message, params))]);
//     };

//     info(message?: any, ...params: any[]): void {
//         return this.log(BedyBot.logType.INFORMATION, message, params);
//         // exInfo.apply(this, [prefixMessage(logPrefix.info, formatOrignalString(message, params))]);
//     };

//     warn(message?: any, ...params: any[]): void {
//         return this.log(BedyBot.logType.WARNING, message, params);
//         // exWarning.apply(this, [prefixMessage(logPrefix.warning, formatOrignalString(message, params))]);
//     };

//     error(message?: any, ...params: any[]): void {
//         return this.log(BedyBot.logType.ERROR, message, params);
//         // exError.apply(this, [prefixMessage(logPrefix.error, formatOrignalString(message, params))]);
//     };

// }

export namespace BedyBot {
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
    };
}

// var bedyConsole: BedyConsole = new BedyConsole();
// // module.exports.globalThis = bedyConsole;
// // declare var bedyConsole: BedyConsole;
// module.exports.globalThis = bedyConsole;

// module.exports.log = bedyConsole.log; // console.log;
// module.exports.debug = bedyConsole.debug;
// module.exports.warn = bedyConsole.warn;
// module.exports.info = bedyConsole.info;
// module.exports.error = bedyConsole.error;



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
const formatOrignalString = function (message: string, params: Object[]) {
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
    
        // return newArgs.toString().replace('/,/gi', '');
        // return newArgs.toString().replaceAll(',', '');       
    }
    return '';
};

// Get original logger
const exLog = console.log;
const exDebug = console.debug;
const exError = console.error;
const exInfo = console.info;
const exWarning = console.warn;

console.log = function (type: BedyBot.logType, message?: any, ...params: any[]) {
    switch (type) {
        case BedyBot.logType.VERBOSE: {
            exLog.apply(this, [prefixMessage(logPrefix.verbose, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.DEBUG: {
            exDebug.apply(this, [prefixMessage(logPrefix.debug, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.INFORMATION: {
            exInfo.apply(this, [prefixMessage(logPrefix.info, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.WARNING: {
            exWarning.apply(this, [prefixMessage(logPrefix.warning, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.ERROR: {
            exError.apply(this, [prefixMessage(logPrefix.error, formatOrignalString(message, params))]);
            break;
        }

        case BedyBot.logType.API: {
            exLog.apply(this, [prefixMessage(logPrefix.api, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.DB: {
            exLog.apply(this, [prefixMessage(logPrefix.db, formatOrignalString(message, params))]);
            break;
        }
        case BedyBot.logType.SERVER: {
            exLog.apply(this, [prefixMessage(logPrefix.server, formatOrignalString(message, params))]);
            break;
        }
        default: {
            exLog.apply(this, [prefixMessage(logPrefix.verbose, formatOrignalString(message, params))]);
            break;
        }
    }
};

console.debug = function (message?: any, ...params: any[]) {
    exDebug.apply(this, [prefixMessage(logPrefix.debug, formatOrignalString(message, params))]);
};

console.info = function (message?: any, ...params: any[]) {
    exInfo.apply(this, [prefixMessage(logPrefix.info, formatOrignalString(message, params))]);
};

console.warn = function (message?: any, ...params: any[]) {
    exWarning.apply(this, [prefixMessage(logPrefix.warning, formatOrignalString(message, params))]);
};

console.error = function (message?: any, ...params: any[]) {
    exError.apply(this, [prefixMessage(logPrefix.error, formatOrignalString(message, params))]);
};

module.exports.log = console.log;
module.exports.debug = console.debug;
module.exports.warn = console.warn;
module.exports.info = console.info;
module.exports.error = console.error;

