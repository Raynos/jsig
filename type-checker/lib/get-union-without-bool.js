'use strict';

var JsigAST = require('../../ast/');

module.exports = getUnionWithoutBool;

function getUnionWithoutBool(type, truthy) {
    if (type.type !== 'unionType') {
        if (truthy && !isAlwaysFalsey(type)) {
            return type;
        } else if (!truthy && !isAlwaysTruthy(type)) {
            return type;
        }

        return null;
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (
            (truthy && !isAlwaysFalsey(t)) ||
            (!truthy && !isAlwaysTruthy(t))
        ) {
            unions.push(t);
        }
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

// handle more literals like 0 or "" or false
function isAlwaysTruthy(t) {
    return !(
        (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'typeLiteral' && t.name === 'String') ||
        (t.type === 'typeLiteral' && t.name === 'Boolean') ||
        (t.type === 'typeLiteral' && t.name === 'Number')
    );
}

function isAlwaysFalsey(t) {
    return (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'typeLiteral' && t.builtin &&
            t.name === '%Void%%Uninitialized'
        );
}
