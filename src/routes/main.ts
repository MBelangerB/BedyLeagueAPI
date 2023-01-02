import express from 'express';
import cors from 'cors';
import jetValidator from 'jet-validator';

import dragon_routes from './global/dragon-routes';
import lol_routes from './global/lol-routes';

// **** Déclaration **** //
const validate = jetValidator();

// **** Setup Homes routes **** //
const homeRouter = express.Router();

homeRouter.get('/', function (req, res) {
  res.redirect('https://bedyapi.com');
});

// **** Setup Dragon routes **** //
const dragonRouter = express.Router();

dragonRouter.get(dragon_routes.routes.HOME, function (req, res) {
  res.redirect(dragon_routes.getPath(dragon_routes.routes.GET_VERSION));
});

dragonRouter.get(dragon_routes.routes.GET_VERSION, function (req, res) {
  return dragon_routes.getCurrentVersion(req, res);
});

dragonRouter.get(dragon_routes.routes.UPDATE, function (req, res) {
  return dragon_routes.updateDragon(req, res);
});

// **** Setup League of Legend routes **** //
const lolRouter = express.Router();

lolRouter.get(lol_routes.routes.RANK, cors(), function (req, res) {
  return lol_routes.getRank(req, res);
});

lolRouter.get(lol_routes.routes.ROTATE_PARAMS,
  validate(['region', 'string', 'params']),
  function (req, res) {
    return lol_routes.getRotate(req, res);
  });

lolRouter.get(lol_routes.routes.ROTATE,
  validate(['region', 'string', 'query']),
  function (req, res) {
    return lol_routes.getRotate(req, res);
  });

lolRouter.get(lol_routes.routes.SUMMONER_INFO_PARAMS,
  validate(['region', 'string', 'params'], ['summonerName', 'string', 'params']),
  function (req, res) {
    return lol_routes.getSummonerInfo(req, res);
  });

lolRouter.get(lol_routes.routes.SUMMONER_INFO,
  validate(['region', 'string', 'query'], ['summonerName', 'string', 'query']),
  function (req, res) {
    return lol_routes.getSummonerInfo(req, res);
  });



// **** Export default **** //
export default {
  homeRouter,
  dragonRouter,
  lolRouter,
};
