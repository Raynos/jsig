'use strict';

var uuid = require('uuid');
var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');

module.exports = TypeDeclarationNode;

function TypeDeclarationNode(identifier, expr, generics) {
    generics = generics || [];

    this.type = 'typeDeclaration';
    this.identifier = identifier;
    this.typeExpression = expr;
    this._raw = null;

    if (generics.length > 0) {
        this._markGenerics(generics);
    }
    this.generics = generics;
}

TypeDeclarationNode.prototype._markGenerics =
function _markGenerics(generics) {
    var genericNames = [];
    for (var i = 0; i < generics.length; i++) {
        genericNames.push(generics[i].name);
    }

    var replacer = new GenericReplacer(this, genericNames);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this);
};

function GenericReplacer(node, genericNames) {
    this.node = node;

    this.knownGenerics = genericNames;
    this.genericUUIDs = Object.create(null);
    for (var i = 0; i < this.knownGenerics.length; i++) {
        this.genericUUIDs[this.knownGenerics[i]] = uuid();
    }
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    ast.isGeneric = true;
    ast.genericIdentifierUUID = this.genericUUIDs[ast.name];
    return ast;
};
