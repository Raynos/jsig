'use strict';

var assert = require('assert');

module.exports = isSameType;

/*eslint complexity: 0*/
function isSameType(left, right) {
    if (left.type !== right.type) {
        return false;
    }

    var i = 0;

    if (left.type === 'typeLiteral') {
        return left.name === right.name;
    } else if (left.type === 'object') {
        if (left.keyValues.length !== right.keyValues.length) {
            return false;
        }

        for (i = 0; i < left.keyValues.length; i++) {
            var l = left.keyValues[i];
            var r = right.keyValues[i];

            if (l.key !== r.key) {
                return false;
            }

            if (!isSameType(l.value, r.value)) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'genericLiteral') {
        if (!isSameType(left.value, right.value)) {
            return false;
        }

        if (left.generics.length !== right.generics.length) {
            return false;
        }

        for (i = 0; i < left.generics.length; i++) {
            if (!isSameType(left.generics[i], right.generics[i])) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'unionType') {
        if (left.unions.length !== right.unions.length) {
            return false;
        }

        for (i = 0; i < left.unions.length; i++) {
            if (!isSameType(left.unions[i], right.unions[i])) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'valueLiteral') {
        return left.name === right.name;
    } else {
        assert(false, 'isSameType unexpected type: ' + left.type);
    }
}
