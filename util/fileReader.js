'use strict';

const fs = require('fs');

async function JSONFileReader(filePath) {
    const rawdata = fs.readFileSync(filePath);
    const data = JSON.parse(rawdata);
    return data;
}

async function JSONFileExist(filePath) {
    return fs.existsSync(filePath);
}

module.exports = { JSONFileReader, JSONFileExist };