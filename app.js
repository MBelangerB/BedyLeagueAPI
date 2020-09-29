var express = require('express');
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

/* OW Route */
var overwatchRouter = require('./routes/ow/rank');

var app = express();

/* Middleware */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/* Dragon Load on start */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    let dragLoad = new dragonLoading();
    await dragLoad.loadChampion('fr_fr').then(async function(result) {
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

module.exports = app;
