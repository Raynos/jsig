'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');

module.exports = clone;

function clone(typeDefn) {
    if (typeDefn.type === 'object') {
        return JsigAST.object(typeDefn.keyValues, typeDefn.label, {
            optional: typeDefn.optional,
            brand: typeDefn.brand,
            open: typeDefn.open
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
    } else if (typeDefn.type === 'function') {
        return JsigAST.functionType({
            args: typeDefn.args,
            result: typeDefn.result,
            thisArg: typeDefn.thisArg,
            label: typeDefn.label,
            brand: typeDefn.brand,
            optional: typeDefn.optional,
            generics: typeDefn.generics
        });
    } else if (typeDefn.type === 'genericLiteral') {
        return JsigAST.generic(
            typeDefn.value,
            typeDefn.generics,
            typeDefn.label
        );
    } else {
        assert(false, 'not implemented clone: ' + typeDefn.type);
    }
}
