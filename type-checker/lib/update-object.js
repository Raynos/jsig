'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');
var cloneJSIG = require('./clone-ast.js');
var isSameType = require('./is-same-type.js');
var computeSmallestUnion = require('./compute-smallest-union.js');

var VALID_MODES = ['narrowType', 'overwriteType'];

module.exports = TypeUpdater;

function TypeUpdater(meta, mode) {
    if (VALID_MODES.indexOf(mode) === -1) {
        assert(false, 'invalid mode: ' + mode);
    }

    this.meta = meta;
    this.mode = mode;
}

TypeUpdater.prototype.updateObject =
function updateObject(targetType, keyPath, newValue) {
    if (targetType.type === 'object') {
        return this._updateObject(targetType, keyPath, newValue);
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
        return this._updateTuple(targetType, keyPath, newValue);
    }

    if (targetType.type === 'intersectionType') {
        return this._updateIntersection(targetType, keyPath, newValue);
    }

    if (targetType.type === 'unionType') {
        return this._updateUnion(targetType, keyPath, newValue);
    }

    assert(false, 'unsupported type for updateObject(): ' + targetType.type);
};

function containsType(type, needleType) {
    if (isSameType(type, needleType)) {
        return true;
    }

    if (type.type === 'unionType') {
        for (var i = 0; i < type.unions.length; i++) {
            var p = type.unions[i];
            if (containsType(p, needleType)) {
                return true;
            }
        }
    }

    return false;
}

TypeUpdater.prototype._updateUnion =
function _updateUnion(targetType, keyPath, newValue) {
    var oldUnions = targetType.unions;
    var unions = [];

    for (var i = 0; i < oldUnions.length; i++) {
        var possibleType = oldUnions[i];

        // scan each value in the union
        // and only keep it if the keypath contains the newValue
        // aka if we update({ foo: String } | { foo: null }, ['foo'], null)
        // then we want to keep { foo: null }

        var currentValue = this._findObject(possibleType, keyPath);
        if (!currentValue) {
            continue;
        }

        // When we narrow a type then we must filter down a union
        // to only the unions where typeof x[keyPath] === newValue.
        if (this.mode === 'narrowType' && isSameType(currentValue, newValue)) {
            unions.push(possibleType);
        } else if (this.mode === 'narrowType' &&
            containsType(currentValue, newValue)
        ) {
            // overwrite what's effectively a union at keyPath to
            // just the concrete value.
            var newObj = this.updateObject(possibleType, keyPath, newValue);
            unions.push(newObj);
        }

        // When we overwrite a type then we mutate all of the permutations
        // of the union overwrite them to contain a new field x[keyPath]
        // whos type is newValue.
        // This is only valid for values in the union which have the field
        // in the first place, aka the field is only capable of being
        // overwriten if it exists
        if (this.mode === 'overwriteType') {
            newObj = this.updateObject(possibleType, keyPath, newValue);
            unions.push(newObj);
        }
    }

    // It's possible that updating a union based on narrowing
    // type information that we filter down to zero cases
    // which means we will return the type Never.
    if (this.mode === 'narrowType' && unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }
    // TODO: passing `node` into this is weird.
    return computeSmallestUnion(null, JsigAST.union(unions));
};

TypeUpdater.prototype._findObject =
function _findObject(targetType, keyPath) {
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
                fieldValue = this._findObject(pair.value, keyPath.slice(1));
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
};

TypeUpdater.prototype._updateIntersection =
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

    var obj = this.updateObject(
        intersections[foundIndex], keyPath, newValue
    );
    intersections[foundIndex] = obj;

    return clone;
};

TypeUpdater.prototype._updateTuple =
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
};

TypeUpdater.prototype._updateObject =
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
            fieldValue = this.updateObject(
                pair.value, keyPath.slice(1), newValue
            );
        }

        addedField = true;
        pairs.push(JsigAST.keyValue(pair.key, fieldValue));
    }

    if (!addedField) {
        assert(keyPath.length === 1, 'keyPath must be shallow');
        pairs.push(JsigAST.keyValue(keyPath[0], newValue));
    }

    // Sanity check for duplicate keys; should not happen.
    var seenKeys = [];
    for (i = 0; i < pairs.length; i++) {
        var keypair = pairs[i];
        if (seenKeys.indexOf(keypair.key) > -1) {
            assert(false, 'found duplicate key: ' + keypair.key +
                ' in updateObject()');
        }
        seenKeys.push(keypair.key);
    }

    return JsigAST.object(pairs, null, {
        inferred: targetType.inferred,
        brand: targetType.brand,
        open: targetType.open
    });
};
