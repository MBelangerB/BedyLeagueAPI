var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./util/Prototype');

/* Base Route */
var indexRouter = require('./routes/index');
var dragonsRouter = require('./routes/dragon');
/* League of Legend Route */
var leagueRouter = require('./routes/lol/league');

/* OW Route */
var overwatchRouter = require('./routes/ow/rank');

var app = express();

/* Middleware */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Temp */
const dragonLoading = require('./controller/dragonLoading');
app.use(async function (req, res, next) {
    let dragLoad = new dragonLoading();
    await dragLoad.loadChampion('fr_fr').then(async function(result) {
        if (result) {
            await dragLoad.convertToLeagueChampion('fr_fr');
        }
    });
    // TODO: Au lieu de charger le data JSON (dragon) en mémoire. Effectuer toute suite la conversation en LeagueChampion et stocker en mémoire
    next();
});

// Load complet route
app.use('/', indexRouter);
app.use('/dragon', dragonsRouter);

// League route
app.get('/:lang?/lol/rotate', leagueRouter.rotate);
app.get('/:lang?/lol/rotate/:region', leagueRouter.rotate);

// Overwatch Route
app.get('/:lang?/ow/rank', overwatchRouter.rank);
app.get('/:lang?/ow/rank/:region/:platform/:tag', overwatchRouter.rank);

module.exports = app;
