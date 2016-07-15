'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');

var typeLiteral = Parsimmon.seqMap(
    Parsimmon.index,

    lexemes.rawTypeName,

    Parsimmon.index
        .skip(Parsimmon.optWhitespace),

    function toLiteral(startIndex, type, endIndex) {
        var loc = {
            start: {
                column: startIndex.column - 1,
                line: startIndex.line
            },
            end: {
                column: endIndex.column - 1,
                line: endIndex.line
            }
        };

        return AST.literal(type, undefined, {
            loc: loc,
            line: startIndex.line
        });
    }
);

module.exports = typeLiteral;
