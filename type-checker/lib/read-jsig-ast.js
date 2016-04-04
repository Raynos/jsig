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

    var message = formatError(source, res);
    var error = new Error(message);
    return new Result(error, null);
}

function Result(err, value) {
    this.error = err;
    this.value = value;
}

function formatError(source, error) {
    return 'expected ' + formatExpected(error.expected) +
        formatGot(source, error);
}

function formatExpected(expected) {
    if (expected.length === 1) {
        return expected[0];
    }

    return 'one of ' + expected.join(', ');
}

function formatGot(stream, error) {
    var index = error.index;

    if (index === stream.length) {
        return ', got the end of the stream';
    }

    var prefix = (index > 0 ? '"...' : '"');
    var suffix = (stream.length - index > 12 ? '..."' : '"');

    var lines = stream.split('\n');
    var soFar = 0;
    var lineNo = 0;
    var columnNo = 0;
    for (var i = 0; i < lines.length; i++) {
        if (index < soFar + lines[i].length) {
            columnNo = index - soFar + 1;
            lineNo = i + 1;
            break;
        }

        soFar += lines[i].length + 1;
    }

    return ' at line ' + lineNo + ':' + columnNo + ' , got ' +
        prefix + stream.slice(index, index + 12) + suffix;
}
