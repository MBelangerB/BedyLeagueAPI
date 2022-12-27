import express from 'express';
import dragon from './global/dragon-routes';

// **** Setup Homes routes **** //
const homeRouter = express.Router();

homeRouter.get('/', function(req, res) {
  res.redirect('https://bedyapi.com');
});

// **** Setup Dragon routes **** //
const dragonRouter = express.Router();

dragonRouter.get(dragon.routes.HOME, function (req, res) {
  res.redirect(dragon.getPath(dragon.routes.GET_VERSION));
});

dragonRouter.get(dragon.routes.GET_VERSION, function (req, res) {
  return dragon.getCurrentVersion(req, res)
});

dragonRouter.get(dragon.routes.UPDATE, function (req, res) {
  return dragon.updateDragon(req, res)
});


// **** Export default **** //
export default { 
    homeRouter,
    dragonRouter
}
