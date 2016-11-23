'use strict';

/* @jsig */

var Parsimmon = require('parsimmon');
var definition = require('../../parser/type-definition.js');
var Errors = require('../errors.js');

module.exports = parseJSigType;

function parseJSigType(source) {
    var res = definition.parse(source);

    if (res.status) {
        return new Result(null, res.value);
    }

    var message = Parsimmon.formatError(source, res);

    var error = Errors.CannotParseHeaderFile({
        // Should be 1 index
        line: res.index.line,
        msg: message,
        source: source
    });
    return new Result(error, null);
}

function Result(err, value) {
    this.error = err;
    this.value = value;
}
