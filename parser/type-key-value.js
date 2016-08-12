'use strict';

var typeDefinition = require('./type-definition.js');
var lexemes = require('./lexemes.js');
var AST = require('../ast/');

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

module.exports = typeKeyValue;
