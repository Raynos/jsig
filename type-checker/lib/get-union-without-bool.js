'use strict';

var JsigAST = require('../../ast/');

module.exports = getUnionWithoutBool;

function getUnionWithoutBool(type, truthy) {
    if (type.type !== 'unionType') {
        if (truthy && isBoolean(type)) {
            return JsigAST.value('true', 'boolean');
        } else if (!truthy && isBoolean(type)) {
            return JsigAST.value('false', 'boolean');
        } else if (truthy && !isAlwaysFalsey(type)) {
            return type;
        } else if (!truthy && !isAlwaysTruthy(type)) {
            return type;
        }

        return JsigAST.literal('Never', true);
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

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function isBoolean(t) {
    return t.type === 'typeLiteral' &&
        t.name === 'Boolean' && t.builtin;
}

// handle more literals like 0 or "" or false
function isAlwaysTruthy(t) {
    return !(
        (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'valueLiteral' &&
            t.name === 'boolean' && t.value === 'false'
        ) ||
        (t.type === 'typeLiteral' && t.name === 'String') ||
        (t.type === 'typeLiteral' && t.name === 'Boolean') ||
        (t.type === 'typeLiteral' && t.name === 'Number')
    );
}

function isAlwaysFalsey(t) {
    return (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'typeLiteral' && t.builtin &&
            t.name === 'Never'
        ) ||
        (t.type === 'typeLiteral' && t.builtin &&
            t.name === '%Void%%Uninitialized'
        ) ||
        (t.type === 'valueLiteral' &&
            t.name === 'boolean' && t.value === 'false'
        );
}
