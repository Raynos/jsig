'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

var assert = require('assert');
var TypedError = require('error/typed');

var JsigAST = require('../ast.js');
var isSameType = require('./is-same-type.js');
var serialize = require('../serialize.js');

var MissingFieldInConstr = TypedError({
    type: 'jsig.verify.missing-field-in-constructor',
    message: '@{line}: Expected the field: {fieldName} to be defined ' +
        'in constructor {funcName} but instead found: {otherField}.',
    fieldName: null,
    otherField: null,
    funcName: null,
    loc: null,
    line: null
});

var TooManyArgsInFunc = TypedError({
    type: 'jsig.verify.too-many-function-args',
    message: '@{line}: Expected the function {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

var TooFewArgsInFunc = TypedError({
    type: 'jsig.verify.too-few-function-args',
    message: '@{line}: Expected the function {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

var TooManyArgsInNewExpression = TypedError({
    type: 'jsig.verify.too-many-args-in-new-expression',
    message: '@{line}: Expected the new call on constructor {funcName} to ' +
        'have exactly {expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

var TooFewArgsInNewExpression = TypedError({
    type: 'jsig.verify.too-few-args-in-new-expression',
    message: '@{line}: Expected the new call on constructor {funcName} to ' +
        'have exactly {expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

var NonExistantField = TypedError({
    type: 'jsig.verify.non-existant-field',
    message: '@{line}: Object {objName} does not have field {fieldName}.',
    fieldName: null,
    objName: null,
    loc: null,
    line: null
});

var NonVoidReturnType = TypedError({
    type: 'jsig.verify.non-void-return-type',
    message: '@{line}: Expected function {funcName} to return ' +
        'void but found: {actual}.',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

var MissingReturnStatement = TypedError({
    type: 'jsig.verify.missing-return-statement',
    message: '@{line}: Expected function {funcName} to return ' +
        '{expected} but found no return statement.',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

var UnTypedFunctionFound = TypedError({
    type: 'jsig.verify.untyped-function-found',
    message: '@{line}: Expected the function {funcName} to have ' +
        'type but could not find one.',
    funcName: null,
    loc: null,
    line: null
});

var CallingNewOnPlainFunction = TypedError({
    type: 'jsig.verify.calling-new-on-plain-function',
    message: '@{line}: Cannot call `new` on plain function {funcName}. ' +
        'The function type {funcType} is not a constructor.',
    funcName: null,
    funcType: null,
    loc: null,
    line: null
});

var ConstructorMustBePascalCase = TypedError({
    type: 'jsig.verify.constructor-must-be-pascal-case',
    message: '@{line}: Constructor function {funcName} must be pascal case. ' +
        'Cannot call `new` on function type {funcType}.',
    funcName: null,
    funcType: null,
    loc: null,
    line: null
});

var ConstructorThisTypeMustBeObject = TypedError({
    type: 'jsig.verify.constructor-this-type-must-be-object',
    message: '@{line}: Constructor {funcName} must have non-empty thisType. ' +
        'Cannot have non-object or empty object this ({thisType}).',
    funcName: null,
    thisType: null,
    loc: null,
    line: null
});

var ConstructorMustReturnVoid = TypedError({
    type: 'jsig.verify.constructor-must-return-void',
    message: '@{line}: Constructor {funcName} must return void. ' +
        'Cannot return type: {returnType}.',
    funcName: null,
    returnType: null,
    loc: null,
    line: null
});

var ReturnStatementInConstructor = TypedError({
    type: 'jsig.verify.return-statement-in-constructor',
    message: '@{line}: Constructor {funcName} has unexpected return statement. ' +
        'Expected no return but found type: {returnType}.',
    funcName: null,
    returnType: null,
    loc: null,
    line: null
});

module.exports = ASTVerifier;

function ASTVerifier(meta) {
    this.meta = meta;
}

/*eslint complexity: [2, 30] */
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
    } else if (node.type === 'CallExpression') {
        return this.verifyCallExpression(node);
    } else if (node.type === 'BinaryExpression') {
        return this.verifyBinaryExpression(node);
    } else if (node.type === 'ReturnStatement') {
        return this.verifyReturnStatement(node);
    } else if (node.type === 'NewExpression') {
        return this.verifyNewExpression(node);
    } else if (node.type === 'VariableDeclaration') {
        return this.verifyVariableDeclaration(node);
    } else if (node.type === 'ForStatement') {
        return this.verifyForStatement(node);
    } else if (node.type === 'UpdateExpression') {
        return this.verifyUpdateExpression(node);
    } else if (node.type === 'ObjectExpression') {
        return this.verifyObjectExpression(node);
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
    // console.log('verifyFunctionDeclaration', funcName);

    var token = this.meta.currentScope.getVar(funcName);
    if (!token) {
        var err = UnTypedFunctionFound({
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
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
        console.warn('could not find leftType');
        return null;
    }

    this.meta.currentScope.enterAssignment(leftType);
    var rightType = this.meta.verifyNode(node.right);
    this.meta.currentScope.exitAssignment();

    if (!rightType && node.right.type === 'Identifier') {
        var name = node.right.name;
        var maybeFunc = this.meta.currentScope.getFunction(name);
        if (!maybeFunc) {
            console.warn('could not find possible function');
            return null;
        }

        assert(leftType.name !== 'Any:ModuleExports',
            'cannot assign untyped function to module.exports');

        this.meta.currentScope.updateFunction(
            name, leftType
        );
        rightType = leftType;
    }
    if (!rightType) {
        return null;
    }

    this.meta.checkSubType(node, leftType, rightType);

    if (leftType.name === 'Any:ModuleExports') {
        assert(node.right.type === 'Identifier',
            'export must be identifier');

        this.meta.setModuleExportsType(rightType, node.right);
    }

    if (this.meta.currentScope.type === 'function' &&
        this.meta.currentScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        this.meta.currentScope.addKnownField(node.left.property.name);
    }

    if (node.left.type === 'MemberExpression' &&
        node.left.object.type === 'MemberExpression' &&
        node.left.object.property.name === 'prototype'
    ) {
        assert(node.left.object.object.type === 'Identifier',
            'expected identifier');
        var funcName = node.left.object.object.name;
        var fieldName = node.left.property.name;

        assert(this.meta.currentScope.type === 'file',
            'expected to be in file scope');

        this.meta.currentScope.addPrototypeField(
            funcName, fieldName, rightType
        );
    }

    return rightType;
};

ASTVerifier.prototype.verifyMemberExpression =
function verifyMemberExpression(node) {
    var objType = this.meta.verifyNode(node.object);
    var propName = node.property.name;

    if (objType === null) {
        return null;
    }

    var valueType = findPropertyInType(objType, propName);
    if (!valueType) {
        var objName;
        if (node.object.type === 'ThisExpression') {
            objName = 'this';
        } else if (node.object.type === 'Identifier') {
            objName = node.object.name;
        } else if (node.object.type === 'MemberExpression') {
            assert(node.object.object.type === 'Identifier');
            assert(node.object.property.type === 'Identifier');

            objName = node.object.object.name + '.' +
                node.object.property.name;
        } else {
            // console.log('weird objType', node);
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

    return null;
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
        return JsigAST.literal('Array:Empty');
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

ASTVerifier.prototype.verifyCallExpression =
function verifyCallExpression(node) {
    var defn = this._getFunctionTypeFromCallee(node);

    for (var i = 0; i < defn.args.length; i++) {
        var wantedType = defn.args[i];
        var actualType = this.meta.verifyNode(node.arguments[i]);

        this.meta.checkSubType(node.arguments[i], wantedType, actualType);
    }

    if (defn.thisArg) {
        assert(node.callee.type === 'MemberExpression',
            'must be a method call expression');

        var obj = this.meta.verifyNode(node.callee.object);
        assert(obj, 'object of method call must have a type');

        this.meta.checkSubType(node.callee.object, defn.thisArg, obj);
    }

    return defn.result;
};

ASTVerifier.prototype.verifyBinaryExpression =
function verifyBinaryExpression(node) {
    var leftType = this.meta.verifyNode(node.left);
    var rightType = this.meta.verifyNode(node.right);

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 2,
        'expected type defn args to be two');

    this.meta.checkSubType(node.left, defn.args[0], leftType);
    this.meta.checkSubType(node.right, defn.args[1], rightType);

    return defn.result;
};

ASTVerifier.prototype.verifyReturnStatement =
function verifyReturnStatement(node) {
    var defn = this.meta.verifyNode(node.argument);
    assert(defn, 'cannot inference return type');

    assert(this.meta.currentScope.type === 'function',
        'return must be within a function scope');

    this.meta.currentScope.markReturnType(defn, node);
    return defn;
};

ASTVerifier.prototype.verifyNewExpression =
function verifyNewExpression(node) {
    var fnType = this.meta.verifyNode(node.callee);

    assert(fnType, 'new expression callee must exist');
    assert(fnType.type === 'function', 'only support defined constructors');

    var err;
    if (!fnType.thisArg) {
        err = CallingNewOnPlainFunction({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (fnType.thisArg.type !== 'object' ||
        fnType.thisArg.keyValues.length === 0
    ) {
        err = ConstructorThisTypeMustBeObject({
            funcName: node.callee.name,
            thisType: serialize(fnType.thisArg),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (fnType.result.type !== 'typeLiteral' ||
        fnType.result.name !== 'void'
    ) {
        err = ConstructorMustReturnVoid({
            funcName: node.callee.name,
            returnType: serialize(fnType.result),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var isConstructor = /[A-Z]/.test(node.callee.name[0]);
    if (!isConstructor) {
        err = ConstructorMustBePascalCase({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (node.arguments.length > fnType.args.length) {
        err = TooManyArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: fnType.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    } else if (node.arguments.length < fnType.args.length) {
        err = TooFewArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: fnType.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    }

    var minLength = Math.min(fnType.args.length, node.arguments.length);
    for (var i = 0; i < minLength; i++) {
        var wantedType = fnType.args[i];
        var actualType = this.meta.verifyNode(node.arguments[i]);
        this.meta.checkSubType(node.arguments[i], wantedType, actualType);
    }

    return fnType.thisArg;
};

ASTVerifier.prototype.verifyVariableDeclaration =
function verifyVariableDeclaration(node) {
    assert(node.declarations.length === 1,
        'only support single declaration');

    var decl = node.declarations[0];
    assert(decl.init, 'declaration must have init value');

    var id = decl.id.name;
    var token = this.meta.currentScope.getVar(id);
    assert(!token, 'shadowing variables not supported');

    var type = this.meta.verifyNode(decl.init);
    assert(type, 'initial value must have a type');

    this.meta.currentScope.addVar(id, type);
    return null;
};

ASTVerifier.prototype.verifyForStatement =
function verifyForStatement(node) {
    this.meta.verifyNode(node.init);
    var testType = this.meta.verifyNode(node.test);

    assert(testType && testType.type === 'typeLiteral' &&
        testType.name === 'Boolean',
        'for loop condition statement must be a Boolean expression'
    );

    this.meta.verifyNode(node.update);
    this.meta.verifyNode(node.body);
};

ASTVerifier.prototype.verifyUpdateExpression =
function verifyUpdateExpression(node) {
    var firstType = this.meta.verifyNode(node.argument);

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0], firstType);

    return defn.result;
};

ASTVerifier.prototype.verifyObjectExpression =
function verifyObjectExpression(node) {
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

ASTVerifier.prototype._checkFunctionType =
function checkFunctionType(node, defn) {
    this.meta.enterFunctionScope(node, defn);

    var err;
    if (node.params.length > defn.args.length) {
        err = TooManyArgsInFunc({
            funcName: node.id.name,
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        this.meta.exitFunctionScope();
        return;
    } else if (node.params.length < defn.args.length) {
        err = TooFewArgsInFunc({
            funcName: node.id.name,
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        this.meta.exitFunctionScope();
        return;
    }

    var statements = node.body.body;
    for (var i = 0; i < statements.length; i++) {
        if (statements[i].type === 'FunctionDeclaration') {
            var name = statements[i].id.name;
            this.meta.currentScope.addFunction(name, statements[i]);
        }
    }

    this.meta.verifyNode(node.body);

    if (this.meta.currentScope.isConstructor) {
        this._checkHiddenClass(node);
        this._checkVoidReturnType(node);
    } else {
        // TODO: verify return.
        this._checkReturnType(node);
    }

    this.meta.exitFunctionScope();
};

ASTVerifier.prototype._checkHiddenClass =
function checkHiddenClass(node) {
    var thisType = this.meta.currentScope.thisValueType;
    var knownFields = this.meta.currentScope.knownFields;
    var protoFields = this.meta.currentScope.getPrototypeFields();

    var err;
    if (!thisType || thisType.type !== 'object') {
        err = ConstructorThisTypeMustBeObject({
            funcName: this.meta.currentScope.funcName,
            thisType: thisType ? serialize(thisType) : 'void',
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
    }
    assert(thisType && thisType.type === 'object', 'this field must be object');

    for (var i = 0; i < thisType.keyValues.length; i++) {
        var key = thisType.keyValues[i].key;
        if (
            knownFields[i] !== key &&
            !(protoFields && protoFields[key])
        ) {
            err = MissingFieldInConstr({
                fieldName: key,
                funcName: this.meta.currentScope.funcName,
                otherField: knownFields[i] || 'no-field',
                loc: node.loc,
                line: node.loc.start.line
            });// new Error('missing field: ' + key);
            this.meta.addError(err);
        }
    }
};

ASTVerifier.prototype._checkReturnType =
function _checkReturnType(node) {
    var expected = this.meta.currentScope.returnValueType;
    var actual = this.meta.currentScope.knownReturnType;
    var returnNode = this.meta.currentScope.returnStatementASTNode;
    var err;

    if (expected.type === 'typeLiteral' && expected.name === 'void') {
        if (actual !== null) {
            err = NonVoidReturnType({
                expected: 'void',
                actual: serialize(actual),
                funcName: this.meta.currentScope.funcName,
                loc: returnNode.loc,
                line: returnNode.loc.start.line
            });
            this.meta.addError(err);
        }
        return;
    }

    if (actual === null && returnNode === null) {
        var funcNode = this.meta.currentScope.funcASTNode;
        err = MissingReturnStatement({
            expected: serialize(expected),
            actual: 'void',
            funcName: this.meta.currentScope.funcName,
            loc: funcNode.loc,
            line: funcNode.loc.start.line
        });
        this.meta.addError(err);
        return;
    }

    this.meta.checkSubType(returnNode, expected, actual);
};

ASTVerifier.prototype._checkVoidReturnType =
function _checkVoidReturnType(node) {
    var returnType = this.meta.currentScope.returnValueType;
    var actualReturnType = this.meta.currentScope.knownReturnType;
    var returnNode = this.meta.currentScope.returnStatementASTNode;

    var err;
    if (returnNode || actualReturnType !== null) {
        err = ReturnStatementInConstructor({
            funcName: this.meta.currentScope.funcName,
            returnType: serialize(actualReturnType),
            line: returnNode.loc.start.line,
            loc: returnNode.loc
        });
        this.meta.addError(err);
        return;
    }

    assert(returnType.type === 'typeLiteral' && returnType.name === 'void',
        'expected Constructor to have no return void');
};

ASTVerifier.prototype._inferFunctionTypeBasedOnCall =
function _inferFunctionTypeBasedOnCall(node, untypedFunc) {
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

    return this.meta.currentScope.updateFunction(
        node.callee.name, funcType
    );
};

ASTVerifier.prototype._getFunctionTypeFromCallee =
function _getFunctionTypeFromCallee(node) {
    var defn;
    var token;
    if (node.callee.type === 'Identifier') {
        token = this.meta.currentScope.getVar(node.callee.name);
        if (!token) {
            var untypedFunc = this.meta.currentScope
                .getFunction(node.callee.name);
            if (untypedFunc) {
                token = this._inferFunctionTypeBasedOnCall(node, untypedFunc);
            }
        }
        assert(token, 'do not support type inference caller()');
        defn = token.defn;
    } else {
        assert(node.callee.object.type === 'Identifier');
        assert(node.callee.property.type === 'Identifier');

        token = this.meta.currentScope.getVar(node.callee.object.name);
        assert(token,
            'expected method call to be on existing token: ' +
            node.callee.object.name
        );

        // TODO: figure out thisType in call verification
        defn = findPropertyInType(
            token.defn, node.callee.property.name
        );
        assert(defn,
            'property name ' + node.callee.property.name + ' must exist'
        );
    }

    assert(defn.args.length === node.arguments.length,
        'expected same number of args');

    return defn;
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
