'use strict';

var typeKeyValue = require('./type-key-value.js');
var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var singleRowType = lexemes.rowTypeVariable
    .times(0, 1);

var rowType = lexemes.comma
    .then(lexemes.rowTypeVariable)
    .times(0, 1);

var typeKeyValues = join(typeKeyValue, lexemes.comma);

var typeObject = lexemes.openCurlyBrace
    .then(typeKeyValues)
    .chain(function captureValues(values) {
        var rowTypeParser = null;
        if (values.length === 0) {
            rowTypeParser = singleRowType;
        } else {
            rowTypeParser = rowType;
        }

        return rowTypeParser
            .skip(lexemes.closeCurlyBrace)
            .map(function toObject(rowTypes) {
                return AST.object(values, null, {
                    open: rowTypes.length === 1
                });
            });
    });

module.exports = typeObject;
