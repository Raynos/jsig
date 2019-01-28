'use strict';

/* @jsig */

var assert = require('assert');
var uuid = require('uuid');

var LiteralTypeNode = require('./literal.js');
var LocationLiteralNode = require('./location-literal.js');
var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');

module.exports = FunctionNode;

function FunctionNode(opts) {
    assert(!(opts && opts.label), 'cannot have label on function');
    assert(!(opts && opts.optional), 'cannot have optional on function');

    this.type = 'function';
    this.args = opts.args || [];
    this.result = opts.result;
    this.thisArg = opts.thisArg || null;
    // Brand is used if this function is a constructor
    // This will brand the object instance allocated with `new`
    this.brand = opts.brand || 'Object';
    // specialKind is used to store singleton information
    // For example the assert function has special type narrow
    // semantics so its FunctionNode is the "assert" specialKind
    this.specialKind = opts.specialKind || null;
    this.inferred = (opts && 'inferred' in opts) ?
        opts.inferred : false;
    this._raw = null;

    if (opts.generics && typeof opts.generics[0] === 'string') {
        /*jsig ignore next: narrowing by array member not implemented*/
        this.generics = this._findGenerics(opts.generics);
    } else {
        this.generics = [];
    }
}

FunctionNode.prototype._findGenerics =
function _findGenerics(generics) {
    // console.log('_findGenerics', generics);
    var replacer = new GenericReplacer(this, generics);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this, []);

    // console.log('seenGenerics?', replacer.seenGenerics);
    return replacer.seenGenerics;
};

function GenericReplacer(node, generics) {
    this.node = node;

    this.knownGenerics = generics;
    this.genericUUIDs = Object.create(null);
    for (var i = 0; i < this.knownGenerics.length; i++) {
        this.genericUUIDs[this.knownGenerics[i]] = uuid();
    }
    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, stack);
    } else if (ast.type === 'genericLiteral') {
        // TODO: mark the generics in the genericLiteral itself ?
        return ast;
    } else {
        assert(false, 'unexpected other type: ' + ast.type);
    }
};

GenericReplacer.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    var identifierUUID = this.genericUUIDs[ast.name];
    this.seenGenerics.push(
        new LocationLiteralNode(ast.name, stack.slice(), identifierUUID)
    );

    var copyAst = new LiteralTypeNode(ast.name, ast.builtin, {
        line: ast.line,
        loc: ast.loc,
        concreteValue: ast.concreteValue
    });

    copyAst.isGeneric = true;
    copyAst.genericIdentifierUUID = identifierUUID;
    return copyAst;
};
