'use strict';

var assert = require('assert');

module.exports = isSameType;

function isSameType(left, right) {
    if (left.type !== right.type) {
        return false;
    }

    if (left.type === 'typeLiteral') {
        return left.name === right.name;
    } else {
        assert(false, 'isSameType unexpected type: ' + left.type);
    }
}
