'use strict';

/* !@jsig */

var uuid = require('uuid');
var assert = require('assert');

var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');
var LocationLiteralNode = require('./location-literal.js');

module.exports = TypeDeclarationNode;

function TypeDeclarationNode(identifier, expr, generics) {
    generics = generics || [];

    this.type = 'typeDeclaration';
    this.identifier = identifier;
    this.typeExpression = expr;
    this._raw = null;

    this.generics = generics;

    if (generics.length > 0) {
        this.seenGenerics = this._markGenerics(generics);
    } else {
        this.seenGenerics = [];
    }
}

TypeDeclarationNode.prototype._markGenerics =
function _markGenerics(generics) {
    var genericNames = [];
    for (var i = 0; i < generics.length; i++) {
        genericNames.push(generics[i].name);
    }

    // console.log('_markGenerics()', this.identifier);

    var replacer = new GenericReplacer(this, genericNames);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this, []);

    return replacer.seenGenerics;
};

function GenericReplacer(node, genericNames) {
    this.node = node;

    this.knownGenerics = genericNames;
    this.genericUUIDs = Object.create(null);
    for (var i = 0; i < this.knownGenerics.length; i++) {
        this.genericUUIDs[this.knownGenerics[i]] = uuid();
    }
    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, raw, stack);
    } else if (ast.type === 'genericLiteral') {
        // TODO: mark the generics in the genericLiteral itself ?
        return ast;
    } else {
        assert(false, 'unexpected other type: ' + ast.type);
    }
};

GenericReplacer.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, raw, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    // console.log('markLiteral(' + stack + ')', ast.name);

    var identifierUUID = this.genericUUIDs[ast.name];
    this.seenGenerics.push(
        new LocationLiteralNode(ast.name, stack.slice(), identifierUUID)
    );

    ast.isGeneric = true;
    ast.genericIdentifierUUID = identifierUUID;
    return ast;
};
