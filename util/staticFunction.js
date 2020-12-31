// var jsonConfig = require('../class/jsonConfig');
// var routeInfo = require('./info.json');
// var riotUserInfo = require('../webModule/riotUserInfo')

// const path = require('path');

'use strict';

var staticFunction = staticFunction || { };

staticFunction.request = {

    lowerQueryString: function(parameters) {
        let queryString = [];
        for (var key in parameters) {
            queryString[key.toLowerCase()] = parameters[key];
        }
        return queryString;
    },

    jsonCopy(src) {
        return JSON.parse(JSON.stringify(src));
    },

    clone(src) {
        return Object.assign({}, src);
    }
}

module.exports = staticFunction;
