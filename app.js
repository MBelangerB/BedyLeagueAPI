const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const compression = require('compression');
require('./util/Prototype');

/* Base Route */
const indexRouter = require('./routes/index');
const dragonsRouter = require('./routes/dragon');

/* League of Legend Route */
const rankRouter = require('./routes/lol/rank');
const leagueRouter = require('./routes/lol/league');
const summonerRouter = require('./routes/lol/summoner');

/* API Route */
const emailRouteur = require('./routes/api/email');
const validateCaptchaRouteur = require('./routes/api/validateCaptcha');

/* OW Route */
const overwatchRouter = require('./routes/ow/rank');

/* Initialize Express */
const app = express();

/* Compress all routes */
// app.use(compression());

/* Add morgan token */
logger.token('host', function(req) {
    return req.hostname;
});
logger.token('origin', function(req) {
    return req.header('Origin');
});
logger.token('liveBot', function(req) {
    let bot = '';
    try {
        if (req.header('user-agent')?.toLocaleLowerCase().includes('nightbot-url-fetcher')) {
            // ["nightbot-channel", "nightbot-response-url","nightbot-user","user-agent"]
            bot = 'NightBot';
        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('wizebot')) {
            // ["x-wizebot-channel-twitchid","x-wizebot-channel-twitchname","user-agent"]
            bot = 'WizeBot';

        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamelements')) {
            // [ "x-streamelements-channel", "user-agent"]
            bot = 'StreamElements';

        } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamlabs')) {
            // [ "x-channel",, "user-agent" ]
            bot = 'StreamLabs';
        }
    } catch {
        // do nothing
    }
    return bot;
});

/* Middleware */
/* Origin (:origin)  */
// app.use(logger('[:date[iso]] :method - :liveBot Remote (:remote-addr) Host (:host) - :url :status :res[content-length] - :response-time ms'));
app.use(logger('[:date[iso]] :method - (:liveBot, Host :host) - :url :status :res[content-length] - :response-time ms'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Cors configuration */
// TODO: Whitelist in config
// FrontEnd Address
const allowlist = ['http://bedyapi.com', 'https://bedyapi.com',
                'http://localhost:4200', 'http://localhost:8080',
                'http://web.bedyapi.com', 'https://web.bedyapi.com'];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowlist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('401'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders:'Content-Type, Authorization, Origin, X-Requested-With, Accept',
};

/* Dragon Load on start */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    try {
        const dragLoad = new dragonLoading();
        await dragLoad.loadChampion('fr_fr').then(async function (result) {
            if (result) {
                await dragLoad.convertToLeagueChampion('fr_fr');
            }
        });
    } catch (ex) {
        console.log('do nothing');
    }
    next();
});

// Load default route
app.use('/', indexRouter);
app.use('/dragon', dragonsRouter);

// League route
app.get('/:lang?/lol/rotate', leagueRouter.rotate);
app.get('/:lang?/lol/rotate/:region', leagueRouter.rotate);
app.get('/:lang?/lol/topMasteries', summonerRouter.topMasteries);
app.get('/:lang?/lol/topMasteries/:region/:summonerName', summonerRouter.topMasteries);
app.get('/:lang?/lol/summonerInfo', summonerRouter.summonerInfo);
app.get('/:lang?/lol/summonerInfo/:region/:summonerName', summonerRouter.summonerInfo);

app.get('/:lang?/lol/rank', cors(), rankRouter.rank);
app.get('/:lang?/lol/rank/:region/:summonerName', cors(), rankRouter.rank);

// Overwatch Route
app.get('/:lang?/ow/rank', overwatchRouter.rank);
app.get('/:lang?/ow/rank/:region/:platform/:tag', overwatchRouter.rank);

// Temporary redirection
// TODO: Remove
app.get('/rank', rankRouter.rankRework);
app.get('/v2/rank', rankRouter.rankRework);

// Private API routing
// app.options('/api/sendEmail', cors())
app.options('*', cors()); // include before other routes
app.post('/api/sendEmail', cors(corsOptions), emailRouteur.sendMail);
app.post('/api/validateReCAPTCHA', cors(corsOptions), validateCaptchaRouteur.validateReCAPTCHA);

// catch 404 and forward to error handler
app.use(function (req, res) {
    res.status(404).send('404 - Not found');
});

// error handler
app.use(function (err, req, res) {
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

module.exports = app;
