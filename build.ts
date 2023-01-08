/**
 * Remove old files, copy front-end ones.
 */

import fs from 'fs-extra';
// import logger from 'jet-logger';
import childProcess from 'child_process';

import './src/lib/logger';
// import { BedyBot } from './src/lib/logger';

/**
 * Start
 */
(async () => {
  try {
    // Remove current build
    await remove('./dist/');

    // Copy front-end files
    await copy('./src/db', './dist/db');
    // await copy('./src/views', './dist/views');

    // Copy back-end files
    await exec('tsc --build tsconfig.prod.json', './');


    // Create basic folder
    // await createFolder('./dist/static');
    // await copy('./src/static/info.json', './dist/static/info.json');

  } catch (err) {
    console.error(err);
    // logger.err(err);
  }
})();

/**
 * Remove file
 */
function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err) => {
      return (err ? rej(err) : res());
    });
  });
}

/**
 * Create Folder
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createFolder(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.mkdir(loc, (err) => {
      return (err ? rej(err) : res());
    });
  });
}

/**
 * Copy file.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function copy(src: string, dest: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.copy(src, dest, (err) => {
      return (err ? rej(err) : res());
    });
  });
}

/**
 * Do command line command.
 */
function exec(cmd: string, loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (stdout) {
        // logger.info(stdout);
        console.info(stdout);
      }
      if (stderr) {
        // logger.warn(stderr);
        console.warn(stderr);
      }
      return (err ? rej(err) : res());
    });
  });
}
