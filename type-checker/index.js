'use strict';

var esprima = require('esprima');
var fs = require('fs');

var ProgramMeta = require('./meta.js');

module.exports = typeCheck;

function typeCheck(fileName) {
    var source = fs.readFileSync(fileName, 'utf8');
    var ast = esprima.parse(source, {
        loc: true
    });
    var meta = new ProgramMeta(ast, fileName, source);

    meta.verify();

    return meta;
}

