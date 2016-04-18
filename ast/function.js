'use strict';

var LocationLiteralNode = require('./location-literal.js');
var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');

module.exports = FunctionNode;

function FunctionNode(opts) {
    this.type = 'function';
    this.args = opts.args || [];
    this.result = opts.result;
    this.thisArg = opts.thisArg || null;
    this.label = opts.label || null;
    this.optional = opts.optional || false;
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
    var replacer = new GenericReplacer(this);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this);

    return replacer.seenGenerics;
};

function GenericReplacer(node) {
    this.node = node;

    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    this.seenGenerics.push(new LocationLiteralNode(ast.name, stack.slice()));

    ast.isGeneric = true;
    return ast;
};
