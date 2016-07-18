'use strict';

var copy = require('universal-copy');

module.exports = deepClone;

function deepClone(ast) {
    return copy(ast);
}
