'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

var assert = require('assert');
var path = require('path');

var JsigAST = require('../ast/');
var serialize = require('../serialize.js');
var Errors = require('./errors.js');
var isSameType = require('./lib/is-same-type.js');
var getUnionWithoutBool = require('./lib/get-union-without-bool.js');
var updateObject = require('./lib/update-object.js');
var cloneJSIG = require('./lib/clone-ast.js');
var computeSmallestUnion = require('./lib/compute-smallest-union.js');

var ARRAY_KEY_TYPE = JsigAST.literal('Number');

module.exports = ASTVerifier;

function ASTVerifier(meta, checker, fileName) {
    this.meta = meta;
    this.checker = checker;
    this.fileName = fileName;
    this.folderName = path.dirname(fileName);

    this._cachedFunctionExpressionTypes = Object.create(null);
}

/*eslint complexity: [2, 50] */
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
    } else if (node.type === 'IfStatement') {
        return this.verifyIfStatement(node);
    } else if (node.type === 'UnaryExpression') {
        return this.verifyUnaryExpression(node);
    } else if (node.type === 'LogicalExpression') {
        return this.verifyLogicalExpression(node);
    } else if (node.type === 'FunctionExpression') {
        return this.verifyFunctionExpression(node);
    } else if (node.type === 'ContinueStatement') {
        return this.verifyContinueStatement(node);
    } else if (node.type === 'ThrowStatement') {
        return this.verifyThrowStatement(node);
    } else if (node.type === 'ConditionalExpression') {
        return this.verifyConditionalExpression(node);
    } else if (node.type === 'WhileStatement') {
        return this.verifyWhileStatement(node);
    } else if (node.type === 'BreakStatement') {
        return this.verifyBreakStatement(node);
    } else if (node.type === 'TryStatement') {
        return this.verifyTryStatement(node);
    } else if (node.type === 'CatchClause') {
        return this.verifyCatchClause(node);
    } else {
        throw new Error('!! skipping verifyNode: ' + node.type);
    }
};

ASTVerifier.prototype.verifyProgram =
function verifyProgram(node) {
    var parts = splitFunctionDeclaration(node.body);

    var i = 0;
    for (i = 0; i < parts.functions.length; i++) {
        var name = parts.functions[i].id.name;

        if (!this.meta.currentScope.getVar(name)) {
            this.meta.currentScope.addFunction(name, parts.functions[i]);
        }
    }

    this._verifyBlockStatement(parts.statements);

    var functions = parts.functions;
    do {
        var unknownFuncs = [];
        for (i = 0; i < functions.length; i++) {
            var func = functions[i];
            if (!this.meta.currentScope.getVar(func.id.name)) {
                unknownFuncs.push(func);
                continue;
            }
            this.meta.verifyNode(func, null);
        }

        var gotSmaller = unknownFuncs.length < functions.length;
        functions = unknownFuncs;
    } while (gotSmaller);

    for (i = 0; i < functions.length; i++) {
        this.meta.verifyNode(functions[i], null);
    }

    /* If a module.exports type exists, but it has not been assigned */
    if (this.meta.hasExportDefined() &&
        !this.meta.hasFullyExportedType()
    ) {
        var exportType = this.meta.getModuleExportsType();
        var actualType = JsigAST.literal('<MissingType>', true);

        if (this.meta.getExportedFields().length > 0) {
            var fields = this.meta.getExportedFields();
            actualType = cloneJSIG(exportType);

            actualType.keyValues = [];
            for (i = 0; i < exportType.keyValues.length; i++) {
                var pair = exportType.keyValues[i];
                if (fields.indexOf(pair.key) >= 0) {
                    actualType.keyValues.push(pair);
                }
            }
        }

        this.meta.addError(Errors.MissingExports({
            expected: this.meta.serializeType(exportType),
            actual: this.meta.serializeType(actualType)
        }));
    }

    if (this.meta.moduleExportsNode &&
        this.meta.moduleExportsNode.type === 'Identifier'
    ) {
        var exportsNode = this.meta.moduleExportsNode;
        // if we are assigning an untyped function to module.exports
        var exportsType = this.meta.getModuleExportsType();
        if (!exportsType) {
            var finalExportType = this.meta.verifyNode(exportsNode, null);
            if (finalExportType) {
                this.meta.setModuleExportsType(
                    finalExportType, exportsNode
                );
                exportsType = finalExportType;
            }
        }

        if (exportsType === null) {
            this.meta.addError(Errors.UnknownModuleExports({
                funcName: exportsNode.name,
                loc: exportsNode.loc,
                line: exportsNode.loc.start.line
            }));
        }
    }
};

