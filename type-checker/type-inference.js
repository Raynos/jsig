'use strict';

var assert = require('assert');

var JsigAST = require('../ast.js');
var isSameType = require('./lib/is-same-type.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');

module.exports = TypeInference;

function TypeInference(meta) {
    this.meta = meta;
}

TypeInference.prototype.inferType = function inferType(node) {
    if (node.type === 'CallExpression') {
        return this.inferCallExpression(node);
    } else if (node.type === 'Literal') {
        return this.inferLiteral(node);
    } else if (node.type === 'ArrayExpression') {
        return this.inferArrayExpression(node);
    } else if (node.type === 'ObjectExpression') {
        return this.inferObjectExpression(node);
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
        var funcArg = this.meta.verifyNode(args[i]);
        if (!funcArg) {
            return null;
        }

        argTypes.push(funcArg);
    }

    var returnType = JsigAST.literal('%Void%%UnknownReturn', true);
    if (this.meta.currentScope.getAssignmentType()) {
        returnType = this.meta.currentScope.getAssignmentType();
    } else if (this.meta.currentScope.getReturnExpressionType()) {
        returnType = this.meta.currentScope.getReturnExpressionType();
    }

    // TODO: infer this arg based on method calls
    var funcType = JsigAST.functionType({
        args: argTypes,
        result: returnType,
        thisArg: null,
        label: node.callee.name,
        optional: false
    });

    var t = this.meta.currentScope.getFunction(node.callee.name);
    var token = this.meta.currentScope.updateFunction(
        node.callee.name, funcType
    );

    if (returnType.builtin && returnType.name === '%Void%%UnknownReturn') {
        // Snap into scope of function decl
        var oldScope = this.meta.currentScope;
        this.meta.currentScope = t.currentScope;
        // Evaluate func decl
        this.meta.verifyNode(t.node);
        this.meta.currentScope = oldScope;

        // Grab the scope for the known function
        var funcScope = this.meta.currentScope.getKnownFunctionInfo(
            node.callee.name
        ).funcScope;

        if (funcScope.knownReturnType) {
            funcType.result = funcScope.knownReturnType;
        }
    }

    return token.defn;
};

TypeInference.prototype.inferLiteral =
function inferLiteral(node) {
    var value = node.value;

    if (typeof value === 'string') {
        return JsigAST.literal('String');
    } else if (typeof value === 'number') {
        return JsigAST.literal('Number');
    } else if (value === null) {
        return JsigAST.value('null');
    } else if (Object.prototype.toString.call(value) === '[object RegExp]') {
        return JsigAST.literal('RegExp');
    } else if (typeof value === 'boolean') {
        return JsigAST.literal('Boolean');
    } else {
        throw new Error('not recognised literal');
    }
};

TypeInference.prototype.inferArrayExpression =
function inferArrayExpression(node) {
    var elems = node.elements;

    if (elems.length === 0) {
        return JsigAST.literal('%Array%%Empty', true);
    }

    var type = null;
    for (var i = 0; i < elems.length; i++) {
        var newType = this.meta.verifyNode(elems[i]);
        if (type) {
            assert(isSameType(newType, type), 'arrays must be homogenous');
        }
        type = newType;
    }

    if (!type) {
        return null;
    }

    return JsigAST.generic(JsigAST.literal('Array'), [type]);
};

TypeInference.prototype.inferObjectExpression =
function inferObjectExpression(node) {
    var properties = node.properties;

    if (properties.length === 0) {
        return JsigAST.object([]);
    }

    var keyValues = [];
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        assert(prop.kind === 'init', 'only support init kind');

        var value = this.meta.verifyNode(prop.value);
        assert(value, 'expect value expression to have types');
        keyValues.push(JsigAST.keyValue(prop.key.name, value));
    }

    return JsigAST.object(keyValues);
};

TypeInference.prototype.resolveGeneric =
function resolveGeneric(funcType, node) {
    assert(node.type === 'CallExpression',
        'can only resolve generic with callee node');

    var genericReplacer = new JsigASTGenericTable(this.meta, funcType, node);
    var replacer = new JsigASTReplacer(genericReplacer, true);

    var copyFunc = JSON.parse(JSON.stringify(funcType));
    copyFunc._raw = null;
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
        var oldType = this.knownGenericTypes[ast.name];
        var subTypeError = this.meta.checkSubTypeRaw(
            referenceNode, oldType, newType
        );

        if (subTypeError) {
            var isSub = this.meta.isSubType(
                referenceNode, newType, oldType
            );
            if (isSub) {
                this.knownGenericTypes[ast.name] = newType;
                subTypeError = null;
            }
        }
        if (subTypeError) {
            this.meta.addError(subTypeError);
            // return null;
            // TODO: bug and shit
            // assert(false, 'could not resolve generics');
        }
    } else {
        this.knownGenericTypes[ast.name] = newType;
    }

    return newType;
};

function walkProps(object, stack, start) {
    for (var i = start; i < stack.length; i++) {
        object = object[stack[i]];
    }
    return object;
}
