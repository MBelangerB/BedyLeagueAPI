var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./util/Prototype');


var indexRouter = require('./routes/index');
var dragonsRouter = require('./routes/dragon');
/* League of Legend */

/* OW */
var overwatchRouter = require('./routes/ow/rank');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Load complet route
app.use('/', indexRouter);
app.use('/dragon', dragonsRouter);


// Overwatch Route
app.get('/:lang?/ow/rank', overwatchRouter.rank);
app.get('/:lang?/ow/rank/:region/:platform/:tag', overwatchRouter.rank);

module.exports = app;
