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

module.exports = ASTVerifier;

function ASTVerifier(meta) {
    this.meta = meta;
}

ASTVerifier.prototype.verifyNode = function verifyNode(node) {
    if (node.type === 'Program') {
        return this.verifyProgram(node);
    } else if (node.type === 'FunctionDeclaration') {
        return this.verifyFunctionDeclaration(node);
    } else if (node.type === 'BlockStatement') {
        return this.verifyBlockStatement(node);
    } else if (node.type === 'ExpressionStatement') {
        return this.verifyExpressionStatement(node);
    } else if (node.type === 'AssignmentExpression') {
        return this.verifyAssignmentExpression(node);
    } else if (node.type === 'MemberExpression') {
        return this.verifyMemberExpression(node);
    } else if (node.type === 'ThisExpression') {
        return this.verifyThisExpression(node);
    } else if (node.type === 'Identifier') {
        return this.verifyIdentifier(node);
    } else if (node.type === 'Literal') {
        return this.verifyLiteral(node);
    } else if (node.type === 'ArrayExpression') {
        return this.verifyArrayExpression(node);
    } else {
        throw new Error('!! skipping verifyNode: ' + node.type);
    }
};

ASTVerifier.prototype.verifyProgram =
function verifyProgram(node) {
    node.body = hoistFunctionDeclaration(node.body);

    this.meta.setModuleExportsNode(node);

    var i = 0;
    for (i = 0; i < node.body.length; i++) {
        if (node.body[i].type === 'FunctionDeclaration') {
            var name = node.body[i].id.name;
            this.meta.currentScope.addFunction(name, node.body[i]);
        }
    }

    this.meta.loadHeaderFile();

    for (i = 0; i < node.body.length; i++) {
        this.meta.verifyNode(node.body[i]);
    }
};

ASTVerifier.prototype.verifyFunctionDeclaration =
function verifyFunctionDeclaration(node) {
    var funcName = node.id.name;

    var token = this.meta.currentScope.getVar(funcName);
    if (!token) {
        throw new Error('type inference not supported');
    }

    this._checkFunctionType(node, token.defn);
};

ASTVerifier.prototype.verifyBlockStatement =
function verifyBlockStatement(node) {
    for (var i = 0; i < node.body.length; i++) {
        this.meta.verifyNode(node.body[i]);
    }
};

ASTVerifier.prototype.verifyExpressionStatement =
function verifyExpressionStatement(node) {
    return this.meta.verifyNode(node.expression);
};

ASTVerifier.prototype.verifyAssignmentExpression =
function verifyAssignmentExpression(node) {
    var leftType = this.meta.verifyNode(node.left);
    if (!leftType) {
        return null;
    }

    var rightType = this.meta.verifyNode(node.right);
    if (!rightType) {
        return null;
    }

    if (rightType.type === 'untyped-function') {
        var prevErrors = this.meta.errors.length;
        this._checkFunctionType(rightType.node, leftType);
        var currErrors = this.meta.errors.length;

        if (prevErrors === currErrors) {
            this.meta.currentScope.addVar(
                rightType.node.id.name, leftType
            );
            rightType = leftType;
        }
    }

    this.meta.checkSubType(node, leftType, rightType);

    if (leftType.name === 'Any:ModuleExports') {
        this.meta.setModuleExportsType(rightType);
    }

    if (this.meta.currentScope.type === 'function' &&
        this.meta.currentScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        this.meta.currentScope.addKnownField(node.left.property.name);
    }

    return rightType;
};

ASTVerifier.prototype.verifyMemberExpression =
function verifyMemberExpression(node) {
    var objType = this.meta.verifyNode(node.object);
    var propName = node.property.name;

    // console.log('?', node);
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
        this.meta.addError(NonExistantField({
            fieldName: propName,
            objName: objName,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    return valueType;
};

ASTVerifier.prototype.verifyThisExpression =
function verifyThisExpression(node) {
    if (this.meta.currentScope.type !== 'function') {
        throw new Error('cannot access `this` outside function');
    }

    if (!this.meta.currentScope.thisValueType) {
        throw new Error('cannot type inference for `this`');
    }

    return this.meta.currentScope.thisValueType;
};

ASTVerifier.prototype.verifyIdentifier =
function verifyIdentifier(node) {
    var token = this.meta.currentScope.getVar(node.name);
    if (token) {
        return token.defn;
    }

    token = this.meta.currentScope.getFunction(node.name);
    if (!token) {
        throw new Error('could not resolve Identifier: ' + node.name);
    }

    return token;
};

ASTVerifier.prototype.verifyLiteral =
function verifyLiteral(node) {
    var value = node.value;

    if (typeof value === 'string') {
        return JsigAST.literal('String');
    } else if (typeof value === 'number') {
        return JsigAST.literal('Number');
    } else {
        throw new Error('not recognised literal');
    }
};

ASTVerifier.prototype.verifyArrayExpression =
function verifyArrayExpression(node) {
    var elems = node.elements;

    if (elems.length === 0) {
        return JsigAST.literal('Array');
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

ASTVerifier.prototype._checkFunctionType =
function checkFunctionType(node, defn) {
    this.meta.enterFunctionScope(node, defn);
    this.meta.verifyNode(node.body);

    if (this.meta.currentScope.isConstructor) {
        this._checkHiddenClass(node);
    } else {
        // TODO: verify return.
        console.warn('!! Must check a return');
    }

    this.meta.exitFunctionScope();
};

ASTVerifier.prototype._checkHiddenClass =
function checkHiddenClass(node) {
    var thisType = this.meta.currentScope.thisValueType;
    var knownFields = this.meta.currentScope.knownFields;
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
            this.meta.addError(err);
        }
    }
};

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
            declarations.unshift(nodes[i]);
        }
    }

    return declarations;
}

function findPropertyInType(jsigType, propertyName) {
    if (jsigType.type === 'function' &&
        propertyName === 'prototype'
    ) {
        return jsigType.thisArg;
    }

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
