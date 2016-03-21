'use strict';

var fs = require('fs');
var program = require('../../parser/program.js');
var Parsimmon = require('parsimmon');

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
    var error = new Error(message);
    return new Result(error, null);
}

function Result(err, value) {
    this.error = err;
    this.value = value;
}
