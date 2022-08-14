var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./util/Prototype');

//Loads the handlebars module
const hbs = require('express-handlebars');
const hbshelpers = require('handlebars-helpers');
const multihelpers = hbshelpers();

/* Base Route */
var indexRouter = require('./routes/index');
var dragonsRouter = require('./routes/dragon');

/* League of Legend Route */
var rankRouter = require('./routes/lol/rank');
var leagueRouter = require('./routes/lol/league');
var summonerRouter = require('./routes/lol/summoner');

/* API Route */
var overlayRouter = require('./routes/api/overlay');
var extensionRouter = require('./routes/api/extension');

/* Twitch Route */
var twitchRouter = require('./routes/twitch/eventsub')

/* OW Route */
var overwatchRouter = require('./routes/ow/rank');

/* Initialize Express */
var app = express();

/* View */
app.engine('hbs', hbs({
    helpers: {
      GreaterThanZero: function(x) { (x > 0); }
    },
    defaultLayout: 'layout',
    extname: 'hbs',
    layoutsDir: path.join(__dirname,'/views/layouts/'),
    partialsDir : path.join(__dirname, '/views/partials/')
  }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
  

/* Middleware */
app.use(logger('[:date[iso]] :method "":url" :status :res[content-length] - :response-time ms - :remote-addr')); /* TODO: Valider le type */
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // false
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/emblems', express.static('static/images/emblems'))



// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');



/* Dragon Load on start */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    if (req.url.includes('overlay')) { 
        console.log('dragon loading');

        let dragLoad = new dragonLoading();
        await dragLoad.loadChampion('fr_fr').then(async function (result) {
            if (result) {
                await dragLoad.convertToLeagueChampion('fr_fr');
            }
        });
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

app.get('/:lang?/lol/rank', rankRouter.rank);
app.get('/:lang?/lol/rank/:region/:summonerName', rankRouter.rank);

// Api Route
app.get('/:lang?/overlay/rank', overlayRouter.rank);
app.get('/:lang?/overlay/rank/:region/:summonerName', overlayRouter.rank);

// Overwatch Route
app.get('/:lang?/ow/rank', overwatchRouter.rank);
app.get('/:lang?/ow/rank/:region/:platform/:tag', overwatchRouter.rank);

// Temporary redirection
app.get('/rank', rankRouter.rank);
app.get('/v2/rank', rankRouter.rank);

// Twitch
// app.get('/twitch/eventSub', twitchRouter.eventSub);
// app.post('/twitch/eventSub', twitchRouter.eventSub);

// Navigator Extension
// app.post('/api/register', extensionRouter.registerAPI);
// app.post('/api/register/:username/:token', extensionRouter.registerAPI);
// app.put('/api/song/:token', extensionRouter.addSong);
// app.get('/api/song/:token', extensionRouter.getLastSong);
// app.delete('/api/song/:token', extensionRouter.clearPlaylist);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
