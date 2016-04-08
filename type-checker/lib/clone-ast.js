'use strict';

var assert = require('assert');

var JsigAST = require('../../ast.js');

module.exports = clone;

function clone(typeDefn) {
    if (typeDefn.type === 'object') {
        return JsigAST.object(typeDefn.keyValues, typeDefn.label, {
            optional: typeDefn.optional
        });
    } else if (typeDefn.type === 'typeLiteral') {
        return JsigAST.literal(typeDefn.name, typeDefn.builtin, {
            label: typeDefn.label,
            optional: typeDefn.optional
        });
    } else if (typeDefn.type === 'unionType') {
        return JsigAST.union(typeDefn.unions, typeDefn.label, {
            optional: typeDefn.optional
        });
    } else {
        assert(false, 'not implemented clone: ' + typeDefn.type);
    }
}
