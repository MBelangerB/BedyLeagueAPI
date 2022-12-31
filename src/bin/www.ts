#!/usr/bin/env node

// Module dependencies.
import main from '../index';
import debug from 'debug';
import http, { Server } from 'http';
import { logType } from '../lib/logger';
import EnvVars from '../declarations/major/EnvVars';


// Get port from environment and store in Express.
const port = EnvVars.port; // normalizePort(process.env.PORT || '3000');
main.app.set('port', port);

/**
 * Create HTTP server.
 */
const server: Server = http.createServer(main.app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.on('error', onError);
server.on('listening', onListening);
server.listen(port, onStart);


/**
 * Event listener for HTTP server "error" event.
 */

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

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
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;

  debug('Listening on ' + bind);
}


/**
 * Event listerner OnStart
 */
function onStart() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const addr: any = server.address();

  let cHost = addr?.address;
  const cPort = addr?.port;

  if (cHost === '::') { cHost = 'localhost'; }

  // console.log(BedyBot.logType.VERBOSE, 'Ceci est un message classique.');
  // console.log(BedyBot.logType.INFORMATION, 'Ceci est message d\'info avec argument pour "%s".', 'toto');
  // console.debug('Ceci est un message de debug.');
  // console.info('Ceci est un message d\'info.');
  // console.warn('Ceci est un message de warn.');
  // console.error('Ceci est un message d\'erreur.');


  console.log(logType.SERVER, `Démarrage du serveur BedyAPI (HTTP) le '${new Date().toString()}' sur: '${cHost}' Server : '${cPort}'`);
}

