#!/usr/bin/env node

// Module dependencies.
import app from '../index';
import debug from 'debug';
import http, { Server } from 'http';
import { BedyBot } from '../lib/logger';


// Initialise dotEnv
require('dotenv').config();

// Get port from environment and store in Express.
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
var server: Server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.on('error', onError);
server.on('listening', onListening);
server.listen(port, onStart);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string): any {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;

    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;

    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;

  debug('Listening on ' + bind);
}


/**
 * Event listerner OnStart
 */
function onStart() {
  var addr: any = server.address();

  var host = addr?.address;
  var port = addr?.port;

  if (host === "::") { host = "localhost"; }

  // console.log(BedyBot.logType.VERBOSE, 'Ceci est un message classique.');
  // console.log(BedyBot.logType.INFORMATION, 'Ceci est message d\'info avec argument pour "%s".', 'toto');
  // console.debug('Ceci est un message de debug.');
  // console.info('Ceci est un message d\'info.');
  // console.warn('Ceci est un message de warn.');
  // console.error('Ceci est un message d\'erreur.');


  console.log(BedyBot.logType.SERVER, `Démarrage du serveur BedyAPI (HTTP) le '${new Date().toString()}' sur: '${host}' Server : '${port}'`);
}

