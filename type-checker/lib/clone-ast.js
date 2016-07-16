'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');

module.exports = clone;

function clone(typeDefn) {
    if (typeDefn.type === 'object') {
        return JsigAST.object(typeDefn.keyValues, null, {
            brand: typeDefn.brand,
            open: typeDefn.open
        });
    } else if (typeDefn.type === 'typeLiteral') {
        return JsigAST.literal(typeDefn.name, typeDefn.builtin);
    } else if (typeDefn.type === 'unionType') {
        return JsigAST.union(typeDefn.unions);
    } else if (typeDefn.type === 'intersectionType') {
        return JsigAST.intersection(typeDefn.intersections);
    } else if (typeDefn.type === 'function') {
        return JsigAST.functionType({
            args: typeDefn.args,
            result: typeDefn.result,
            thisArg: typeDefn.thisArg,
            brand: typeDefn.brand,
            generics: typeDefn.generics
        });
    } else if (typeDefn.type === 'genericLiteral') {
        return JsigAST.generic(
            typeDefn.value,
            typeDefn.generics
        );
    } else {
        assert(false, 'not implemented clone: ' + typeDefn.type);
    }
}
