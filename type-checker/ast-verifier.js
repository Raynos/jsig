'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

var console = require('console');
var assert = require('assert');
var path = require('path');

var JsigAST = require('../ast.js');
var serialize = require('../serialize.js');
var Errors = require('./errors.js');
var isSameType = require('./lib/is-same-type.js');
var getUnionWithoutBool = require('./lib/get-union-without-bool.js');

var ARRAY_KEY_TYPE = JsigAST.literal('Number');

module.exports = ASTVerifier;

function ASTVerifier(meta, checker, fileName) {
    this.meta = meta;
    this.checker = checker;
    this.fileName = fileName;
    this.folderName = path.dirname(fileName);
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
    } else if (node.type === 'IfStatement') {
        return this.verifyIfStatement(node);
    } else if (node.type === 'UnaryExpression') {
        return this.verifyUnaryExpression(node);
    } else if (node.type === 'LogicalExpression') {
        return this.verifyLogicalExpression(node);
    } else if (node.type === 'FunctionExpression') {
        return this.verifyFunctionExpression(node);
    } else {
        throw new Error('!! skipping verifyNode: ' + node.type);
    }
};

ASTVerifier.prototype.verifyProgram =
function verifyProgram(node) {
    node.body = hoistFunctionDeclaration(node.body);

    this.meta.setModuleExportsNode(node);

    this.meta.loadHeaderFile();

    var i = 0;
    for (i = 0; i < node.body.length; i++) {
        if (node.body[i].type === 'FunctionDeclaration') {
            var name = node.body[i].id.name;

            if (!this.meta.currentScope.getVar(name)) {
                this.meta.currentScope.addFunction(name, node.body[i]);
            }
        }
    }

    for (i = 0; i < node.body.length; i++) {
        this.meta.verifyNode(node.body[i]);
    }
};

