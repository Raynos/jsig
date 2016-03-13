'use strict';

var assert = require('assert');

var JsigAST = require('../ast.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');

module.exports = TypeInference;

function TypeInference(meta) {
    this.meta = meta;
}

TypeInference.prototype.inferType = function inferType(node) {
    if (node.type === 'CallExpression') {
        return this.inferCallExpression(node);
    } else {
        throw new Error('!! skipping inferType: ' + node.type);
    }
};

TypeInference.prototype.inferCallExpression =
function inferCallExpression(node) {
    var untypedFunc = this.meta.currentScope.getFunction(node.callee.name);
    if (!untypedFunc) {
        return null;
    }

    var args = node.arguments;

    var argTypes = [];
    for (var i = 0; i < args.length; i++) {
        argTypes.push(this.meta.verifyNode(args[i]));
    }

    var returnType = JsigAST.literal('void');
    if (this.meta.currentScope.currentAssignmentType) {
        returnType = this.meta.currentScope.currentAssignmentType;
    }

    // TODO: infer this arg based on method calls
    var funcType = JsigAST.functionType({
        args: argTypes,
        result: returnType,
        thisArg: null,
        label: node.callee.name,
        optional: false
    });

    var token = this.meta.currentScope.updateFunction(
        node.callee.name, funcType
    );
    return token.defn;
};

TypeInference.prototype.resolveGeneric =
function resolveGeneric(funcType, node) {
    assert(node.type === 'CallExpression',
        'can only resolve generic with callee node');

    var genericReplacer = new JsigASTGenericTable(this.meta, funcType, node);
    var replacer = new JsigASTReplacer(genericReplacer);

    var copyFunc = JSON.parse(JSON.stringify(funcType));
    copyFunc = replacer.inlineReferences(copyFunc, funcType);

    return copyFunc;
};

function JsigASTGenericTable(meta, funcType, node) {
    this.meta = meta;
    this.funcType = funcType;
    this.node = node;
    this.knownGenerics = {};
    this.knownGenericTypes = {};

    for (var i = 0; i < funcType.generics.length; i++) {
        this.knownGenerics[funcType.generics[i].name] = true;
    }
}

JsigASTGenericTable.prototype.replace = function replace(ast, rawAst, stack) {
    assert(this.knownGenerics[ast.name], 'literal must be a known generic');

    var newType;
    var referenceNode;
    if (stack[0] === 'args') {
        referenceNode = this.node.arguments[stack[1]];
        newType = this.meta.verifyNode(referenceNode);
        newType = walkProps(newType, stack, 2);
    } else if (stack[0] === 'thisArg') {
        referenceNode = this.node.callee.object;
        // TODO: this might be wrong
        newType = this.meta.verifyNode(referenceNode);
        newType = walkProps(newType, stack, 1);
    } else {
        referenceNode = this.node;
        newType = this.knownGenericTypes[ast.name];
        assert(newType, 'newType must exist in fallback');
    }

    if (this.knownGenericTypes[ast.name]) {
        var isSub = this.meta.isSubType(
            referenceNode, this.knownGenericTypes[ast.name], newType
        );
        if (!isSub) {
            isSub = this.meta.isSubType(
                referenceNode, newType, this.knownGenericTypes[ast.name]
            );
            this.knownGenericTypes[ast.name] = newType;
        }
        if (!isSub) {
            // TODO: bug and shit
            assert(false, 'could not resolve generics');
        }
    } else {
        this.knownGenericTypes[ast.name] = newType;
    }

    rawAst._raw = newType;

    return newType;
};

function walkProps(object, stack, start) {
    for (var i = start; i < stack.length; i++) {
        object = object[stack[i]];
    }
    return object;
}
