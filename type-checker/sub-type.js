'use strict';

var TypedError = require('error/typed');
var assert = require('assert');

var serialize = require('../serialize.js');

var TypeClassMismatch = TypedError({
    type: 'jsig.sub-type.type-class-mismatch',
    message: '@{line}: Got unexpected type class. ' +
        'Expected {expected} but got {actual}',
    expected: null,
    actual: null,
    loc: null,
    line: null
});

module.exports = SubTypeChecker;

function SubTypeChecker() {
}

SubTypeChecker.prototype.checkSubType =
function checkSubType(node, parent, child) {
    assert(node && node.type, 'ast node must have type');
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');

    if (parent.type === 'typeLiteral') {
        return this.checkTypeLiteralSubType(node, parent, child);
    } else if (parent.type === 'genericLiteral') {
        return this.checkGenericLiteralSubType(node, parent, child);
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }
};

SubTypeChecker.prototype.checkTypeLiteralSubType =
function checkTypeLiteralSubType(node, parent, child) {
    if (!parent.builtin) {
        throw new Error('not implemented, sub type for non-builtin');
    }

    if (parent.name === 'Any:ModuleExports') {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        return new Error('expected type literal');
    }

    var name = parent.name;
    if (name === 'Object') {
        if (child.name !== name) {
            return new Error('[Internal] Not an object');
        }
    } else if (name === 'Array') {
        if (child.name !== name) {
            return new Error('[Internal] Not an array');
        }
    } else if (name === 'String') {
        if (child.name !== name) {
            return new Error('[Internal] Not a string');
        }
    } else {
        // console.warn('wat', parent);
        throw new Error('NotImplemented');
    }
};

SubTypeChecker.prototype.checkGenericLiteralSubType =
function checkGenericLiteralSubType(node, parent, child) {
    if (child.type !== 'genericLiteral') {
        return reportTypeMisMatch(node, parent, child);
    }

    var err = this.checkSubType(node, parent.value, child.value);
    if (err) {
        return err;
    }

    if (parent.generics.length !== child.generics.length) {
        throw new Error('generics mismatch');
    }

    for (var i = 0; i < parent.generics.length; i++) {
        err = this.checkSubType(
            node, parent.generics[i], child.generics[i]
        );
        if (err) {
            return reportTypeMisMatch(node, parent, child);
        }
    }

    return null;
};

function reportTypeMisMatch(node, parent, child) {
    return TypeClassMismatch({
        expected: serialize(parent),
        actual: serialize(child),
        loc: node.loc,
        line: node.loc.start.line
    });
}
