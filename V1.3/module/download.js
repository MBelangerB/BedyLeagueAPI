const { parse } = require('url')
const http = require('https')
const fs = require('fs')
const { basename } = require('path')

const TIMEOUT = 10000
// https://gist.github.com/falkolab/f160f446d0bda8a69172
module.exports = function(url, path) {
  const uri = parse(url)
  if (!path) {
    path = basename(uri.path)
  }
  const file = fs.createWriteStream(path)

  return new Promise(function(resolve, reject) {
    const request = http.get(uri.href).on('response', function(res) {
      const len = parseInt(res.headers['content-length'], 10)
      let downloaded = 0;
      let percent = 0;

      let JData = {

      };

      res.on('data', function(chunk) {
          file.write(chunk)
          downloaded += chunk.length
          percent = (100.0 * downloaded / len).toFixed(2)
          process.stdout.write(`Downloading ${percent}% ${downloaded} ebytes\r`)
        })
        .on('end', function() {
          file.end()
          console.log(`${uri.path} downloaded to: ${path}`)
          resolve()
        })
        .on('error', function (err) {
          reject(err)
        })
      
        fs.readFile(path, function read(err, data) {
          if (err) {
              throw err;
          }
          const content = data;
      
          // Invoke the next step here however you like
          console.log(content);   // Put all of the code here (not the best solution)
          processFile(content);   // Or put the next step in a function and invoke it
        });
        
    })

    request.setTimeout(TIMEOUT, function() {
      request.abort()
      reject(new Error(`request timeout after ${TIMEOUT / 1000.0}s`))
    })

    function processFile(content) {
      console.log(content);
  }
  })
}