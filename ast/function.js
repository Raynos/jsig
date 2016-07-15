'use strict';

var assert = require('assert');

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
    this.brand = opts.brand || 'Object';
    this._raw = null;

    var generics = opts.generics || [];
    if (typeof generics[0] === 'string') {
        generics = this._findGenerics(generics);
    }

    this.generics = generics;
}

FunctionNode.prototype._findGenerics =
function _findGenerics(generics) {
    var replacer = new GenericReplacer(this, generics);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this);

    return replacer.seenGenerics;
};

function GenericReplacer(node, generics) {
    this.node = node;

    this.knownGenerics = generics;
    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    this.seenGenerics.push(new LocationLiteralNode(ast.name, stack.slice()));

    ast.isGeneric = true;
    return ast;
};
