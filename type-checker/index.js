'use strict';

var esprima = require('esprima');
var fs = require('fs');

var ProgramMeta = require('./meta.js');

module.exports = typeCheck;

function typeCheck(fileName) {
    var ast = readEsprimaAST(fileName);
    var meta = new ProgramMeta(ast, fileName);

    meta.verify();

    return meta;
}

function readEsprimaAST(fileName) {
    var source = fs.readFileSync(fileName, 'utf8');

    return esprima.parse(source);
}
