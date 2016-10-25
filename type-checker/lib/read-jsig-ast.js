'use strict';

/* @jsig */

var fs = require('fs');
var Parsimmon = require('parsimmon');
var program = require('../../parser/program.js');
var Errors = require('../errors.js');

readJSigAST.parseJSigAST = parseJSigAST;

module.exports = readJSigAST;

function readJSigAST(fileName) {
    if (!fs.existsSync(fileName)) {
        return new Result(null, null);
    }

    var source = fs.readFileSync(fileName, 'utf8');
    return parseJSigAST(source);
}

function parseJSigAST(source) {
    var res = program.parse(source);

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
