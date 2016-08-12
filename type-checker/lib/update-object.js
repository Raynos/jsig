'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');
var cloneJSIG = require('./clone-ast.js');

module.exports = updateObject;

function updateObject(targetType, keyPath, newValue) {
    if (targetType.type === 'object') {
        return _updateObject(targetType, keyPath, newValue);
    }

    // Handle Array<X>
    if (targetType.type === 'genericLiteral' &&
        targetType.value.type === 'typeLiteral' &&
        targetType.value.name === 'Array' &&
        targetType.value.builtin
    ) {
        // We are not going to mutate the builtin array...
        return targetType;
    }

    assert(targetType.type === 'intersectionType');

    var clone = cloneJSIG(targetType);
    clone.intersections = clone.intersections.slice();
    var intersections = clone.intersections;

    var primaryKey = keyPath[0];
    var foundIndex = -1;

    for (var i = 0; i < intersections.length; i++) {
        var possibleObject = intersections[i];
        if (possibleObject.type !== 'object') {
            continue;
        }

        for (var j = 0; j < possibleObject.keyValues.length; j++) {
            var pair = possibleObject.keyValues[j];
            if (pair.key === primaryKey) {
                foundIndex = i;
                break;
            }
        }
    }

    assert(foundIndex !== -1, 'cannot updateObject() weird intersection');

    var obj = updateObject(intersections[foundIndex], keyPath, newValue);
    intersections[foundIndex] = obj;

    return clone;
}

function _updateObject(targetType, keyPath, newValue) {
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
