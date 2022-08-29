var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('https://bedyapi.com'); //TODO: Replace by ENV.VAR
});

module.exports = router;