ASTVerifier.prototype.tryInferFunctionType =
function tryInferFunctionType(untypedFunc) {
    if (untypedFunc.attemptedStaticInference) {
        // TODO: if we hav succeeded here then it should already
        // be in the type or scope table or whatever.
        // we just do this check to avoid "double failing" the
        // inference and reporting the same error twice.
        return null;
    }

    var node = untypedFunc.node;
    var funcType = this.meta.inferFunctionType(node);
    untypedFunc.attemptedStaticInference = true;

    if (!funcType) {
        var err = Errors.UnTypedFunctionFound({
            funcName: untypedFunc.name,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var newType = this._checkFunctionType(node, funcType);
    // If the function checks out and does not blow up.
    if (newType) {
        var success = this.meta.tryUpdateFunction(untypedFunc.name, newType);
        if (!success) {
            // TODO: should we log an error ?
            assert(false, 'failed to update inferred function');
        }
    }

    return newType;
};

ASTVerifier.prototype.verifyFunctionDeclaration =
function verifyFunctionDeclaration(node) {
    var funcName = this.meta.getFunctionName(node);

    var err;
    var untypedFunc = this.meta.currentScope.getUntypedFunction(funcName);
    if (untypedFunc) {
        return this.tryInferFunctionType(untypedFunc);
    }

    var token = this.meta.currentScope.getVar(funcName);
    assert(token, 'expected funcName(' + funcName + ') to exist');

    var isFunction = token.defn.type === 'function';
    if (!isFunction && token.defn.type !== 'intersectionType' &&
        token.defn.type !== 'unionType'
    ) {
        err = Errors.UnexpectedFunction({
            funcName: funcName,
            expected: this.meta.serializeType(token.defn),
            actual: this.meta.serializeType(JsigAST.literal('Function')),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    this._checkFunctionType(node, token.defn);
    return token.defn;
};

ASTVerifier.prototype.verifyBlockStatement =
function verifyBlockStatement(node) {
    this._verifyBlockStatement(node.body);
};

ASTVerifier.prototype._verifyBlockStatement =
function _verifyBlockStatement(statements) {
    for (var i = 0; i < statements.length; i++) {
        var statement = statements[i];

        if (statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'UnaryExpression' &&
            statement.expression.operator === 'typeof'
        ) {
            this._handleTypeofExpression(statement);
        }

        var statementType = this.meta.verifyNode(statement, null);

        // If we have an if statement with an early return
        // And the non-existant else block is Never type then
        // the if statement will always run and the rest
        // of the block will never run because of the early return
        if (statement.type === 'IfStatement' &&
            isNeverLiteral(statementType)
        ) {
            break;
        }
    }
};

ASTVerifier.prototype._handleTypeofExpression =
function _handleTypeofExpression(statement) {
    var exprNode = statement.expression.argument;
    var valueType = this.meta.verifyNode(exprNode, null);

    this.meta.addError(Errors.TypeofExpression({
        valueType: valueType ?
            this.meta.serializeType(valueType) :
            '<TypeError>',
        expr: this.meta.serializeAST(exprNode),
        loc: exprNode.loc,
        line: exprNode.loc.start.line
    }));
};

ASTVerifier.prototype.verifyExpressionStatement =
function verifyExpressionStatement(node) {
    return this.meta.verifyNode(node.expression, null);
};

/*eslint max-statements: [2, 130]*/
ASTVerifier.prototype.verifyAssignmentExpression =
function verifyAssignmentExpression(node) {
    var errCount = this.meta.countErrors();
    // console.log("verifyAssignmentExpression()",
    //    this.meta.serializeAST(node));
    if (
        node.left.type === 'Identifier' ||
        (node.left.type === 'MemberExpression' &&
            !node.left.computed)
    ) {
        this.meta.currentScope.setWritableTokenLookup();
    }
    var beforeError = this.meta.countErrors();
    var leftType = this.meta.verifyNode(node.left, null);
    var afterError = this.meta.countErrors();
    if (
        node.left.type === 'Identifier' ||
        (node.left.type === 'MemberExpression' &&
            !node.left.computed)
    ) {
        this.meta.currentScope.unsetWritableTokenLookup();
    }

    // Sanity check.
    if (!leftType) {
        if (afterError === beforeError) {
            assert(false, '!!! could not find leftType: ' +
                this.meta.serializeAST(node));
        }
        return null;
    }

    var rightType;
    beforeError = this.meta.countErrors();

    // When assigning an untyped function, try to update function
    if (node.right.type === 'Identifier' &&
        this.meta.currentScope.getUntypedFunction(node.right.name)
    ) {
        if (leftType.name === '%Export%%ModuleExports') {
            return null;
        }

        if (!this.meta.tryUpdateFunction(node.right.name, leftType)) {
            return null;
        }
        rightType = leftType;
    } else {
        var exprType = leftType;

        rightType = this.meta.verifyNode(node.right, exprType);
    }
    afterError = this.meta.countErrors();

    if (!rightType) {
        this.meta.sanityCheckErrorsState(errCount);
        return null;
    }

    // Update inferred status
    if (node.left.type === 'Identifier' && !rightType.inferred) {
        var token = this.meta.currentScope.getVar(node.left.name);
        token.inferred = false;
    }

    // Handle free literal
    if (node.left.type === 'MemberExpression' &&
        node.left.object.type === 'Identifier' &&
        node.left.computed
    ) {
        var objType = this.meta.verifyNode(node.left.object, null);
        if (objType.type === 'genericLiteral' &&
            objType.generics[0] &&
            objType.generics[0].type === 'freeLiteral' &&
            objType.value.type === 'typeLiteral' &&
            objType.value.builtin && objType.value.name === 'Array'
        ) {
            var newGenerics = [rightType];
            assert(objType.generics.length === 1,
                'Array only has one generic type');

            var newType = JsigAST.generic(objType.value, newGenerics);
            this.meta.currentScope.forceUpdateVar(
                node.left.object.name, newType
            );

            leftType = rightType;
        }
    }

    // If the left side is an identifier, whos type is a value literal
    if (node.left.type === 'Identifier' &&
        leftType && leftType.type === 'valueLiteral' &&
        (leftType.name === 'boolean' || leftType.name === 'string') &&
        this.meta.isSubType(node, rightType, leftType)
    ) {
        // If we are assinging a String into a "foo" slot
        // or assigning a Boolean into a `true` slot.
        // Then just change the identifier slot to be the more
        // general type.

        this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
        leftType = rightType;
    }

    var isNullDefault = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Null%%Default'
    );
    var isVoidUninitialized = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Void%%Uninitialized'
    );
    var isOpenField = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Mixed%%OpenField'
    );

    // Must check that right type fits in left type unless left type
    // can grow.
    // If left type is Null%%Default or Void%%Unitialized
    // then its uninitialized variable which can hold any type
    // If left type is an open field then we are assigning to
    // an untyped field an open object which can hold any type
    var canGrow = isNullDefault || isVoidUninitialized || isOpenField;
    var beforeAssignmentError = this.meta.countErrors();
    var afterAssignmentErrror = beforeAssignmentError;
    if (!canGrow) {
        this.meta.checkSubType(node, leftType, rightType);
        afterAssignmentErrror = this.meta.countErrors();
    }

    var hasKnownLeftType = afterError === beforeError;
    var assignmentSucceeded = afterAssignmentErrror === beforeAssignmentError;

    // In assignment of a value with concreteValue,
    // Must change the concreteValue
    if (assignmentSucceeded && hasKnownLeftType &&
        node.left.type === 'Identifier' &&
        leftType.type === 'typeLiteral' &&
        leftType.concreteValue !== null
    ) {
        this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
    }

    // If assignment succeeded then update the type of the variable
    if (assignmentSucceeded && hasKnownLeftType &&
        node.left.type === 'Identifier'
    ) {
        var readLeftType = this.meta.verifyNode(node.left, null);
        if (!isSameType(readLeftType, rightType)) {
            this.meta.currentScope.restrictType(node.left.name, rightType);
        }
    }

    // After assignment then unitialized variable now has concrete type
    if (isNullDefault || isVoidUninitialized) {
        if (node.left.type === 'Identifier') {
            this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
        } else {
            assert(false, 'Cannot forceUpdateVar() ' + leftType.name);
        }
    }

    // If we assign to an open field we have to update the type
    // of the open object to track the new grown type
    if (isOpenField) {
        if (node.left.type === 'MemberExpression' &&
            node.left.property.type === 'Identifier' &&
            // Cannot track new type for nested objected assignment
            (
                node.left.object.type === 'Identifier' ||
                node.left.object.type === 'ThisExpression'
            )
        ) {
            var propertyName = node.left.property.name;
            var targetType = this.meta.verifyNode(node.left.object, null);

            var newObjType = updateObject(
                targetType, [propertyName], rightType
            );
            newObjType.open = targetType.open;
            newObjType.brand = targetType.brand;

            var varName = null;
            if (node.left.object.type === 'Identifier') {
                varName = node.left.object.name;
            } else if (node.left.object.type === 'ThisExpression') {
                varName = 'this';
            }

            this.meta.currentScope.forceUpdateVar(varName, newObjType);
        } else {
            // TODO: anything to do here?
            // assert(false, 'Cannot forceUpdateVar() %Mixed%%OpenField');
        }
    }

    // When assigning to module.exports, find the known export
    // type of the module and do another checkSubType()
    if (leftType.name === '%Export%%ModuleExports') {
        assert(rightType, 'must have an export type');

        if (this.meta.hasExportDefined()) {
            var expectedType = this.meta.getModuleExportsType();

            // Do a potential conversion from Tuple -> Array
            if (expectedType.type === 'genericLiteral' &&
                expectedType.value.name === 'Array' &&
                expectedType.value.builtin &&
                rightType.type === 'tuple' &&
                rightType.inferred &&
                node.right.type === 'Identifier'
            ) {
                token = this.meta.currentScope.getVar(node.right.name);

                var self = this;
                var newArrayType = this._maybeConvertToArray(
                    token, node.right.name, rightType,
                    function verify(possibleArray) {
                        return self.meta.checkSubType(
                            node, expectedType, possibleArray
                        );
                    }
                );

                if (newArrayType) {
                    rightType = newArrayType;
                }
            }

            this.meta.checkSubType(node, expectedType, rightType);
            this.meta.setHasModuleExports(true);
        } else {
            this.meta.setModuleExportsType(rightType, node.right);
        }
    }

    // If we are assigning to exports.foo, we want to mark the field
    // as having been succesfully exported
    if (leftType.name !== '%Mixed%%UnknownExportsField' &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'Identifier' &&
        node.left.property.type === 'Identifier' &&
        node.left.object.name === 'exports' &&
        this.meta.hasExportDefined()
    ) {
        var exportsType = this.meta.verifyNode(node.left.object, null);

        if (exportsType.type === 'typeLiteral' &&
            exportsType.builtin && exportsType.name === '%Export%%ExportsObject'
        ) {
            var fieldName = node.left.property.name;
            this.meta.addExportedField(fieldName);
        }
    }

    // If we are currently inside a function scope which is
    // a constructor function and this assignment is this field
    // assignment then track it as a known field in the constructor.
    var funcScope = this.meta.currentScope.getFunctionScope();
    if (funcScope && funcScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        funcScope.addKnownField(node.left.property.name);
    }

    // If we are assigning a field to the prototype then track
    // that this field has been set against a prototype.
    if (node.left.type === 'MemberExpression' &&
        node.left.object.type === 'MemberExpression' &&
        node.left.object.property.name === 'prototype'
    ) {
        assert(node.left.object.object.type === 'Identifier',
            'expected identifier');
        var funcName = node.left.object.object.name;
        fieldName = node.left.property.name;

        assert(this.meta.currentScope.type === 'file',
            'expected to be in file scope');

        this.meta.currentScope.addPrototypeField(
            funcName, fieldName, rightType
        );
    }

    // If the right value of the assignment is an identifier then
    // mark that identifier as having been aliased.
    if (node.right.type === 'Identifier') {
        this.meta.currentScope.markVarAsAlias(
            node.right.name, null
        );
    }

    return rightType;
};

ASTVerifier.prototype.verifyMemberExpression =
function verifyMemberExpression(node) {
    var objType = this.meta.verifyNode(node.object, null);
    var propName = node.property.name;

    if (objType === null) {
        return null;
    }

    /*  For the allowUnknownRequire rule, we want to allow people
        to de-reference a field from a require callsite like

        var foo = require('bar').foo;

        This means in the member expression check we have to double
        check if we are in the variable initialization phase
        instead of being in the usage phase.

        For example

        var bar = require('bar');
        bar.foo;

        Should still be invalid because we are using bar without
        knowing what its type is.
    */
    if (objType.builtin &&
        (
            objType.name === '%Mixed%%UnknownRequire' ||
            objType.name === '%Mixed%%UnknownExports'
        ) &&
        node.object.type === 'CallExpression' &&
        node.object.callee.type === 'Identifier' &&
        node.object.callee.name === 'require'
    ) {
        var requireType = this.meta.verifyNode(node.object.callee, null);

        if (requireType.name === '%Require%%RequireFunction' &&
            requireType.builtin &&
            this.meta.checkerRules.allowUnknownRequire
        ) {
            return JsigAST.literal('%Mixed%%UnknownRequire', true);
        }
    }

    var valueType;
    if (!node.computed) {
        valueType = this._findPropertyInType(node, objType, propName);
    } else {
        var propType = this.meta.verifyNode(node.property, null);
        if (!propType) {
            return null;
        }
        valueType = this._findTypeInContainer(node, objType, propType);
    }

    return valueType;
};

ASTVerifier.prototype.verifyThisExpression =
function verifyThisExpression(node) {
    var thisType = this.meta.currentScope.getThisType();

    if (!thisType) {
        var funcName = this.meta.currentScope.funcName;
        var funcType = this.meta.currentScope.funcType;

        this.meta.addError(Errors.NonExistantThis({
            funcName: funcName,
            funcType: funcType ?
                this.meta.serializeType(funcType) : null,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    return thisType;
};

ASTVerifier.prototype.verifyIdentifier =
function verifyIdentifier(node) {
    // FFFF--- javascript. undefined is a value, not an identifier
    if (node.name === 'undefined') {
        return JsigAST.value('undefined');
    }

    var token = this.meta.currentScope.getVar(node.name);
    if (token) {
        return token.defn;
    }

    if (node.name === 'global') {
        return this.meta.currentScope.getGlobalType();
    }

    if (this.meta.currentExpressionType &&
        this.meta.currentExpressionType.type === 'function' &&
        this.meta.currentScope.getUntypedFunction(node.name)
    ) {
        var exprType = this.meta.currentExpressionType;
        var bool = this.meta.tryUpdateFunction(node.name, exprType);
        if (bool) {
            return exprType;
        }
    }

    // if this identifier is a currently unknown function
    var unTypedFunc = this.meta.currentScope.getUntypedFunction(node.name);
    if (unTypedFunc) {
        var identifierType = this.tryInferFunctionType(unTypedFunc);
        if (identifierType) {
            return identifierType;
        }
    }

    var isUnknown = Boolean(this.meta.currentScope.getUnknownVar(node.name));

    if (isUnknown) {
        this.meta.addError(Errors.UnTypedIdentifier({
            tokenName: node.name,
            line: node.loc.start.line,
            loc: node.loc
        }));
    } else {
        this.meta.addError(Errors.UnknownIdentifier({
            tokenName: node.name,
            line: node.loc.start.line,
            loc: node.loc
        }));
    }

    return null;
};

ASTVerifier.prototype.verifyLiteral =
function verifyLiteral(node) {
    return this.meta.inferType(node);
};

ASTVerifier.prototype.verifyArrayExpression =
function verifyArrayExpression(node) {
    return this.meta.inferType(node);
};

ASTVerifier.prototype._getTypeFromFunctionCall =
function _getTypeFromFunctionCall(node) {
    var token;
    var defn;

    if (node.callee.type === 'Identifier') {
        token = this.meta.currentScope.getVar(node.callee.name);
        if (token) {
            defn = token.defn;
        } else {
            defn = this.meta.inferType(node);
        }

        var funcNode = this.meta.currentScope
            .getUntypedFunction(node.callee.name);

        var err;
        if (!defn && funcNode) {
            err = Errors.UnTypedFunctionCall({
                funcName: node.callee.name,
                callExpression: this.meta.serializeAST(node.callee),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        } else if (!defn) {
            err = Errors.UnknownIdentifier({
                tokenName: node.callee.name,
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }
    } else {
        defn = this.verifyNode(node.callee, null);
        if (!defn) {
            return null;
        }
    }

    return defn;
};

ASTVerifier.prototype._resolveInternalFnCall =
function _resolveInternalFnCall(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.call() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being call() must have thisArg');

    var argTypes = [
        JsigAST.param('thisArg', fnToCall.thisArg.value)
    ];

    for (var i = 0; i < fnToCall.args.length; i++) {
        argTypes.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: argTypes,
        result: JsigAST.literal('void'),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

ASTVerifier.prototype._resolveInternalFnApply =
function _resolveInternalFnApply(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.apply() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being call() must have thisArg');

    var argTypes = [];

    for (var i = 0; i < fnToCall.args.length; i++) {
        argTypes.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: [
            JsigAST.param('thisArg', fnToCall.thisArg.value),
            JsigAST.param('args', JsigAST.tuple(argTypes))
        ],
        result: JsigAST.literal('void'),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

ASTVerifier.prototype._resolveInternalFnBind =
function _resolveInternalFnBind(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.bind() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being bind() must have thisArg');

    var argTypes = [
        JsigAST.param('thisArg', fnToCall.thisArg.value),
        JsigAST.param('firstArg', fnToCall.args[0].value)
    ];

    var returnArgs = [];

    for (var i = 1; i < fnToCall.args.length; i++) {
        returnArgs.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: argTypes,
        result: JsigAST.functionType({
            args: returnArgs,
            result: fnToCall.result
        }),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

function isDictionary(exprType) {
    return exprType && exprType.type === 'genericLiteral' &&
        exprType.value.type === 'typeLiteral' &&
        exprType.value.builtin && exprType.value.name === 'Object';
}

ASTVerifier.prototype._resolveInternalObjectCreate =
function _resolveInternalObjectCreate(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only object.create() in member expression');

    var returnType = null;

    var currExprType = this.meta.currentExpressionType;
    if (isDictionary(currExprType)) {
        returnType = this.meta.currentExpressionType;
    } else if (currExprType && currExprType.type === 'unionType') {
        for (var i = 0; i < currExprType.unions.length; i++) {
            if (isDictionary(currExprType.unions[i])) {
                returnType = currExprType.unions[i];
                break;
            }
        }

        if (!returnType) {
            returnType = JsigAST.literal('%Object%%Empty', true);
        }
    } else {
        // returnType = JsigAST.generic(
        //     JsigAST.literal('Object'),
        //     [
        //         JsigAST.literal('String'),
        //         JsigAST.freeLiteral('T')
        //     ]
        // );
        returnType = JsigAST.literal('%Object%%Empty', true);
    }

    var callFuncType = JsigAST.functionType({
        args: [
            JsigAST.param('parent', JsigAST.value('null'))
        ],
        result: returnType
    });

    return callFuncType;
};

ASTVerifier.prototype._tryResolveInternalFunction =
function _tryResolveInternalFunction(node, defn) {
    if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnCall'
    ) {
        return this._resolveInternalFnCall(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnBind'
    ) {
        return this._resolveInternalFnBind(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnApply'
    ) {
        return this._resolveInternalFnApply(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%ObjectCreate'
    ) {
        return this._resolveInternalObjectCreate(node, defn);
    }

    return defn;
};

ASTVerifier.prototype._tryResolveMacroCall =
function _tryResolveMacroCall(node, defn) {
    if (defn.type === 'macroLiteral') {
        var macroImpl = this.meta.getOrCreateMacro(defn);

        var fnToCall = macroImpl.resolveFunction(node, defn);
        return fnToCall;
    }

    return defn;
};

ASTVerifier.prototype.verifyCallExpression =
function verifyCallExpression(node) {
    var err;

    // TODO: support shadowing require...
    if (node.callee.type === 'Identifier' &&
        node.callee.name === 'require'
    ) {
        var typeDefn = this.meta.verifyNode(node.callee, null);
        assert(
            typeDefn.name === '%Require%%RequireFunction' &&
            typeDefn.builtin,
            'require must be the require function'
        );

        return this._getTypeFromRequire(node);
    }

    var defn = this._getTypeFromFunctionCall(node);
    if (!defn) {
        return null;
    }

    defn = this._tryResolveMacroCall(node, defn);
    if (!defn) {
        return null;
    }

    defn = this._tryResolveInternalFunction(node, defn);

    if (defn.type !== 'function' && defn.type !== 'intersectionType') {
        err = Errors.CallingNonFunctionObject({
            objType: this.meta.serializeType(defn),
            callExpression: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (defn.type === 'function') {
        return this._checkFunctionCallExpr(node, defn, false);
    }

    // Handle intersections

    var allErrors = [];
    var result = null;

    for (var i = 0; i < defn.intersections.length; i++) {
        var possibleFn = defn.intersections[i];

        var prevErrors = this.meta.getErrors();
        var beforeErrors = this.meta.countErrors();
        var possibleReturn = this._checkFunctionCallExpr(
            node, possibleFn, true
        );
        var afterErrors = this.meta.countErrors();

        if (beforeErrors === afterErrors && possibleReturn) {
            result = possibleReturn;
            break;
        } else {
            var currErrors = this.meta.getErrors();
            for (var j = beforeErrors; j < afterErrors; j++) {
                currErrors[j].branchType = this.meta.serializeType(possibleFn);
                allErrors.push(currErrors[j]);
            }
            this.meta.setErrors(prevErrors);
        }
    }

    if (result === null) {
        var args = [];
        for (i = 0; i < node.arguments.length; i++) {
            var argType = this.meta.verifyNode(node.arguments[i], null);
            if (!argType) {
                argType = JsigAST.literal('<TypeError for js expr `' +
                    this.meta.serializeAST(node.arguments[i]) + '`>');
            }
            args.push(argType);
        }

        var finalErr = Errors.FunctionOverloadCallMisMatch({
            expected: serialize(defn),
            actual: serialize(JsigAST.tuple(args)),
            funcName: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });

        finalErr.originalErrors = allErrors;
        this.meta.addError(finalErr);
    }

    return result;
};

function typeHasFreeLiteral(typeExpr) {
    var types = [];
    if (typeExpr.type === 'genericLiteral') {
        types.push(typeExpr);
    }
    if (typeExpr.type === 'unionType') {
        for (var i = 0; i < typeExpr.unions.length; i++) {
            var possibleType = typeExpr.unions[i];
            if (possibleType.type === 'genericLiteral') {
                types.push(possibleType);
            }
        }
    }

    for (i = 0; i < types.length; i++) {
        var actualType = types[i];
        if (actualType.type === 'genericLiteral' &&
            actualType.generics[0] &&
            actualType.generics[0].type === 'freeLiteral'
        ) {
            return true;
        }
    }

    return false;
}

ASTVerifier.prototype._updateFreeLiteralType =
function _updateFreeLiteralType(node, actualType, wantedType) {
    if (actualType.type === 'genericLiteral' &&
        actualType.generics[0] &&
        actualType.generics[0].type === 'freeLiteral'
    ) {
        assert(actualType.generics.length === wantedType.generics.length,
            'must have same number of generics');
        return JsigAST.generic(
            actualType.value, wantedType.generics.slice()
        );
    }

    // console.log('?', actualType);
    assert(actualType.type === 'unionType', 'must be a union');

    var newUnions = [];
    for (var i = 0; i < actualType.unions.length; i++) {
        var possibleType = actualType.unions[i];
        if (possibleType.type === 'genericLiteral' &&
            possibleType.generics[0] &&
            possibleType.generics[0].type === 'freeLiteral'
        ) {
            newUnions.push(
                this._updateFreeLiteralType(node, possibleType, wantedType)
            );
        } else {
            newUnions.push(possibleType);
        }
    }

    return computeSmallestUnion(node, JsigAST.union(newUnions));
};

ASTVerifier.prototype._checkFunctionCallArgument =
function _checkFunctionCallArgument(node, defn, index, isOverload) {
    var argNode = node.arguments[index];

    var wantedType = defn.args[index].value;
    if (defn.args[index].optional) {
        wantedType = JsigAST.union([
            wantedType, JsigAST.value('undefined')
        ]);
    }

    var actualType;
    if (argNode.type === 'Identifier' &&
        this.meta.currentScope.getUntypedFunction(
            argNode.name
        )
    ) {
        var funcName = argNode.name;
        if (!this.meta.tryUpdateFunction(funcName, wantedType)) {
            return false;
        }

        actualType = wantedType;
    } else if (argNode.type === 'FunctionExpression' &&
        isOverload
    ) {
        var beforeErrors = this.meta.countErrors();
        actualType = this.meta.verifyNode(argNode, wantedType);
        var afterErrors = this.meta.countErrors();
        if (!actualType || (beforeErrors !== afterErrors)) {
            this.meta.currentScope.revertFunctionScope(
                this.meta.getFunctionName(argNode), wantedType
            );
            return false;
        }
    } else {
        actualType = this.meta.verifyNode(argNode, wantedType);
    }

    if (!actualType) {
        return false;
    }

    // late bind a freeLiteral generic based on function calls
    // If an `Array<T>` is passed to a function and that function
    // expects Array<String> then convert it to Array<String>
    if (argNode.type === 'Identifier' &&
        typeHasFreeLiteral(actualType) &&
        wantedType && wantedType.type === 'genericLiteral'
    ) {
        var newType = this._updateFreeLiteralType(
            node, actualType, wantedType
        );
        this.meta.currentScope.forceUpdateVar(argNode.name, newType);
        actualType = newType;
    }

    /*  If a literal string value is expected AND
        A literal string value is passed as an argument
        a.k.a not an alias or field.

        Then convert the TypeLiteral into a ValueLiteral
     */
    if (wantedType.type === 'valueLiteral' &&
        wantedType.name === 'string' &&
        argNode.type === 'Literal' &&
        actualType.type === 'typeLiteral' &&
        actualType.builtin &&
        actualType.name === 'String' &&
        typeof actualType.concreteValue === 'string'
    ) {
        actualType = JsigAST.value(
            '"' + actualType.concreteValue + '"', 'string'
        );
    }

    // Handle tuple -> array mis-inference
    if (wantedType.type === 'genericLiteral' &&
        wantedType.value.name === 'Array' &&
        wantedType.value.builtin &&
        actualType.type === 'tuple' &&
        actualType.inferred &&
        argNode.type === 'Identifier'
    ) {
        var token = this.meta.currentScope.getVar(argNode.name);

        var self = this;
        newType = this._maybeConvertToArray(
            token, argNode.name, actualType,
            function verify(possibleArray) {
                return self.meta.checkSubType(
                    argNode, wantedType, possibleArray
                );
            }
        );

        if (newType) {
            actualType = newType;
        }
    }

    this.meta.checkSubType(argNode, wantedType, actualType);

    if (argNode.type === 'Identifier') {
        this.meta.currentScope.markVarAsAlias(
            argNode.name, null
        );
    }

    return true;
};

ASTVerifier.prototype._buildCannotCallGenericError =
function _buildCannotCallGenericError(oldDefn, node) {
    var args = [];
    if (oldDefn.thisArg) {
        var objType = null;
        if (node.type === 'NewExpression') {
            objType = oldDefn.thisArg;
        } else if (node.type === 'CallExpression') {
            objType = this.meta.tryResolveType(
                node.callee.object, null
            );
        }
        if (objType) {
            args.push('this: ' + this.meta.serializeType(objType));
        } else {
            args.push('<TypeError for js expr `' +
                this.meta.serializeAST(node.callee.object) + '`>'
            );
        }
    }
    for (var i = 0; i < node.arguments.length; i++) {
        var argType = this.meta.tryResolveType(
            node.arguments[i], null
        );
        if (argType) {
            args.push(this.meta.serializeType(argType));
        } else {
            args.push('<TypeError for js expr `' +
                this.meta.serializeAST(node.arguments[i]) + '`>'
            );
        }
    }

    var actualStr = '[' + args.join(', ') + ']';

    this.meta.addError(Errors.CannotCallGenericFunction({
        funcName: this.meta.serializeAST(node.callee),
        expected: this.meta.serializeType(oldDefn),
        actual: actualStr,
        loc: node.loc,
        line: node.loc.start.line
    }));
};

ASTVerifier.prototype._checkFunctionCallExpr =
function _checkFunctionCallExpr(node, defn, isOverload) {
    var err;

    if (defn.generics.length > 0) {
        // TODO: resolve generics
        var oldDefn = defn;
        defn = this.meta.resolveGeneric(defn, node);
        if (!defn) {
            this._buildCannotCallGenericError(oldDefn, node);
            return null;
        }
    }

    var minArgs = defn.args.length;
    for (var i = 0; i < defn.args.length; i++) {
        if (defn.args[i].optional) {
            minArgs--;
        }
    }

    if (node.arguments.length < minArgs) {
        err = Errors.TooFewArgsInCall({
            funcName: this.meta.serializeAST(node.callee),
            actualArgs: node.arguments.length,
            expectedArgs: minArgs,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    } else if (node.arguments.length > defn.args.length) {
        err = Errors.TooManyArgsInCall({
            funcName: this.meta.serializeAST(node.callee),
            actualArgs: node.arguments.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    }

    var minLength = Math.min(defn.args.length, node.arguments.length);
    for (i = 0; i < minLength; i++) {
        this._checkFunctionCallArgument(
            node, defn, i, isOverload
        );
    }

    // TODO: figure out thisType in call verification
    if (defn.thisArg) {
        assert(node.callee.type === 'MemberExpression',
            'must be a method call expression');

        // TODO: This could be wrong...
        var obj = this.meta.verifyNode(node.callee.object, null);
        assert(obj, 'object of method call must have a type');

        // Try to late-bound a concrete instance of a free variable
        // in a generic.
        if (defn.generics.length > 0 && obj.type === 'genericLiteral') {
            var hasFreeLiteral = obj.generics[0].type === 'freeLiteral';
            var thisArgType = defn.thisArg.value;

            assert(!defn.thisArg.optional, 'do not support optional this');
            assert(thisArgType.type === 'genericLiteral',
                'thisArg must be generic...');

            if (hasFreeLiteral) {
                assert(!isOverload,
                    'cannot resolve free literal in overloaded function'
                );

                var newGenerics = [];
                assert(obj.generics.length === thisArgType.generics.length,
                    'expected same number of generics');
                for (i = 0; i < obj.generics.length; i++) {
                    newGenerics[i] = thisArgType.generics[i];
                }

                var newType = JsigAST.generic(
                    obj.value, newGenerics
                );
                assert(node.callee.object.type === 'Identifier',
                    'object must be variable reference');

                this.meta.currentScope.forceUpdateVar(
                    node.callee.object.name, newType
                );
                obj = newType;
            }
        }

        assert(!defn.thisArg.optional, 'do not support optional this');
        this.meta.checkSubType(node.callee.object, defn.thisArg.value, obj);
    }

    /*
        Detect `Base.call(this)` pattern that is used to invoke
        the constructor of a base class.
    */
    var funcScope = this.meta.currentScope.getFunctionScope();
    if (funcScope && funcScope.isConstructor &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'call' &&
        node.arguments[0] &&
        node.arguments[0].type === 'ThisExpression'
    ) {
        var fnToCall = this.meta.verifyNode(node.callee.object, null);
        var thisArg = fnToCall.thisArg.value;

        if (thisArg && thisArg.type === 'object' &&
            thisArg.keyValues.length > 0
        ) {
            for (i = 0; i < thisArg.keyValues.length; i++) {
                funcScope.addKnownField(thisArg.keyValues[i].key);
            }
        }
    }

    if (defn.type === 'function' && defn.specialKind === 'assert') {
        var ifBranch = this.meta.allocateBranchScope();
        var elseBranch = this.meta.allocateBranchScope();

        this.meta.narrowType(node.arguments[0], ifBranch, elseBranch);

        // Since the assertion must hold true
        // We can copy over all type restrictions from the ifBranch
        // into the current scope of the call expression

        var restrictedTypes = ifBranch.getRestrictedTypes();
        for (i = 0; i < restrictedTypes.length; i++) {
            var name = restrictedTypes[i];
            var ifType = ifBranch.getVar(name);

            this.meta.currentScope.restrictType(name, ifType.defn);
        }
    }

    return defn.result;
};

ASTVerifier.prototype.verifyBinaryExpression =
function verifyBinaryExpression(node) {
    var leftType = this.meta.verifyNode(node.left, null);
    if (!leftType) {
        return null;
    }

    var rightType = this.meta.verifyNode(node.right, null);
    if (!rightType) {
        return null;
    }

    var operator = node.operator;
    var token = this.meta.getOperator(operator);
    assert(token, 'do not support unknown operators: ' + operator);

    var intersections = token.defn.type === 'intersectionType' ?
        token.defn.intersections : [token.defn];

    var defn;
    var correctDefn = intersections[0];
    var isBad = true;
    var errors = [];
    for (var i = 0; i < intersections.length; i++) {
        defn = intersections[i];

        assert(defn.args.length === 2,
            'expected type defn args to be two');

        var leftError = this.meta.checkSubTypeRaw(
            node.left, defn.args[0].value, leftType
        );
        var rightError = this.meta.checkSubTypeRaw(
            node.right, defn.args[1].value, rightType
        );

        if (!leftError && !rightError) {
            correctDefn = defn;
            isBad = false;
        } else {
            if (leftError) {
                leftError.branchType = this.meta.serializeType(defn);
                errors.push(leftError);
            }
            if (rightError) {
                rightError.branchType = this.meta.serializeType(defn);
                errors.push(rightError);
            }
        }
    }

    // TODO: better error message UX
    if (isBad && intersections.length === 1) {
        for (var j = 0; j < errors.length; j++) {
            this.meta.addError(errors[j]);
        }
    } else if (isBad && intersections.length > 1) {
        var finalErr = Errors.IntersectionOperatorCallMismatch({
            expected: serialize(token.defn),
            actual: serialize(JsigAST.tuple([leftType, rightType])),
            operator: node.operator,
            loc: node.loc,
            line: node.loc.start.line
        });

        finalErr.originalErrors = errors;
        this.meta.addError(finalErr);
    }

    if ((operator === '===' || operator === '!==') &&
        (isNeverLiteral(leftType) || isNeverLiteral(rightType))
    ) {
        return JsigAST.literal('Never', true);
    }

    return correctDefn.result;
};

function isNeverLiteral(type) {
    return type && type.type === 'typeLiteral' && type.builtin &&
        type.name === 'Never';
}

ASTVerifier.prototype.verifyReturnStatement =
function verifyReturnStatement(node) {
    var funcScope = this.meta.currentScope.getFunctionScope();
    assert(funcScope, 'return must be within a function scope');

    var defn;
    if (node.argument === null) {
        defn = JsigAST.literal('void');
    } else {
        var exprType = this.meta.currentScope.getReturnValueType();
        defn = this.meta.verifyNode(node.argument, exprType);

        if (defn && defn.type === 'genericLiteral' &&
            defn.generics[0] &&
            defn.generics[0].type === 'freeLiteral' &&
            node.argument.type === 'Identifier' &&
            exprType && exprType.type === 'genericLiteral'
        ) {
            var newGenerics = [];
            assert(exprType.generics.length === defn.generics.length,
                'expected same number of generics');
            for (var i = 0; i < exprType.generics.length; i++) {
                newGenerics[i] = exprType.generics[i];
            }

            var newType = JsigAST.generic(defn.value, newGenerics);
            this.meta.currentScope.forceUpdateVar(
                node.argument.name, newType
            );
            defn = newType;
        }

        // TODO: really really need to do better job checking returns
        if (exprType && defn) {
            this.meta.checkSubType(node.argument, exprType, defn);
        }
    }

    if (defn) {
        funcScope.markReturnType(defn, node);
    }
    return defn;
};

ASTVerifier.prototype.verifyNewExpression =
function verifyNewExpression(node) {
    var beforeError = this.meta.countErrors();
    var fnType = this.meta.verifyNode(node.callee, null);
    var afterError = this.meta.countErrors();

    if (!fnType) {
        if (beforeError === afterError) {
            assert(false, '!!! cannot call new on unknown function');
        }
        return null;
    }

    // Grab first function...
    if (fnType.type === 'intersectionType') {
        for (var i = 0; i < fnType.intersections.length; i++) {
            var possibleType = fnType.intersections[i];
            if (possibleType.type === 'function') {
                fnType = possibleType;
                break;
            }
        }
    }

    var err;
    if (fnType.type !== 'function') {
        err = Errors.CallingNewOnNonFunction({
            objType: this.meta.serializeType(fnType),
            funcName: node.callee.name,
            newExpression: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    assert(fnType.type === 'function', 'only support defined constructors');

    if (!fnType.thisArg) {
        err = Errors.CallingNewOnPlainFunction({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var thisArgType = fnType.thisArg.value;
    assert(!fnType.thisArg.optional, 'do not support optional this');

    var thisObjects = thisArgType.type === 'intersectionType' ?
        thisArgType.intersections : [thisArgType];

    for (i = 0; i < thisObjects.length; i++) {
        var thisObj = thisObjects[i];

        if (thisObj.type !== 'object' ||
            thisObj.keyValues.length === 0
        ) {
            var possibleThisArg = this._tryResolveVirtualType(thisObj);
            if (!possibleThisArg ||
                thisObj.name === 'String' ||
                thisObj.name === 'Number' ||
                possibleThisArg.type !== 'object' ||
                possibleThisArg.keyValues.length === 0
            ) {
                err = Errors.ConstructorThisTypeMustBeObject({
                    funcName: node.callee.name,
                    thisType: serialize(thisArgType),
                    loc: node.loc,
                    line: node.loc.start.line,
                    expected: '<ThisType>',
                    actual: possibleThisArg
                });
                this.meta.addError(err);
                return null;
            }
        }
    }

    if (fnType.result.type !== 'typeLiteral' ||
        fnType.result.name !== 'void'
    ) {
        err = Errors.ConstructorMustReturnVoid({
            funcName: node.callee.name,
            returnType: serialize(fnType.result),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var isConstructor = /[A-Z]/.test(getCalleeName(node)[0]);
    if (!isConstructor) {
        err = Errors.ConstructorMustBePascalCase({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    // Handle generic constructors
    if (fnType.generics.length > 0) {
        var oldDefn = fnType;
        fnType = this.meta.resolveGeneric(
            fnType, node, this.meta.currentExpressionType
        );
        if (!fnType) {
            this._buildCannotCallGenericError(oldDefn, node);
            return null;
        }

        thisArgType = fnType.thisArg.value;
    }

    var minArgs = fnType.args.length;
    for (i = 0; i < fnType.args.length; i++) {
        if (fnType.args[i].optional) {
            minArgs--;
        }
    }

    if (node.arguments.length > fnType.args.length) {
        err = Errors.TooManyArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: fnType.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    } else if (node.arguments.length < minArgs) {
        err = Errors.TooFewArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: minArgs,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    }

    var minLength = Math.min(fnType.args.length, node.arguments.length);
    for (i = 0; i < minLength; i++) {
        var wantedType = fnType.args[i].value;
        if (fnType.args[i].optional) {
            wantedType = JsigAST.union([
                wantedType, JsigAST.value('undefined')
            ]);
        }

        var actualType = this.meta.verifyNode(node.arguments[i], null);
        if (!actualType) {
            return null;
        }

        this.meta.checkSubType(node.arguments[i], wantedType, actualType);
    }

    thisArgType = cloneJSIG(thisArgType);
    thisArgType.brand = fnType.brand;
    thisArgType._raw = thisArgType._raw;

    return thisArgType;
};

function getCalleeName(node) {
    if (node.callee.type === 'Identifier') {
        return node.callee.name;
    } else if (node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier'
    ) {
        return node.callee.property.name;
    } else {
        assert(false, 'Cannot get callee name');
    }
}

ASTVerifier.prototype.verifyVariableDeclaration =
function verifyVariableDeclaration(node) {
    assert(node.declarations.length === 1,
        'only support single declaration');

    var decl = node.declarations[0];

    var id = decl.id.name;

    var token = this.meta.currentScope.getOwnVar(id);
    if (token) {
        assert(token.preloaded, 'cannot declare variable twice');
    }

    var leftType = token ? token.defn : null;

    if (decl.id.trailingComments &&
        decl.id.trailingComments.length > 0
    ) {
        var firstComment = decl.id.trailingComments[0];
        if (firstComment.value[0] === ':') {
            var expr = firstComment.value.slice(1);
            var declaredType = this.meta.parseTypeString(node, expr);
            if (declaredType && !leftType) {
                leftType = declaredType;
            }
        }
    }

    var type;
    if (decl.init) {

        var beforeErrors = this.meta.countErrors();
        type = this.meta.verifyNode(decl.init, leftType);
        var afterErrors = this.meta.countErrors();
        if (!type) {
            if (beforeErrors === afterErrors) {
                assert(false, '!!! could not find initType: ' +
                    this.meta.serializeAST(decl.init));
            }

            this.meta.currentScope.addUnknownVar(id);
            return null;
        }

        if (decl.init.type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                decl.init.name, id
            );
        }

        if (leftType) {
            this.meta.checkSubType(node, leftType, type);
            type = leftType;
        }
    } else {
        type = leftType ? leftType :
            JsigAST.literal('%Void%%Uninitialized', true);
    }

    if (type.type === 'valueLiteral' && type.name === 'null') {
        type = JsigAST.literal('%Null%%Default', true);
    }

    this.meta.currentScope.addVar(id, type);
    return null;
};

ASTVerifier.prototype.verifyForStatement =
function verifyForStatement(node) {
    this.meta.verifyNode(node.init, null);
    var testType = this.meta.verifyNode(node.test, null);

    assert(!testType || (
        testType.type === 'typeLiteral' && testType.name === 'Boolean'
    ), 'for loop condition statement must be a Boolean expression');

    this.meta.verifyNode(node.update, null);

    var forBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(forBranch);
    this.meta.verifyNode(node.body, null);
    this.meta.exitBranchScope();

    /*  A for loop runs 0 or more times.

        If a type changed in the body of the loop, then let the
        type outside of the loop be the union of the initial
        type and the loop body type
    */
    var currScope = this.meta.currentScope;
    var restrictedTypes = forBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var forType = forBranch.getOwnVar(name);
        var outerType = currScope.getOwnVar(name);

        if (!forType || !outerType) {
            continue;
        }

        if (forType.type === 'restriction') {
            var union = computeSmallestUnion(
                node, forType.defn, outerType.defn
            );

            currScope.restrictType(name, union);
        }
    }
};

ASTVerifier.prototype.verifyUpdateExpression =
function verifyUpdateExpression(node) {
    var firstType = this.meta.verifyNode(node.argument, null);
    if (!firstType) {
        return null;
    }

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0].value, firstType);

    return defn.result;
};

ASTVerifier.prototype.verifyObjectExpression =
function verifyObjectExpression(node) {
    return this.meta.inferType(node);
};

/*
    check test expression
    Allocate if branch scope ; Allocate else branch scope;
    narrowType(node, ifBranch, elseBranch);

    check if within ifBranch scope
    check else within elseBranch scope

    For each restriction that exists in both if & else.
    change the type of that identifier in function scope.
*/
ASTVerifier.prototype.verifyIfStatement =
function verifyIfStatement(node) {
    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    // TODO: check things ?
    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    var ifTestType = this.meta.verifyNode(node.test, null);
    this.meta.exitBranchScope();
    var isIfNeverType = ifTestType && ifTestType.type === 'typeLiteral' &&
        ifTestType.name === 'Never' && ifTestType.builtin;

    // If the expr evaluated to Never then the block is Never run.
    if (node.consequent && !isIfNeverType) {
        this.meta.enterBranchScope(ifBranch);
        this.meta.verifyNode(node.consequent, null);
        this.meta.exitBranchScope();
    }

    this.meta.enterBranchScope(elseBranch);
    var elseTestType = this.meta.verifyNode(node.test, null);
    this.meta.exitBranchScope();
    var isElseNeverType = elseTestType && elseTestType.type === 'typeLiteral' &&
        elseTestType.name === 'Never' && elseTestType.builtin;

    // If the expr evaluated to Always then the else block is Never run
    if (node.alternate && !isElseNeverType) {
        this.meta.enterBranchScope(elseBranch);
        var elseBlockType = this.meta.verifyNode(node.alternate, null);
        this.meta.exitBranchScope();

        // If we have an if statement with an early return
        // And the non-existant else block is Never type then
        // the if statement will always run and the rest
        // of the block will never run because of the early return
        if (node.alternate.type === 'IfStatement' &&
            isNeverLiteral(elseBlockType)
        ) {
            isElseNeverType = true;
        }
    }

    var isRestricted = [];

    var restrictedTypes = ifBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var ifType = ifBranch.getOwnVar(name);
        var elseType = elseBranch.getOwnVar(name);

        if (!ifType || !elseType) {
            continue;
        }

        if (isSameType(ifType.defn, elseType.defn)) {
            isRestricted.push(name);
            this.meta.currentScope.restrictType(name, ifType.defn);
        } else if (
            ifType.type === 'restriction' &&
            elseType.type === 'restriction'
        ) {
            var union = computeSmallestUnion(
                node, ifType.defn, elseType.defn
            );

            isRestricted.push(name);
            // console.log('wtf', {
            //     scopeType: this.meta.currentScope.type,
            //     name: name,
            //     union: this.meta.serializeType(union)
            // });
            this.meta.currentScope.restrictType(name, union);
        }
    }

    // TODO create unions based on typeRestrictions & mutations...

    // Support an early return if statement
    // If the `consequent` is a `ReturnStatement` then
    // copy over all type restrictions from the `elseBranch`
    // onto the current scope
    var lastStatement = null;
    if (node.consequent.type === 'BlockStatement') {
        var statements = node.consequent.body;
        lastStatement = statements[statements.length - 1];
    }

    if (node.consequent.type === 'BlockStatement' &&
        node.consequent.body.length > 0 &&
        (
            lastStatement.type === 'ReturnStatement' ||
            lastStatement.type === 'ContinueStatement'
        )
    ) {
        restrictedTypes = elseBranch.getRestrictedTypes();
        for (i = 0; i < restrictedTypes.length; i++) {
            name = restrictedTypes[i];
            elseType = elseBranch.getOwnVar(name);

            if (isRestricted.indexOf(name) === -1) {
                this.meta.currentScope.restrictType(name, elseType.defn);
            }
        }

        var restrictedThisType = elseBranch.getRestrictedThisType();
        if (restrictedThisType) {
            this.meta.currentScope.restrictType('this', restrictedThisType);
        }

        if (isElseNeverType &&
            lastStatement.type === 'ReturnStatement'
        ) {
            return JsigAST.literal('Never', true);
        }
    }

    return null;
};

ASTVerifier.prototype.verifyUnaryExpression =
function verifyUnaryExpression(node) {
    if (node.operator === 'delete') {
        this.meta.verifyNode(node.argument, null);
        var objectType = this.meta.verifyNode(node.argument.object, null);

        assert(objectType.type === 'genericLiteral',
            'delete must operate on generic objects');
        assert(objectType.value.type === 'typeLiteral' &&
            objectType.value.name === 'Object',
            'delete must operate on objects');

        return null;
    }

    var firstType = this.meta.verifyNode(node.argument, null);
    if (!firstType) {
        return null;
    }

    var operator = node.operator;
    if (operator === '+') {
        operator = '%Unary%%Plus';
    } else if (operator === '-') {
        operator = '%Unary%%Minus';
    }

    var token = this.meta.getOperator(operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0].value, firstType);

    if (operator === '%Unary%%Minus' &&
        firstType.type === 'typeLiteral' &&
        firstType.name === 'Number' &&
        firstType.concreteValue !== null
    ) {
        return JsigAST.literal('Number', true, {
            concreteValue: -firstType.concreteValue
        });
    }

    // The typeof operator, when evaluated on Never should
    // return Never instead of void. This allow the if condition
    // statement to mark a branch as Never if the typeof is
    // garantueed to fail.
    if (operator === 'typeof' && firstType.type === 'typeLiteral' &&
        firstType.name === 'Never' && firstType.builtin
    ) {
        return firstType;
    }

    return defn.result;
};

ASTVerifier.prototype.verifyLogicalExpression =
function verifyLogicalExpression(node) {
    assert(node.operator === '||' || node.operator === '&&',
        'only || and && are supported as logical operators');

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    var leftType = this.meta.verifyNode(node.left, null);
    if (!leftType) {
        return null;
    }

    this.meta.narrowType(node.left, ifBranch, elseBranch);

    if (node.operator === '&&') {
        this.meta.enterBranchScope(ifBranch);
    } else if (node.operator === '||') {
        this.meta.enterBranchScope(elseBranch);
    } else {
        assert(false, 'unsupported logical operator');
    }

    var exprType = null;
    if (node.operator === '||') {
        exprType = this.meta.currentExpressionType;
    }

    var rightType = this.meta.verifyNode(node.right, exprType);
    this.meta.exitBranchScope();
    if (!rightType) {
        return null;
    }

    var t1;
    var t2;
    if (node.operator === '||') {
        t1 = getUnionWithoutBool(leftType, true);
        t2 = rightType;
    } else if (node.operator === '&&') {
        t1 = getUnionWithoutBool(leftType, false);
        t2 = rightType;
    } else {
        assert(false, 'unimplemented operator');
    }

    return computeSmallestUnion(node, t1, t2);
};

ASTVerifier.prototype.verifyFunctionExpression =
function verifyFunctionExpression(node) {
    var funcName = this.meta.getFunctionName(node);

    var potentialType = this.meta.currentExpressionType;
    if (!potentialType) {
        var err = Errors.UnTypedFunctionExpressionFound({
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    // If we are assigning this function expression against
    // and unknown exports field then skip checking
    if (potentialType.type === 'typeLiteral' &&
        potentialType.builtin &&
        potentialType.name === '%Mixed%%UnknownExportsField' &&
        this.meta.checkerRules.allowUnusedFunction
    ) {
        return JsigAST.literal('%Mixed%%AllowedUnusedfunction', true);
    }

    // If we are assigning onto a Mixed%%OpenField then
    // skip checking this function expression
    if (potentialType.type === 'typeLiteral' &&
        potentialType.builtin &&
        (
            potentialType.name === '%Mixed%%OpenField' ||
            potentialType.name === '%Mixed%%UnknownExportsField' ||
            potentialType.name === '%Export%%ModuleExports'
        )
    ) {
        err = Errors.UnTypedFunctionExpressionFound({
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (potentialType.type !== 'function' &&
        potentialType.type !== 'unionType' &&
        potentialType.type !== 'intersectionType'
    ) {
        err = Errors.UnexpectedFunction({
            expected: this.meta.serializeType(potentialType),
            actual: 'Function',
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var wantedTypeText = this.meta.serializeType(potentialType);
    var cacheKey = funcName + '~type:~' + wantedTypeText;
    if (cacheKey in this._cachedFunctionExpressionTypes) {
        return this._cachedFunctionExpressionTypes[cacheKey];
    }

    var funcType = this._checkFunctionType(node, potentialType);
    this._cachedFunctionExpressionTypes[cacheKey] = funcType;
    return funcType;
};

ASTVerifier.prototype.verifyContinueStatement =
function verifyContinueStatement(node) {
    assert(node.label === null, 'do not support goto');

    return null;
};

ASTVerifier.prototype.verifyBreakStatement =
function verifyBreakStatement(node) {
    assert(node.label === null, 'do not support goto');

    return null;
};

ASTVerifier.prototype.verifyThrowStatement =
function verifyThrowStatement(node) {
    var argType = this.meta.verifyNode(node.argument, null);
    if (argType === null) {
        return null;
    }

    if (argType.brand !== 'Error') {
        this.meta.addError(Errors.InvalidThrowStatement({
            expected: 'Error',
            actual: this.meta.serializeType(argType),
            loc: node.loc,
            line: node.loc.start.line
        }));
    }

    return null;
};

ASTVerifier.prototype.verifyConditionalExpression =
function verifyConditionalExpression(node) {
    // TODO: support branch scopes

    this.meta.verifyNode(node.test, null);

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    var left = this.meta.verifyNode(node.consequent, null);
    this.meta.exitBranchScope();
    if (!left) {
        return null;
    }

    this.meta.enterBranchScope(elseBranch);
    var right = this.meta.verifyNode(node.alternate, null);
    this.meta.exitBranchScope();
    if (!right) {
        return null;
    }

    if (isSameType(left, right)) {
        return left;
    }

    return computeSmallestUnion(
        node, left, right
    );
};

ASTVerifier.prototype.verifyWhileStatement =
function verifyWhileStatement(node) {
    this.meta.verifyNode(node.test, null);

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    // TODO: check things ?
    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    this.meta.verifyNode(node.body, null);
    this.meta.exitBranchScope();
};

ASTVerifier.prototype.verifyTryStatement =
function verifyTryStatement(node) {
    assert(!node.finalizer, 'do not support try finally');

    var tryBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(tryBranch);
    this.meta.verifyNode(node.block, null);
    this.meta.exitBranchScope();

    var catchBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(catchBranch);
    this.meta.verifyNode(node.handler, null);
    this.meta.exitBranchScope();

    var restrictedTypes = tryBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var tryType = tryBranch.getOwnVar(name);
        var catchType = catchBranch.getOwnVar(name);

        if (!tryType || !catchType) {
            continue;
        }

        if (tryType.type === 'restriction' &&
            catchType.type === 'restriction'
        ) {
            var union = computeSmallestUnion(
                node, tryType.defn, catchType.defn
            );
            this.meta.currentScope.restrictType(name, union);
        }
    }
};

ASTVerifier.prototype.verifyCatchClause =
function verifyCatchClause(node) {
    assert(node.param.type === 'Identifier',
        'catch block param must be Identifier');

    this.meta.currentScope.addVar(
        node.param.name, this.checker.errorType
    );
    this.meta.verifyNode(node.body, null);
};

ASTVerifier.prototype._checkFunctionOverloadType =
function _checkFunctionOverloadType(node, defn) {
    this.meta.enterFunctionOverloadScope(node, defn);

    this._verifyFunctionType(node, defn);

    this.meta.exitFunctionScope();
};

ASTVerifier.prototype._checkFunctionType =
function _checkFunctionType(node, defn) {
    if (defn.type === 'unionType') {
        var functionCount = 0;
        var lastFunc = null;
        for (var i = 0; i < defn.unions.length; i++) {
            var maybeFunc = defn.unions[i];
            if (maybeFunc.type === 'function') {
                functionCount++;
                lastFunc = maybeFunc;
            }
        }

        assert(functionCount <= 1,
            'cannot verify against union of functions');
        if (functionCount === 1) {
            this._checkFunctionType(node, lastFunc);
            return lastFunc;
        } else {
            var err = Errors.UnexpectedFunction({
                expected: this.meta.serializeType(defn),
                actual: 'Function',
                funcName: this.meta.getFunctionName(node),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }
    } else if (defn.type === 'intersectionType') {
        var allTypes = defn.intersections;
        var anyFunction = false;
        for (i = 0; i < allTypes.length; i++) {
            var currType = allTypes[i];

            var isFunction = currType.type === 'function';
            if (!isFunction) {
                continue;
            }

            anyFunction = true;
            this._checkFunctionOverloadType(node, currType);
        }

        if (!anyFunction) {
            // TODO: actually show branches & originalErrors
            err = Errors.UnexpectedFunction({
                funcName: this.meta.getFunctionName(node),
                expected: this.meta.serializeType(currType),
                actual: this.meta.serializeType(JsigAST.literal('Function')),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }

        return defn;
    }

    this.meta.enterFunctionScope(node, defn);

    var actualType = this._verifyFunctionType(node, defn);

    this.meta.exitFunctionScope();

    return actualType;
};

ASTVerifier.prototype._verifyFunctionType =
function _verifyFunctionType(node, defn) {
    var beforeErrors = this.meta.countErrors();

    var err;
    if (node.params.length > defn.args.length) {
        err = Errors.TooManyArgsInFunc({
            funcName: this.meta.getFunctionName(node),
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    } else if (node.params.length < defn.args.length) {
        err = Errors.TooFewArgsInFunc({
            funcName: this.meta.getFunctionName(node),
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var statements = node.body.body;
    for (var i = 0; i < statements.length; i++) {
        if (statements[i].type === 'FunctionDeclaration') {
            var name = statements[i].id.name;
            this.meta.currentScope.addFunction(name, statements[i]);
        }
    }

    this.meta.verifyNode(node.body, null);

    var scope;
    if (this.meta.currentScope.isConstructor) {
        this._checkHiddenClass(node);

        scope = this.meta.currentScope;
        if (scope.knownReturnTypes.length > 0) {
            for (i = 0; i < scope.knownReturnTypes.length; i++) {
                this._checkVoidReturnType(
                    node,
                    scope.knownReturnTypes[i],
                    scope.returnStatementASTNodes[i]
                );
            }
        } else {
            this._checkVoidReturnType(node, null, null);
        }
    } else {
        // TODO: verify return.
        scope = this.meta.currentScope;
        if (scope.knownReturnTypes.length > 0) {
            for (i = 0; i < scope.knownReturnTypes.length; i++) {
                this._checkReturnType(
                    node,
                    scope.knownReturnTypes[i],
                    scope.returnStatementASTNodes[i]
                );
            }
        } else {
            this._checkReturnType(node, null, null);
        }
    }

    var afterErrors = this.meta.countErrors();
    if (beforeErrors !== afterErrors) {
        return null;
    }

    return defn;
};

ASTVerifier.prototype._checkHiddenClass =
function _checkHiddenClass(node) {
    var thisType = this.meta.currentScope.getThisType();
    var knownFields = this.meta.currentScope.knownFields;
    var protoFields = this.meta.currentScope.getPrototypeFields();

    var thisObjects = [];
    if (thisType && thisType.type === 'object') {
        thisObjects.push(thisType);
    } else if (thisType && thisType.type === 'intersectionType') {
        for (var i = 0; i < thisType.intersections.length; i++) {
            if (thisType.intersections[i].type === 'object') {
                thisObjects.push(thisType.intersections[i]);
            }
        }
    }

    var err;
    if (thisObjects.length === 0) {
        // console.log('thisType?', thisType, thisObjects);

        err = Errors.ConstructorThisTypeMustBeObject({
            funcName: this.meta.currentScope.funcName,
            thisType: thisType ? serialize(thisType) : 'void',
            expected: '<ThisType>',
            actual: 'void',
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
    }

    var knownOffset = 0;
    for (i = 0; i < thisObjects.length; i++) {
        var thisObj = thisObjects[i];

        assert(thisObj && thisObj.type === 'object',
            'this field must be object');

        for (var j = 0; j < thisObj.keyValues.length; j++) {
            var key = thisObj.keyValues[j].key;
            if (
                knownFields[knownOffset] !== key &&
                !(protoFields && protoFields[key])
            ) {
                err = Errors.MissingFieldInConstr({
                    fieldName: key,
                    funcName: this.meta.currentScope.funcName,
                    otherField: knownFields[knownOffset] || 'no-field',
                    loc: node.loc,
                    line: node.loc.start.line
                });// new Error('missing field: ' + key);
                this.meta.addError(err);
            }

            knownOffset++;
        }
    }
};

ASTVerifier.prototype._checkReturnType =
function _checkReturnType(node, actual, returnNode) {
    var expected = this.meta.currentScope.returnValueType;
    var err;

    // If we never inferred the return type then it may or may not return
    if (expected.type === 'typeLiteral' &&
        expected.name === '%Void%%UnknownReturn'
    ) {
        return;
    }

    if (expected.type === 'typeLiteral' && expected.name === 'void') {
        if (actual !== null && !(
            actual.type === 'typeLiteral' && actual.name === 'void'
        )) {
            err = Errors.NonVoidReturnType({
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
        err = Errors.MissingReturnStatement({
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
function _checkVoidReturnType(node, actualReturnType, returnNode) {
    var returnType = this.meta.currentScope.returnValueType;

    var err;
    if (returnNode || actualReturnType !== null) {
        var returnTypeInfo = serialize(actualReturnType);
        err = Errors.ReturnStatementInConstructor({
            funcName: this.meta.currentScope.funcName,
            returnType: returnTypeInfo === 'void' ?
                'empty return' : returnTypeInfo,
            line: returnNode.loc.start.line,
            loc: returnNode.loc
        });
        this.meta.addError(err);
        return;
    }

    // console.log('?', this.meta.serializeType(returnType));
    assert(returnType.type === 'typeLiteral' && (
        returnType.name === 'void' ||
        returnType.name === '%Void%%UnknownReturn'
    ), 'expected Constructor to have no return void');
};

ASTVerifier.prototype._tryResolveVirtualType =
function _tryResolveVirtualType(type) {
    var newType = null;

    if (type.type === 'genericLiteral' &&
        type.value.type === 'typeLiteral' &&
        type.value.name === 'Array' && type.value.builtin
    ) {
        newType = this.meta.getVirtualType('TArray').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'String' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TString').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'Number' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TNumber').defn;
    } else if (type.type === 'function') {
        newType = this.meta.getVirtualType('TFunction').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'Date' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TDate').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'RegExp' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TRegExp').defn;
    } else if (type.type === 'genericLiteral' &&
        type.value.type === 'typeLiteral' &&
        type.value.name === 'Object' && type.value.builtin
    ) {
        newType = this.meta.getVirtualType('TObject').defn;
    }

    return newType;
};

ASTVerifier.prototype._findPropertyInType =
function _findPropertyInType(node, jsigType, propertyName) {
    if (jsigType.type === 'function' &&
        propertyName === 'prototype'
    ) {
        return jsigType.thisArg.value;
    }

    var isDictionaryType = jsigType.type === 'genericLiteral' &&
        jsigType.value.type === 'typeLiteral' &&
        jsigType.value.builtin &&
        jsigType.value.name === 'Object';

    var possibleType = this._tryResolveVirtualType(jsigType);
    if (possibleType) {
        jsigType = possibleType;
    }

    var isExportsObject = false;
    if (jsigType.type === 'typeLiteral' &&
        jsigType.builtin && jsigType.name === '%Export%%ExportsObject'
    ) {
        isExportsObject = true;
        var newType = this.meta.getModuleExportsType();
        if (newType) {
            jsigType = newType;
        }
    }

    return this._findPropertyInSet(
        node, jsigType, propertyName, isExportsObject, isDictionaryType
    );
};

ASTVerifier.prototype._findPropertyInSet =
function _findPropertyInSet(
    node, jsigType, propertyName, isExportsObject, isDictionaryType
) {
    if (jsigType.type === 'unionType') {
        /*  Access the field on all types. Then build a union of
            them if the access succeeds.
        */

        var fieldUnion = [];

        for (var i = 0; i < jsigType.unions.length; i++) {
            var fieldType = this._findPropertyInType(
                node, jsigType.unions[i], propertyName,
                isExportsObject, isDictionaryType
            );
            if (!fieldType) {
                return null;
            }

            fieldUnion.push(fieldType);
        }

        var union = computeSmallestUnion(
            node, JsigAST.union(fieldUnion)
        );

        return union;
    }

    if (jsigType.type === 'intersectionType' &&
        propertyName === 'prototype'
    ) {
        // Count functions
        var funcCount = 0;
        var funcType = null;
        var intersections = jsigType.intersections;
        for (i = 0; i < intersections.length; i++) {
            var possibleType = intersections[i];
            if (possibleType.type === 'function') {
                funcType = possibleType;
                funcCount++;
            }
        }

        assert(funcCount <= 1, 'cannot access prototype fields ' +
            'on overloaded constructors...');

        if (funcType.thisArg.value) {
            return funcType.thisArg.value;
        }
    }

    // TODO: Naive intersection support, find first object.
    if (jsigType.type === 'intersectionType') {
        intersections = jsigType.intersections;
        for (i = 0; i < intersections.length; i++) {
            possibleType = intersections[i];
            if (possibleType.type !== 'object') {
                continue;
            }

            for (var j = 0; j < possibleType.keyValues.length; j++) {
                var pair = possibleType.keyValues[j];
                if (pair.key === propertyName) {
                    return this._findPropertyInType(
                        node, possibleType, propertyName,
                        isExportsObject, isDictionaryType
                    );
                }
            }
        }
    }

    return this._findPropertyInObject(
        node, jsigType, propertyName, isExportsObject, isDictionaryType
    );
};

ASTVerifier.prototype._isAssigningMethodOnExportsPrototype =
function _isAssigningMethodOnExportsPrototype(node) {
    // If we are assigning a method to the exported class
    if (this.meta.currentScope.type === 'file' &&
        node.object.type === 'MemberExpression' &&
        node.object.property.name === 'prototype' &&
        node.object.object.type === 'Identifier'
    ) {

        var expected = this.meta.currentScope.getExportedIdentifier();
        var actual = node.object.object.name;

        if (expected === actual) {
            return true;
        }
    }

    return false;
};

ASTVerifier.prototype._findPropertyInObject =
function _findPropertyInObject(
    node, jsigType, propertyName, isExportsObject, isDictionaryType
) {
    if (jsigType.type !== 'object') {
        if (this.meta.checkerRules.partialExport &&
            this._isAssigningMethodOnExportsPrototype(node)
        ) {
            return JsigAST.literal('%Mixed%%UnknownExportsField', true);
        }

        // Handle tuple -> array mis-inference
        if (jsigType.type === 'tuple' && jsigType.inferred &&
            node.object.type === 'Identifier'
        ) {
            var identifierName = node.object.name;
            var token = this.meta.currentScope.getVar(identifierName);

            var self = this;
            var newType = this._maybeConvertToArray(
                token, identifierName, jsigType,
                function verify(possibleArray) {
                    return self._findPropertyInType(
                        node, possibleArray, propertyName
                    );
                }
            );

            if (newType) {
                return this._findPropertyInType(
                    node, newType, propertyName
                );
            }
        }

        this.meta.addError(Errors.NonObjectFieldAccess({
            loc: node.loc,
            line: node.loc.start.line,
            actual: serialize(jsigType),
            expected: '{ ' + propertyName + ': T }',
            fieldName: propertyName,
            nonObjectType: serialize(jsigType)
        }));
        return null;
    }

    for (var i = 0; i < jsigType.keyValues.length; i++) {
        var keyValue = jsigType.keyValues[i];
        if (keyValue.key === propertyName) {
            // TODO: handle optional fields
            return keyValue.value;
        }
    }

    // If open and mutation then allow mixed type.
    if (jsigType.open && this.meta.currentScope.writableTokenLookup) {
        return JsigAST.literal('%Mixed%%OpenField', true);
    } else if (jsigType.open) {
        // If open and accessing outside of assignment
        // Then accessing any unknown field returns undefined

        return JsigAST.value('undefined');
    }

    if (isExportsObject && this.meta.checkerRules.partialExport) {
        return JsigAST.literal('%Mixed%%UnknownExportsField', true);
    }

    if (this.meta.checkerRules.partialExport &&
        this._isAssigningMethodOnExportsPrototype(node)
    ) {
        return JsigAST.literal('%Mixed%%UnknownExportsField', true);
    }

    // Fallback to property lookup...
    if (isDictionaryType) {
        var objType = this.meta.verifyNode(node.object, null);
        var propType = JsigAST.literal('String', true);
        return this._findTypeInContainer(node, objType, propType);
    }

    var err = this._createNonExistantFieldError(node, jsigType, propertyName);
    this.meta.addError(err);
    return null;
};

ASTVerifier.prototype._maybeConvertToArray =
function _maybeConvertToArray(token, identifierName, oldType, verify) {
    // TODO: check that there is IdentifierToken
    // for this `jsigType` and that is inferred=true

    // Only safe to convert to array
    // If there are no aliases
    // Track aliases on the scope.IdentifierToken
    // Increment alias count when
    //  - VarStatement with init is reference
    //  - Assignment where right hand side is reference

    // Then we want to try() to convert to array
    // and see if the property lookup succeeds
    // if so change, forceUpdateVar() and set the
    // inferred flag on the IdentifierToken to false
    if (!token || !token.inferred || token.aliasCount > 0) {
        return null;
    }

    var invalidArray = false;
    var arrayItemType = oldType.values[0];
    for (var i = 1; i < oldType.values.length; i++) {
        var t = oldType.values[i];
        if (!isSameType(t, arrayItemType)) {
            invalidArray = true;
            break;
        }
    }

    if (invalidArray) {
        return null;
    }

    var possibleArray = JsigAST.generic(
        JsigAST.literal('Array'), [arrayItemType]
    );

    var prevErrors = this.meta.getErrors();
    var beforeErrors = this.meta.countErrors();

    var lookupType = verify(possibleArray);

    var afterErrors = this.meta.countErrors();

    // Could not resolve MemberExpression with array.
    if (!lookupType || (beforeErrors !== afterErrors)) {
        this.meta.setErrors(prevErrors);
        return null;
    }

    // Convert tuple identifier -> array identifier
    this.meta.currentScope.forceUpdateVar(identifierName, possibleArray);

    // console.log('possibly misinferred tuple', {
    //     jsigType: this.meta.serializeType(oldType),
    //     token: token,
    //     node: node,
    //     possibleArray: this.meta.serializeType(possibleArray)
    // });

    return possibleArray;
};

ASTVerifier.prototype._findTypeInContainer =
function _findTypeInContainer(node, objType, propType) {
    // Do union logic
    if (objType.type === 'unionType') {
        var unionTypes = [];
        for (var i = 0; i < objType.unions.length; i++) {
            var valueType = this._findTypeInSingleContainer(
                node, objType.unions[i], propType
            );

            if (!valueType) {
                return null;
            }

            unionTypes.push(valueType);
        }

        var union = computeSmallestUnion(
            node, JsigAST.union(unionTypes)
        );

        // console.log('_findTypeInContainer()', {
        //     unionTypes: unionTypes.map(this.meta.serializeType),
        //     union: this.meta.serializeType(union)
        // });

        return union;
    }

    return this._findTypeInSingleContainer(node, objType, propType);
};

ASTVerifier.prototype._findTypeInSingleContainer =
function _findTypeInSingleContainer(node, objType, propType) {
    var valueType;

    if (objType.type === 'tuple') {
        return this._findTypeInTuple(node, objType, propType);
    }

    if (objType.type !== 'genericLiteral') {
        this.meta.addError(Errors.NonGenericPropertyLookup({
            expected: 'Array<T> | Object<K, V>',
            actual: this.meta.serializeType(objType),
            propType: this.meta.serializeType(propType),
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    if (objType.value.name === 'Array') {
        this.meta.checkSubType(node, ARRAY_KEY_TYPE, propType);

        valueType = objType.generics[0];
    } else if (objType.value.name === 'Object') {
        this.meta.checkSubType(node, objType.generics[0], propType);

        valueType = objType.generics[1];
    } else {
        assert(false, 'Cannot look inside non Array/Object container');
    }

    assert(valueType, 'expected valueType to exist');
    return valueType;
};

ASTVerifier.prototype._findTypeInTuple =
function _findTypeInTuple(node, objType, propType) {
    if (node.property.type === 'Literal' &&
        propType.type === 'typeLiteral' &&
        propType.name === 'Number' &&
        propType.concreteValue !== null
    ) {
        var propIndex = propType.concreteValue;
        if (objType.values[propIndex]) {
            return objType.values[propIndex];
        }

        this.meta.addError(Errors.OutOfBoundsTupleAccess({
            actual: this.meta.serializeType(objType),
            index: propIndex,
            actualLength: objType.values.length,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    } else if (
        node.property.type === 'UnaryExpression' &&
        node.property.operator === '-' &&
        node.property.argument.type === 'Literal' &&
        propType.type === 'typeLiteral' &&
        propType.name === 'Number' &&
        propType.concreteValue !== null
    ) {
        this.meta.addError(Errors.OutOfBoundsTupleAccess({
            actual: this.meta.serializeType(objType),
            index: propType.concreteValue,
            actualLength: objType.values.length,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    } else if (
        propType.type === 'typeLiteral' &&
        propType.name === 'Number'
    ) {
        this.meta.addError(Errors.DynamicTupleAccess({
            actual: this.meta.serializeType(objType),
            identifier: this.meta.serializeAST(node.property),
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    this.meta.addError(Errors.NonNumericTupleAccess({
        actual: this.meta.serializeType(propType),
        expected: 'Number',
        tupleValue: this.meta.serializeType(objType),
        loc: node.loc,
        line: node.loc.start.line
    }));
    return null;
};

ASTVerifier.prototype._createNonExistantFieldError =
function _createNonExistantFieldError(node, jsigType, propName) {
    var objName;
    if (node.object.type === 'ThisExpression') {
        objName = 'this';
    } else if (node.object.type === 'Identifier') {
        objName = node.object.name;
    } else if (node.object.type === 'MemberExpression') {
        objName = this.meta.serializeAST(node.object);
    } else if (node.object.type === 'CallExpression') {
        objName = this.meta.serializeAST(node.object);
    } else {
        assert(false, 'unknown object type');
    }

    var actualType = jsigType;

    if (actualType.type === 'typeLiteral' &&
        actualType.builtin && actualType.name === '%Export%%ExportsObject'
    ) {
        actualType = this.meta.getModuleExportsType();
    }

    return Errors.NonExistantField({
        fieldName: propName,
        objName: objName,
        expected: '{ ' + propName + ': T }',
        actual: serialize(actualType),
        loc: node.loc,
        line: node.loc.start.line
    });
};

ASTVerifier.prototype._getTypeFromRequire =
function _getTypeFromRequire(node) {
    assert(node.callee.name === 'require', 'func name must be require');

    var arg = node.arguments[0];
    assert(arg.type === 'Literal' && typeof arg.value === 'string',
        'arg to require must be a string literal');

    var depPath = arg.value;

    // Handle pre-defined npm case
    var externDefn = this.checker.getDefinition(depPath);
    if (externDefn) {
        if (depPath === 'assert' &&
            externDefn.defn.type === 'function'
        ) {
            externDefn.defn.specialKind = 'assert';
        }

        return externDefn.defn;
    }

    // Resolve a local file name
    var fileName = this._resolvePath(node, depPath, this.folderName);
    if (!fileName) {
        if (this.meta.checkerRules.allowUnknownRequire) {
            return JsigAST.literal('%Mixed%%UnknownRequire', true);
        }

        // TODO: search for type defintions inside node_modules/*
        this.meta.addError(Errors.MissingDefinition({
            moduleName: depPath,
            line: node.loc.start.line,
            loc: node.loc
        }));
        return null;
    }

    // Handle local case
    var otherMeta = this.checker.getOrCreateMeta(fileName, {
        loose: false
    });
    if (!otherMeta) {
        return null;
    }

    if (!otherMeta.moduleExportsType) {
        return JsigAST.literal('void', true);
    }

    return otherMeta.moduleExportsType;
};

ASTVerifier.prototype._resolvePath =
function resolvePath(node, possiblePath, dirname) {
    if (possiblePath[0] === path.sep) {
        // is absolute path
        return possiblePath;
    } else if (possiblePath[0] === '.') {
        // is relative path
        return path.resolve(dirname, possiblePath);
    } else {
        return null;
    }
};

// hoisting function declarations to the bottom makes the tree
// order algorithm simpler
function splitFunctionDeclaration(nodes) {
    var result = {
        functions: [],
        statements: []
    };

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'FunctionDeclaration') {
            result.statements.push(nodes[i]);
        }
    }

    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'FunctionDeclaration') {
            result.functions.push(nodes[i]);
        }
    }

    return result;
}

