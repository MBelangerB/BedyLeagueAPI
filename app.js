var createError = require('http-errors');
var express = require('express');
var cors = require('cors')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./util/Prototype');

/* Base Route */
var indexRouter = require('./routes/index');
var dragonsRouter = require('./routes/dragon');

/* League of Legend Route */
var rankRouter = require('./routes/lol/rank');
var leagueRouter = require('./routes/lol/league');
var summonerRouter = require('./routes/lol/summoner');

/* API Route */
var emailRouteur = require('./routes/api/email');

/* OW Route */
var overwatchRouter = require('./routes/ow/rank');

/* Initialize Express */
var app = express();

/* Add morgan token */
logger.token('host', function(req, res) {
    return req.hostname;
});
logger.token('origin', function(req, res) {
    return req.header('Origin');
});
logger.token('liveBot', function(req, res) {
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
//TODO: Whitelist in config
// FrontEnd Address
var allowlist = ['http://bedyapi.com', 'https://bedyapi.com',
                'http://localhost:4200', 'http://localhost:8080', 
                'http://web.bedyapi.com', 'https://web.bedyapi.com'];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowlist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('401'))
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders:'Content-Type, Authorization, Origin, X-Requested-With, Accept'
}

/* Identify Bot */
// app.use(async function (req, res, next) {
//     try {
//         // [ "x-forwarded-for" ]
//         if (req.header('user-agent')?.toLocaleLowerCase().includes('nightbot-url-fetcher')) {
//             // ["nightbot-channel", "nightbot-response-url","nightbot-user","user-agent"]
//            console.info('NightBot')
//         } else if (req.header('user-agent')?.toLocaleLowerCase().includes('wizebot')) {
//             // ["x-wizebot-channel-twitchid","x-wizebot-channel-twitchname","user-agent"]
//             console.info('WizeBot')

//         } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamelements')) {
//             // [ "x-streamelements-channel", "user-agent"]
//             console.info('StreamElements')

//         } else if (req.header('user-agent')?.toLocaleLowerCase().includes('streamlabs')) {
//             // [ "x-channel",, "user-agent" ]
//             console.info('StreamLabs')
//         }
//     } catch (ex) {
//         // Do nothing
//         console.log('Error occured during bot identification')
//     }
//     next();
// });


/* Dragon Load on start */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    try {
        let dragLoad = new dragonLoading();
        await dragLoad.loadChampion('fr_fr').then(async function (result) {       
            if (result) {
                await dragLoad.convertToLeagueChampion('fr_fr');
            }
        });
    } catch (ex) {
        console.log('do nothing')
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
app.get('/:lang?/lol/rank/:region/:summonerName',cors(), rankRouter.rank);

// Overwatch Route
app.get('/:lang?/ow/rank', overwatchRouter.rank);
app.get('/:lang?/ow/rank/:region/:platform/:tag', overwatchRouter.rank);

// Temporary redirection
// TODO: Remove
app.get('/rank', rankRouter.rankRework);
app.get('/v2/rank', rankRouter.rankRework);

// Private API routing
// app.options('/api/sendEmail', cors())
app.options('*', cors()) // include before other routes
app.post('/api/sendEmail', cors(corsOptions), emailRouteur.sendMail);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404).send('404 - Not found');
});

// error handler
app.use(function (err, req, res, next) {
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
