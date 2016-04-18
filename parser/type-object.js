'use strict';

var typeDefinition = require('./type-definition.js');
var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var objectKey = lexemes.labelName
    .skip(lexemes.labelSeperator);

var typeKeyValue = objectKey
    .chain(function captureOptional(keyName) {
        var optional = keyName[keyName.length - 1] === '?';

        if (optional) {
            keyName = keyName.substr(0, keyName.length - 1);
        }

        return typeDefinition
            .map(function toKeyValue(keyValue) {
                return AST.keyValue(keyName, keyValue, {
                    optional: optional
                });
            });
    });

var typeKeyValues = join(typeKeyValue, lexemes.comma);

var rowType = lexemes.comma
    .then(lexemes.rowTypeVariable)
    .times(0, 1);

var typeObject = lexemes.openCurlyBrace
    .then(typeKeyValues)
    .chain(function captureValues(values) {
        return rowType
            .skip(lexemes.closeCurlyBrace)
            .map(function toObject(rowTypes) {
                return AST.object(values, null, {
                    open: rowTypes.length === 1
                });
            });
    });

module.exports = typeObject;
