import express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('https://bedyapi.com');
});

export default router;
