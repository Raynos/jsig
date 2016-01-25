'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

/*eslint no-console: 0*/
// var console = require('console');

module.exports = {
    'Program': verifyProgram,
    'FunctionDeclaration': verifyFunctionDeclaration,
    'BlockStatement': verifyBlockStatement,
    'ExpressionStatement': verifyExpressionStatement,
    'AssignmentExpression': verifyAssignmentExpression
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

    var maybeErr = checkSubType(leftType, rightType);
    if (maybeErr) {
        meta.addError(maybeErr);
        return null;
    }

    return rightType;
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
