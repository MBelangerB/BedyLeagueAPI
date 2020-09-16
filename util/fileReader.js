'use strict';

const fs = require('fs');

async function JSONFileReader(filePath) {
    let rawdata = fs.readFileSync(filePath);
    let data = JSON.parse(rawdata);
    return data;
}



module.exports = { JSONFileReader };
