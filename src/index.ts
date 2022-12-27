import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import logger from 'morgan';
import path from 'path';
import helmet from 'helmet';

// Custom Import
import { NodeEnvs } from './declarations/enum';
import EnvVars from './declarations/major/EnvVars';
import './lib/logger';
import { BedyBot } from './lib/logger';

dotenv.config();

// Importer router
import mainRouter from './routes/main';
import dragonRouter from './routes/global/dragon-routes';

// **** Init express **** //
const app = express();

// **** Set basic express settings **** //

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // app.use(cookieParser(EnvVars.cookieProps.secret));

// Set static directory
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

/* Compress all routes */
app.use(compression());

/* Cors configuration */
// FrontEnd Address
const allowlist = ['http://bedyapi.com', 'https://bedyapi.com', 'http://localhost:4200', 'http://localhost:8080',
                    'http://web.bedyapi.com', 'https://web.bedyapi.com'];

const corsOptions = {
    origin: (origin : any, callback : any) => {
        if (allowlist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('401'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders:'Content-Type, Authorization, Origin, X-Requested-With, Accept',
};

// Init Morgan Logger
logger.token('host', function (req: Request) {
    return req.hostname;
});
logger.token('origin', function (req: Request) {
    return req.header('Origin');
});
logger.token('liveBot', function (req: Request) {
    let bot = '';
    try {
        if (req.header('user-agent')?.toLocaleLowerCase().includes('nightbot-url-fetcher')) {
            bot = 'NightBot';
        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('wizebot')) {
            bot = 'WizeBot';
        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamelements')) {
            bot = 'StreamElements';
        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamlabs')) {
            bot = 'StreamLabs';
        }
    } catch {
        // do nothing
    }
    return bot;
});

// Show routes called in console during development
if (EnvVars.nodeEnv === NodeEnvs.Dev) {
    app.use(logger('dev'));
} else {
    app.use(logger('[:date[iso]] :method - (:liveBot, Host :host) - :url :status :res[content-length] - :response-time ms'));
}

// Security
if (EnvVars.nodeEnv === NodeEnvs.Production) {
    app.use(helmet());
}

// **** Add API routes **** //3
app.use('/', mainRouter.homeRouter);
app.use(dragonRouter.modulePath, mainRouter.dragonRouter);

// catch 404 and forward to error handler
app.use(function (req, res) {
    console.log(BedyBot.logType.SERVER, "Route '%s' has not found.", req?.url);
    res.status(404).send('404 - Not found');
});

// error handler
app.use(function (err : any, req : Request, res : Response) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (err.message == '401') {
        // render the error page
        res.status(401).send('Unauthorized');
    } else {
        const returnMessage = `Error ${err.status} \n ${err.message}`;
        console.error(err);

        // render the error page
        res.status(err.status || 500);
        res.send(returnMessage);
    }
});

// **** Export default **** //
export default app;
