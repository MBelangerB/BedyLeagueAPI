'use strict';

const staticFunction = {};

staticFunction.request = {

    lowerQueryString: function(parameters) {
        const queryString = [];
        for (const key in parameters) {
            queryString[key.toLowerCase()] = parameters[key];
        }
        return queryString;
    },

    parseUrlParameters: function (params, query) {
        const queryString = this.lowerQueryString(query);
        return Object.assign({}, params, queryString);
    },

    jsonCopy(src) {
        return JSON.parse(JSON.stringify(src));
    },

    clone(src) {
        return Object.assign({}, src);
    },
};

module.exports = staticFunction;
