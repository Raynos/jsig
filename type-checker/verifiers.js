'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

/*eslint no-console: 0*/
var assert = require('assert');
var TypedError = require('error/typed');
var console = require('console');

var JsigAST = require('../ast.js');
var isSameType = require('./is-same-type.js');

var MissingFieldInConstr = TypedError({
    type: 'jsig.verify.missing-field-in-constructor',
    message: '@{line}: Expected the field: {fieldName} to be defined ' +
        'but instead found: {otherField}.',
    fieldName: null,
    otherField: null,
    loc: null,
    line: null
});

var NonExistantField = TypedError({
    type: 'jsig.verify.non-existant-field',
    message: '@{line}: Object {objName} does not have field {fieldName}',
    fieldName: null,
    objName: null,
    loc: null,
    line: null
});

module.exports = {
    'Program': verifyProgram,
    'FunctionDeclaration': verifyFunctionDeclaration,
    'BlockStatement': verifyBlockStatement,
    'ExpressionStatement': verifyExpressionStatement,
    'AssignmentExpression': verifyAssignmentExpression,
    'MemberExpression': verifyMemberExpression,
    'ThisExpression': verifyThisExpression,
    'Identifier': verifyIdentifier,
    'Literal': verifyLiteral,
    'ArrayExpression': verifyArrayExpression
};

function verifyFunctionDeclaration(node, meta) {
    var funcName = node.id.name;

    var token = meta.currentScope.getVar(funcName);
    if (!token) {
        throw new Error('type inference not supported');
    }

    meta.enterFunctionScope(node, token.defn);
    meta.verifyNode(node.body);

    if (meta.currentScope.isConstructor) {
        var thisType = meta.currentScope.thisValueType;
        var knownFields = meta.currentScope.knownFields;
        assert(thisType.type === 'object', 'this field must be object');

        for (var i = 0; i < thisType.keyValues.length; i++) {
            var key = thisType.keyValues[i].key;
            if (knownFields[i] !== key) {
                var err = MissingFieldInConstr({
                    fieldName: key,
                    otherField: knownFields[i] || 'no-field',
                    loc: node.loc,
                    line: node.loc.start.line
                });// new Error('missing field: ' + key);
                meta.addError(err);
            }
        }
    } else {
        // TODO: verify return.
        console.warn('!! Must check a return');
    }

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
    if (!leftType) {
        return null;
    }

    var rightType = meta.verifyNode(node.right);
    if (!rightType) {
        return null;
    }

    meta.checkSubType(node, leftType, rightType);

    if (leftType.name === 'Any:ModuleExports') {
        meta.setModuleExportsType(rightType);
    }

    if (meta.currentScope.type === 'function' &&
        meta.currentScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        meta.currentScope.addKnownField(node.left.property.name);
    }

    return rightType;
}

function verifyMemberExpression(node, meta) {
    var objType = meta.verifyNode(node.object);
    var propName = node.property.name;

    var valueType = findPropertyInType(objType, propName);
    if (!valueType) {
        var objName;
        if (node.object.type === 'ThisExpression') {
            objName = 'this';
        } else if (node.object.type === 'Identifier') {
            objName = node.object.name;
        } else {
            assert(false, 'unknown object type');
        }
        meta.addError(NonExistantField({
            fieldName: propName,
            objName: objName,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
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

function verifyArrayExpression(node, meta) {
    var elems = node.elements;

    if (elems.length === 0) {
        return JsigAST.literal('Array');
    }

    var type = null;
    for (var i = 0; i < elems.length; i++) {
        var newType = meta.verifyNode(elems[i]);
        if (type) {
            assert(isSameType(newType, type), 'arrays must be homogenous');
        }
        type = newType;
    }

    if (!type) {
        return null;
    }

    return JsigAST.generic(JsigAST.literal('Array'), [type]);
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
