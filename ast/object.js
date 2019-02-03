'use strict';

/* @jsig */

var assert = require('assert');

var KeyValueNode = require('./key-value.js');

module.exports = ObjectNode;

function ObjectNode(keyValues, label, opts) {
    assert(!label, 'cannot have label on object');
    assert(!(opts && opts.optional), 'cannot have optional on object');

    var keyValuesArray = null;

    if (!Array.isArray(keyValues)) {
        keyValuesArray = convertToKeyValues(keyValues);
    } else {
        keyValuesArray = keyValues;
    }

    this.type = 'object';
    this.keyValues = keyValuesArray;
    this.open = (opts && opts.open) || false;
    this.brand = (opts && opts.brand) || 'Object';
    this.inferred = (opts && 'inferred' in opts) ?
        opts.inferred : false;
    this._raw = null;
}

ObjectNode.prototype.buildObjectIndex =
function buildObjectIndex(index) {
    index = index || Object.create(null);

    for (var i = 0; i < this.keyValues.length; i++) {
        var pair = this.keyValues[i];
        index[pair.key] = pair.value;
    }

    return index;
};

ObjectNode.prototype.overwriteKey =
function overwriteKey(keyName, newValueType) {
    var foundPair = null;
    for (var i = 0; i < this.keyValues.length; i++) {
        if (this.keyValues[i].key === keyName) {
            foundPair = this.keyValues[i];
            break;
        }
    }

    if (foundPair) {
        foundPair.value = newValueType;
    } else {
        this.keyValues.push(
            new KeyValueNode(keyName, newValueType)
        );
    }
};

function convertToKeyValues(keyValuesObj) {
    var keyValues = [];
    var keys = Object.keys(keyValuesObj);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        keyValues.push(new KeyValueNode(key, keyValuesObj[key]));
    }

    return keyValues;
}
