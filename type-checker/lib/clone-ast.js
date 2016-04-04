'use strict';

var assert = require('assert');

var JsigAST = require('../../ast.js');

module.exports = clone;

function clone(typeDefn) {
    if (typeDefn.type === 'object') {
        return JsigAST.object(typeDefn.keyValues, typeDefn.label, {
            optional: typeDefn.optional
        });
    } else {
        assert(false, 'not implemented clone: ' + typeDefn.type);
    }
}
