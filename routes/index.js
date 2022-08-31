const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
 // TODO: Replace by ENV.VAR
  res.redirect('https://bedyapi.com');
});

module.exports = router;
