'use strict';

var fs = require('fs');
var TypedError = require('error/typed');
var program = require('../../parser/program.js');
var Parsimmon = require('parsimmon');

var MissingHeaderFile = TypedError({
    type: 'jsig.missing.header-file',
    message: 'Could not find header file: {fileName}',
    fileName: null
});

module.exports = readJSigAST;

function readJSigAST(fileName) {
    if (!fs.exists(fileName)) {
        return new Result(MissingHeaderFile({
            fileName: fileName
        }), null);
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
