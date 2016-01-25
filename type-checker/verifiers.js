'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

/*eslint no-console: 0*/
var assert = require('assert');
// var console = require('console');

var JsigAST = require('../ast.js');

module.exports = {
    'Program': verifyProgram,
    'FunctionDeclaration': verifyFunctionDeclaration,
    'BlockStatement': verifyBlockStatement,
    'ExpressionStatement': verifyExpressionStatement,
    'AssignmentExpression': verifyAssignmentExpression,
    'MemberExpression': verifyMemberExpression,
    'ThisExpression': verifyThisExpression,
    'Identifier': verifyIdentifier,
    'Literal': verifyLiteral
};

function verifyFunctionDeclaration(node, meta) {
    var funcName = node.id.name;

    var token = meta.currentScope.getVar(funcName);
    if (!token) {
        throw new Error('type inference not supported');
    }

    meta.enterFunctionScope(node, token.defn);
    meta.verifyNode(node.body);
    meta.exitFunctionScope();
}

function verifyProgram(node, meta) {
    node.body = hoistFunctionDeclaration(node.body);

    meta.setModuleExportsNode(node);
    meta.loadHeaderFile();

    for (var i = 0; i < node.body.length; i++) {
        meta.verifyNode(node.body[i]);
    }
}

function verifyBlockStatement(node, meta) {
    for (var i = 0; i < node.body.length; i++) {
        meta.verifyNode(node.body[i]);
    }
}

function verifyExpressionStatement(node, meta) {
    meta.verifyNode(node.expression);
}

function verifyAssignmentExpression(node, meta) {
    var leftType = meta.verifyNode(node.left);
    var rightType = meta.verifyNode(node.right);

    var maybeErr = meta.checkSubType(leftType, rightType);
    if (maybeErr) {
        meta.addError(maybeErr);
        return null;
    }

    if (leftType.name === 'Any:ModuleExports') {
        meta.setModuleExportsType(rightType);
    }

    return rightType;
}

function verifyMemberExpression(node, meta) {
    var objType = meta.verifyNode(node.object);
    var propName = node.property.name;

    var valueType = findPropertyInType(objType, propName);
    if (!valueType) {
        throw new Error('could not find prop in object');
    }

    return valueType;
}

function verifyThisExpression(node, meta) {
    if (meta.currentScope.type !== 'function') {
        throw new Error('cannot access `this` outside function');
    }

    if (!meta.currentScope.thisValueType) {
        throw new Error('cannot type inference for `this`');
    }

    return meta.currentScope.thisValueType;
}

function verifyIdentifier(node, meta) {
    var token = meta.currentScope.getVar(node.name);
    if (!token) {
        throw new Error('could not resolve Identifier: ' + node.name);
    }

    return token.defn;
}

function verifyLiteral(node, meta) {
    var value = node.value;

    if (typeof value === 'string') {
        return JsigAST.literal('String');
    } else if (typeof value === 'number') {
        return JsigAST.literal('Number');
    } else {
        throw new Error('not recognised literal');
    }
}

// hoisting function declarations to the top makes the tree
// order algorithm simpler
function hoistFunctionDeclaration(nodes) {
    var declarations = [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    return declarations;
}

function findPropertyInType(jsigType, propertyName) {
    assert(jsigType.type === 'object',
        'jsigType must be an object');

    for (var i = 0; i < jsigType.keyValues.length; i++) {
        var keyValue = jsigType.keyValues[i];
        if (keyValue.key === propertyName) {
            return keyValue.value;
        }
    }

    return null;
}
