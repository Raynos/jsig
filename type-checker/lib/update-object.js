'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');
var cloneJSIG = require('./clone-ast.js');
var isSameType = require('./is-same-type.js');

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

    if (targetType.type === 'tuple') {
        return _updateTuple(targetType, keyPath, newValue);
    }

    if (targetType.type === 'intersectionType') {
        return _updateIntersection(targetType, keyPath, newValue);
    }

    if (targetType.type === 'unionType') {
        return _updateUnion(targetType, keyPath, newValue);
    }

    assert(false, 'unsupported type for updateObject(): ' + targetType.type);
}

function _updateUnion(targetType, keyPath, newValue) {
    var clone = cloneJSIG(targetType);
    var unions = clone.unions = [];

    for (var i = 0; i < unions.length; i++) {
        var possibleType = unions[i];

        var currentValue = findObject(possibleType, keyPath);
        if (isSameType(currentValue, newValue)) {
            unions.push(possibleType);
        }

        // var newType = updateObject(possibleType, keyPath, newValue);
        // unions[i] = newType;
    }

    return clone;
}

function findObject(targetType, keyPath) {
    if (targetType.type === 'object') {
        for (var i = 0; i < targetType.keyValues.length; i++) {
            var pair = targetType.keyValues[i];
            var fieldName = keyPath[0];

            if (pair.key !== fieldName) {
                continue;
            }

            var fieldValue;
            if (keyPath.length === 1) {
                fieldValue = pair.value;
            } else {
                fieldValue = findObject(pair.value, keyPath.slice(1));
            }

            return fieldValue;
        }

        return null;
    } else if (targetType.type === 'tuple') {
        var index = keyPath[0];

        assert(keyPath.length === 1, 'only support trivial keyPath');
        assert(typeof index === 'number', 'must be numeric index');
        assert(index >= 0 && index <= targetType.values.length,
            'index must be within values of tuple');

        return targetType.values[index];
    } else {
        assert(false, 'unsupported type for findObject(): ' +
            targetType.type);
    }
}

function _updateIntersection(targetType, keyPath, newValue) {
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

        // TODO: only narrows the first type found
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

function _updateTuple(targetType, keyPath, newValue) {
    assert(targetType.type === 'tuple', 'targetType must be tuple');
    assert(newValue, 'newValue cannot be null');

    var newValues = targetType.values.slice();
    var index = keyPath[0];

    assert(keyPath.length === 1, 'only support trivial keyPath');
    assert(typeof index === 'number', 'must be numeric index');
    assert(index >= 0 && index <= newValues.length,
        'index must be within values of tuple');

    newValues[index] = newValue;

    return JsigAST.tuple(newValues, null, {
        inferred: targetType.inferred
    });
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
