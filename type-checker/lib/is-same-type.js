'use strict';

var assert = require('assert');

module.exports = isSameType;

/*eslint complexity: 0, max-statements: [2,80]*/
function isSameType(left, right) {
    if (left === right) {
        return true;
    }

    if (
        (right && left === null) ||
        (left && right === null)
    ) {
        return false;
    }

    if (left.type !== right.type) {
        // console.log('EARLY BAIL');
        return false;
    }

    var i = 0;

    if (left.type === 'typeLiteral') {
        if (left.name !== right.name) {
            // console.log('LITERAL MISMATCH');
            return false;
        }

        return true;
    } else if (left.type === 'object') {
        if (left.keyValues.length !== right.keyValues.length) {
            // console.log('OBJECT KEYS');
            return false;
        }

        for (i = 0; i < left.keyValues.length; i++) {
            var l = left.keyValues[i];
            var r = right.keyValues[i];

            if (l.key !== r.key) {
                // console.log('WEIRD KEYS');
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
            // console.log('GENERICS KEYS');
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
            // console.log('UNIONS WEIRD');
            return false;
        }

        // TODO: order-ness...
        for (i = 0; i < left.unions.length; i++) {
            if (!isSameType(left.unions[i], right.unions[i])) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'intersectionType') {
        if (left.intersections.length !== right.intersections.length) {
            return false;
        }

        // TODO: order-ness
        for (i = 0; i < left.intersections.length; i++) {
            if (!isSameType(
                left.intersections[i], right.intersections[i]
            )) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'valueLiteral') {
        if (left.value !== right.value) {
            // console.log('VALUE WEIRD');
            return false;
        }

        return true;
    } else if (left.type === 'function') {
        if (left.args.length !== right.args.length) {
            // console.log('ARGS WEIRD');
            return false;
        }

        for (i = 0; i < left.args.length; i++) {
            if (!isSameType(left.args[i], right.args[i])) {
                return false;
            }
        }

        if (!isSameType(left.thisArg, right.thisArg)) {
            return false;
        }

        if (!isSameType(left.result, right.result)) {
            return false;
        }

        return true;
    } else if (left.type === 'param') {
        // left.name, names can be different
        if (!isSameType(left.value, right.value)) {
            return false;
        }

        // Optional must be same
        if (left.optional !== right.optional) {
            return false;
        }

        return true;
    } else if (left.type === 'tuple') {
        if (left.values.length !== right.values.length) {
            return false;
        }

        for (i = 0; i < left.values.length; i++) {
            if (!isSameType(left.values[i], right.values[i])) {
                return false;
            }
        }

        return true;
    } else {
        assert(false, 'isSameType unexpected type: ' + left.type);
    }
}