ASTVerifier.prototype.verifyFunctionDeclaration =
function verifyFunctionDeclaration(node) {
    var funcName = node.id.name;

    var token = this.meta.currentScope.getVar(funcName);
    if (!token) {
        var err = Errors.UnTypedFunctionFound({
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

/*eslint max-statements: [2, 60]*/
ASTVerifier.prototype.verifyAssignmentExpression =
function verifyAssignmentExpression(node) {
    this.meta.currentScope.setWritableTokenLookup();
    var beforeError = this.meta.countErrors();
    var leftType = this.meta.verifyNode(node.left);
    var afterError = this.meta.countErrors();
    this.meta.currentScope.unsetWritableTokenLookup();
    if (!leftType) {
        if (afterError === beforeError) {
            console.warn('!!! could not find leftType: ',
                this.meta.serializeAST(node));
        }
        return null;
    }

    var rightType;
    if (node.right.type === 'Identifier' &&
        this.meta.currentScope.getFunction(node.right.name)
    ) {
        if (leftType.name === 'Any:ModuleExports') {
            this.meta.addError(Errors.UnknownModuleExports({
                funcName: node.right.name,
                loc: node.loc,
                line: node.loc.start.line
            }));
            return null;
        }

        this.meta.currentScope.updateFunction(
            node.right.name, leftType
        );
        rightType = leftType;
    } else {
        this.meta.currentScope.enterAssignment(leftType);
        rightType = this.meta.verifyNode(node.right);
        this.meta.currentScope.exitAssignment();
    }

    if (!rightType) {
        return null;
    }

    var isDefault = leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === 'Null:Default';

    if (!isDefault) {
        this.meta.checkSubType(node, leftType, rightType);
    }

    if (node.left.type === 'Identifier') {
        this.meta.currentScope.updateVar(node.left.name, rightType);
    }

    if (leftType.name === 'Any:ModuleExports') {
        assert(node.right.type === 'Identifier',
            'export must be identifier');

        this.meta.setModuleExportsType(rightType, node.right);
    }

    var funcScope = this.meta.currentScope.getFunctionScope();
    if (funcScope && funcScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        funcScope.addKnownField(node.left.property.name);
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

    var valueType;
    if (!node.computed) {
        valueType = this._findPropertyInType(node, objType, propName);
    } else {
        var propType = this.meta.verifyNode(node.property);
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

ASTVerifier.prototype.verifyCallExpression =
function verifyCallExpression(node) {
    var defn;
    var token;

    if (node.callee.type === 'Identifier' &&
        node.callee.name === 'require'
    ) {
        return this._getTypeFromRequire(node);
    }

    if (node.callee.type === 'Identifier') {
        token = this.meta.currentScope.getVar(node.callee.name);
        if (token) {
            defn = token.defn;
        } else {
            defn = this.meta.inferType(node);
        }

        if (!defn) {
            var err = Errors.UnTypedFunctionCall({
                funcName: node.callee.name,
                callExpression: this.meta.serializeAST(node.callee),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }
    } else {
        defn = this.verifyNode(node.callee);
        if (!defn) {
            return null;
        }
    }

    if (defn.generics.length > 0) {
        // TODO: resolve generics
        defn = this.meta.resolveGeneric(defn, node);
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
            expectedArgs: defn.args.length,
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
        var wantedType = defn.args[i];

        var actualType;
        if (node.arguments[i].type === 'Identifier' &&
            this.meta.currentScope.getFunction(node.arguments[i].name)
        ) {
            this.meta.currentScope.updateFunction(
                node.arguments[i].name, wantedType
            );
            actualType = wantedType;
        } else {
            actualType = this.meta.verifyNode(node.arguments[i]);
        }

        if (!actualType) {
            return null;
        }

        this.meta.checkSubType(node.arguments[i], wantedType, actualType);
    }

    // TODO: figure out thisType in call verification
    if (defn.thisArg) {
        assert(node.callee.type === 'MemberExpression',
            'must be a method call expression');

        // TODO: This could be wrong...
        var obj = this.meta.verifyNode(node.callee.object);
        assert(obj, 'object of method call must have a type');

        this.meta.checkSubType(node.callee.object, defn.thisArg, obj);
    }

    return defn.result;
};

ASTVerifier.prototype.verifyBinaryExpression =
function verifyBinaryExpression(node) {
    var leftType = this.meta.verifyNode(node.left);
    if (!leftType) {
        return null;
    }

    var rightType = this.meta.verifyNode(node.right);
    if (!rightType) {
        return null;
    }

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var unions = token.defn.type === 'unionType' ?
        token.defn.unions : [token.defn];

    var defn;
    var correctDefn = unions[0];
    var isBad = true;
    for (var i = 0; i < unions.length; i++) {
        defn = unions[i];

        assert(defn.args.length === 2,
            'expected type defn args to be two');

        var isLeft = this.meta.isSubType(node.left, defn.args[0], leftType);
        var isRight = this.meta.isSubType(node.right, defn.args[1], rightType);

        if (isLeft && isRight) {
            correctDefn = defn;
            isBad = false;
        }
    }

    // TODO: better error message UX
    if (isBad) {
        for (i = 0; i < unions.length; i++) {
            defn = unions[i];

            this.meta.checkSubType(node.left, defn.args[0], leftType);
            this.meta.checkSubType(node.right, defn.args[1], rightType);
        }
    }

    return correctDefn.result;
};

ASTVerifier.prototype.verifyReturnStatement =
function verifyReturnStatement(node) {
    var defn;
    if (node.argument === null) {
        defn = JsigAST.literal('void');
    } else {
        defn = this.meta.verifyNode(node.argument);
    }

    var funcScope = this.meta.currentScope.getFunctionScope();
    assert(funcScope, 'return must be within a function scope');

    if (defn) {
        funcScope.markReturnType(defn, node);
    }
    return defn;
};

ASTVerifier.prototype.verifyNewExpression =
function verifyNewExpression(node) {
    var beforeError = this.meta.countErrors();
    var fnType = this.meta.verifyNode(node.callee);
    var afterError = this.meta.countErrors();

    if (!fnType) {
        if (beforeError === afterError) {
            console.warn('!!! cannot call new on unknown function');
        }
        return null;
    }

    assert(fnType.type === 'function', 'only support defined constructors');

    var err;
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

    if (fnType.thisArg.type !== 'object' ||
        fnType.thisArg.keyValues.length === 0
    ) {
        err = Errors.ConstructorThisTypeMustBeObject({
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
        err = Errors.ConstructorMustReturnVoid({
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
        err = Errors.ConstructorMustBePascalCase({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
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
    } else if (node.arguments.length < fnType.args.length) {
        err = Errors.TooFewArgsInNewExpression({
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
        if (!actualType) {
            return null;
        }

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
    if (!type) {
        this.meta.currentScope.addUnknownVar(id);
        return null;
    }

    if (type.type === 'valueLiteral' && type.name === 'null') {
        type = JsigAST.literal('Null:Default', true);
    }

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
    if (!firstType) {
        return null;
    }

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
    this.meta.verifyNode(node.test);

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    // TODO: check things ?
    this.meta.narrowType(node.test, ifBranch, elseBranch);

    if (node.consequent) {
        this.meta.enterBranchScope(ifBranch);
        this.meta.verifyNode(node.consequent);
        this.meta.exitBranchScope();
    }
    if (node.alternative) {
        this.meta.enterBranchScope(elseBranch);
        this.meta.verifyNode(node.alternative);
        this.meta.exitBranchScope();
    }

    var keys = Object.keys(ifBranch.typeRestrictions);
    for (var i = 0; i < keys.length; i++) {
        var name = keys[i];
        var ifType = ifBranch.typeRestrictions[name];
        var elseType = elseBranch.typeRestrictions[name];

        if (isSameType(ifType.defn, elseType.defn)) {
            this.meta.currentScope.restrictType(name, ifType.defn);
        }
    }
};

ASTVerifier.prototype.verifyUnaryExpression =
function verifyUnaryExpression(node) {
    if (node.operator === 'delete') {
        this.meta.verifyNode(node.argument);
        var objectType = this.meta.verifyNode(node.argument.object);

        assert(objectType.type === 'genericLiteral',
            'delete must operate on generic objects');
        assert(objectType.value.type === 'typeLiteral' &&
            objectType.value.name === 'Object',
            'delete must operate on objects');

        return null;
    }

    var firstType = this.meta.verifyNode(node.argument);
    if (!firstType) {
        return null;
    }

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0], firstType);

    return defn.result;
};

ASTVerifier.prototype.verifyLogicalExpression =
function verifyLogicalExpression(node) {
    var leftType = this.meta.verifyNode(node.left);
    if (!leftType) {
        return null;
    }

    var rightType = this.meta.verifyNode(node.right);
    if (!rightType) {
        return null;
    }

    if (node.operator !== '||' && node.operator !== '&&') {
        var token = this.meta.getOperator(node.operator);
        assert(token, 'do not support unknown operator: ' + node.operator);

        var defn = token.defn;
        assert(defn.args.length === 2,
            'expected type defn args to be two');

        this.meta.checkSubType(node.left, defn.args[0], leftType);
        this.meta.checkSubType(node.right, defn.args[1], rightType);

        return defn.result;
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

    if (!t1) {
        return t2;
    }

    if (isSameType(t1, t2)) {
        return t1;
    }

    return JsigAST.union([t1, t2]);
};

ASTVerifier.prototype.verifyFunctionExpression =
function verifyFunctionExpression(node) {
    var potentialType = this.meta.currentScope.currentAssignmentType;
    if (!potentialType) {
        var err = Errors.UnTypedFunctionFound({
            funcName: node.id.name,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    this._checkFunctionType(node, potentialType);
    return potentialType;
};

ASTVerifier.prototype._checkFunctionType =
function checkFunctionType(node, defn) {
    this.meta.enterFunctionScope(node, defn);

    var err;
    if (node.params.length > defn.args.length) {
        err = Errors.TooManyArgsInFunc({
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
        err = Errors.TooFewArgsInFunc({
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
function _checkHiddenClass(node) {
    var thisType = this.meta.currentScope.getThisType();
    var knownFields = this.meta.currentScope.knownFields;
    var protoFields = this.meta.currentScope.getPrototypeFields();

    var err;
    if (!thisType || thisType.type !== 'object') {
        err = Errors.ConstructorThisTypeMustBeObject({
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
            err = Errors.MissingFieldInConstr({
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

    // If we never inferred the return type then it may or may not return
    if (expected.type === 'typeLiteral' && expected.name === 'void:Any') {
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
function _checkVoidReturnType(node) {
    var returnType = this.meta.currentScope.returnValueType;
    var actualReturnType = this.meta.currentScope.knownReturnType;
    var returnNode = this.meta.currentScope.returnStatementASTNode;

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

    assert(returnType.type === 'typeLiteral' && returnType.name === 'void',
        'expected Constructor to have no return void');
};

ASTVerifier.prototype._findPropertyInType =
function _findPropertyInType(node, jsigType, propertyName) {
    if (jsigType.type === 'function' &&
        propertyName === 'prototype'
    ) {
        return jsigType.thisArg;
    } else if (jsigType.type === 'genericLiteral' &&
        jsigType.value.type === 'typeLiteral' &&
        jsigType.value.name === 'Array'
    ) {
        jsigType = this.meta.getVirtualType('TArray').defn;
    } else if (jsigType.type === 'typeLiteral' &&
        jsigType.name === 'String'
    ) {
        jsigType = this.meta.getVirtualType('TString').defn;
    }

    if (jsigType.type === 'unionType') {
        this.meta.addError(Errors.UnionFieldAccess({
            loc: node.loc,
            line: node.loc.start.line,
            fieldName: propertyName,
            unionType: serialize(jsigType)
        }));
        return null;
    }

    if (jsigType.type !== 'object') {
        this.meta.addError(Errors.NonObjectFieldAccess({
            loc: node.loc,
            line: node.loc.start.line,
            fieldName: propertyName,
            nonObjectType: serialize(jsigType)
        }));
        return null;
    }

    for (var i = 0; i < jsigType.keyValues.length; i++) {
        var keyValue = jsigType.keyValues[i];
        if (keyValue.key === propertyName) {
            return keyValue.value;
        }
    }

    var err = this._createNonExistantFieldError(node, propertyName);
    this.meta.addError(err);
    return null;
};

ASTVerifier.prototype._findTypeInContainer =
function _findTypeInContainer(node, objType, propType) {
    var valueType;
    if (objType.value.name === 'Array') {
        this.meta.checkSubType(node, ARRAY_KEY_TYPE, propType);

        valueType = objType.generics[0];
    } else if (objType.value.name === 'Object') {
        this.meta.checkSubType(node, objType.generics[0], propType);

        valueType = JsigAST.union([
            objType.generics[1],
            JsigAST.value('undefined')
        ]);
    } else {
        assert(false, 'Cannot look inside non Array/Object container');
    }

    assert(valueType, 'expected valueType to exist');
    return valueType;
};

ASTVerifier.prototype._createNonExistantFieldError =
function _createNonExistantFieldError(node, propName) {
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

    return Errors.NonExistantField({
        fieldName: propName,
        objName: objName,
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

    var externDefn = this.checker.getDefinition(depPath);
    if (externDefn) {
        return externDefn.defn;
    }

    var fileName = this._resolvePath(node, depPath, this.folderName);
    if (!fileName) {
        return null;
    }

    var otherMeta = this.checker.getOrCreateMeta(fileName);
    if (!otherMeta) {
        return null;
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
        // TODO: search for type defintions inside node_modules/*
        this.meta.addError(Errors.MissingDefinition({
            moduleName: possiblePath,
            line: node.loc.start.line,
            loc: node.loc
        }));
        return null;
    }
};

// hoisting function declarations to the bottom makes the tree
// order algorithm simpler
function hoistFunctionDeclaration(nodes) {
    var declarations = [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    return declarations;
}

