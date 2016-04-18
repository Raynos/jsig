'use strict';

var lexemes = require('./lexemes.js');
var AST = require('../ast/');

var typeLiteral = lexemes.typeName
    .map(function toLiteral(type) {
        return AST.literal(type);
    });

module.exports = typeLiteral;
