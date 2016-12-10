'use strict';

var AST = require('../ast/');
var lexemes = require('./lexemes.js');
var statement = require('./statement.js');

var line = lexemes.optWhitespace
    .then(statement)
    .skip(lexemes.optWhitespace);

var program = line.many().map(function toProgram(statements) {
    return AST.program(statements);
});

module.exports = program;
