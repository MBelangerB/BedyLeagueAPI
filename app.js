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

/* Middleware */
app.use(logger('[:date[iso]] :method :url :status :res[content-length] - :response-time ms')); /* TODO: Valider le type */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Cors configuration */
//TODO: Whitelist in config
var allowlist = ['http://bedyapi.com', 'https://bedyapi.com', 'localhost', 'localhost:4200', 'http://localhost:4200'];

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

/* Dragon Load on start */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    let dragLoad = new dragonLoading();
    await dragLoad.loadChampion('fr_fr').then(async function (result) {
        if (result) {
            await dragLoad.convertToLeagueChampion('fr_fr');
        }
    });
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

app.get('/:lang?/lol/rank', rankRouter.rank);
app.get('/:lang?/lol/rank/:region/:summonerName', rankRouter.rank);

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
    next(createError(404));
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
