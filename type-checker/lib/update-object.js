'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');

module.exports = updateObject;

function updateObject(targetType, keyPath, newValue) {
    assert(targetType.type === 'object', 'targetType must be object');
    assert(newValue, 'newValue cannot be null');

    var pairs = [];
    var addedField = false;
    for (var i = 0; i < targetType.keyValues.length; i++) {
        var pair = targetType.keyValues[i];
        var fieldName = keyPath[0];

        if (pair.key !== fieldName) {
            pairs.push(JsigAST.keyValue(pair.key, pair.value));
            continue;
        }

        var fieldValue;
        if (keyPath.length === 1) {
            fieldValue = newValue;
        } else {
            fieldValue = updateObject(pair.value, keyPath.slice(1), newValue);
        }

        addedField = true;
        pairs.push(JsigAST.keyValue(pair.key, fieldValue));
    }

    if (!addedField) {
        assert(keyPath.length === 1, 'keyPath must be shallow');
        pairs.push(JsigAST.keyValue(keyPath[0], newValue));
    }

    return JsigAST.object(pairs);
}
