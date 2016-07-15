'use strict';

var assert = require('assert');

var KeyValueNode = require('./key-value.js');

module.exports = ObjectNode;

function ObjectNode(keyValues, label, opts) {
    assert(!label, 'cannot have label on object');
    assert(!(opts && opts.optional), 'cannot have optional on object');

    if (!Array.isArray(keyValues)) {
        keyValues = convertToKeyValues(keyValues);
    }

    this.type = 'object';
    this.keyValues = keyValues;
    this.open = (opts && opts.open) || false;
    this.brand = (opts && opts.brand) || 'Object';
    this._raw = null;
}

function convertToKeyValues(keyValuesObj) {
    var keyValues = [];
    var keys = Object.keys(keyValuesObj);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        keyValues.push(new KeyValueNode(key, keyValuesObj[key]));
    }

    return keyValues;
}
