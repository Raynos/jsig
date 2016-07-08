'use strict';

var assert = require('assert');

var isModuleExports = require('./lib/is-module-exports.js');
var serialize = require('../serialize.js');
var ASTVerifier = require('./ast-verifier.js');
var TypeInference = require('./type-inference.js');
var SubTypeChecker = require('./sub-type.js');
var NarrowType = require('./narrow-type.js');
var FileScope = require('./scope.js').FileScope;
var FunctionScope = require('./scope.js').FunctionScope;
var BranchScope = require('./scope.js').BranchScope;

var fileExtRegex = /.js$/;

module.exports = ProgramMeta;

function ProgramMeta(checker, ast, fileName, source) {
    this.checker = checker;
    this.ast = ast;
    this.fileName = fileName;
    this.source = source;
    this.sourceLines = source.split('\n');

    this.identifiers = {};
    this.operators = {};
    this.virtualTypes = {};

    this.type = 'program';

    this.moduleExportsNode = null;
    this.moduleExportsType = null;
    this.moduleExportsName = null;

    this.globalScope = checker.globalScope;
    this.currentScope = new FileScope(this.globalScope);
    this.currentScope.loadModuleTokens();

    this.fatalError = false;

    this.headerFile = null;
    this.subType = new SubTypeChecker(this);
    this.verifier = new ASTVerifier(this, this.checker, this.fileName);
    this.inference = new TypeInference(this);
    this.narrow = new NarrowType(this);

    this.currentNode = null;
    this.currentExpressionType = null;
}

ProgramMeta.prototype.serializeType =
function serializeType(type, opts) {
    return serialize(type, opts);
};

ProgramMeta.prototype.serializeAST =
function serializeAST(ast) {
    var startLine = ast.loc.start.line;
    var endLine = ast.loc.end.line;

    if (startLine === endLine) {
        return this.sourceLines[startLine - 1].slice(
            ast.loc.start.column, ast.loc.end.column
        );
    }

    var segments = [
        this.sourceLines[startLine - 1].slice(ast.loc.start.column)
    ];

    for (var i = startLine + 1; i < endLine; i++) {
        segments.push(this.sourceLines[i - 1]);
    }

    segments.push(
        this.sourceLines[endLine - 1].slice(0, -ast.loc.end.column)
    );

    return segments.join('\n');
};

ProgramMeta.prototype.getOperator = function getOperator(id) {
    return this.globalScope.getOperator(id);
};

ProgramMeta.prototype.getVirtualType = function getVirtualType(id) {
    return this.globalScope.getVirtualType(id);
};

ProgramMeta.prototype.verify = function verify() {
    var node = this.ast;

    this.verifyNode(node, null);
};

ProgramMeta.prototype.verifyNode = function verifyNode(node, exprType) {
    if (this.fatalError) {
        return null;
    }

    assert(exprType !== undefined, 'must pass in exprType');

    var parent = this.currentNode;
    this.currentNode = node;
    var oldExprType = this.currentExpressionType;
    this.currentExpressionType = exprType;

    var type = this.verifier.verifyNode(node);

    this.currentExpressionType = oldExprType;
    this.currentNode = parent;
    return type;
};

ProgramMeta.prototype.inferType = function inferType(node) {
    if (this.fatalError) {
        return null;
    }

    return this.inference.inferType(node);
};

ProgramMeta.prototype.narrowType =
function narrowType(node, ifBranch, elseBranch) {
    if (this.fatalError) {
        return null;
    }

    return this.narrow.narrowType(node, ifBranch, elseBranch);
};

ProgramMeta.prototype.resolveGeneric =
function resolveGeneric(funcType, node) {
    if (this.fatalError) {
        return null;
    }

    return this.inference.resolveGeneric(funcType, node);
};

ProgramMeta.prototype.setModuleExportsNode =
function setModuleExportsNode(astNode) {
    var moduleExports = null;
    for (var i = 0; i < astNode.body.length; i++) {
        if (isModuleExports(astNode.body[i])) {
            moduleExports = astNode.body[i];
        }
    }

    if (moduleExports) {
        this.moduleExportsNode = moduleExports.expression.right;
    }
};

ProgramMeta.prototype.setModuleExportsType =
function setModuleExportsType(typeDefn, astNode) {
    this.moduleExportsName = astNode.name;
    this.moduleExportsType = typeDefn;
};

ProgramMeta.prototype.addError = function addError(error) {
    error.fileName = this.fileName;
    // console.trace('addError(' + error.type + ')');
    this.checker.addError(error);
};

ProgramMeta.prototype.countErrors = function countErrors() {
    return this.checker.countErrors();
};

ProgramMeta.prototype.getErrors =
function getErrors() {
    return this.checker.getErrors();
};
ProgramMeta.prototype.setErrors =
function setErrors(list) {
    this.checker.setErrors(list);
};

ProgramMeta.prototype.checkSubType =
function checkSubType(node, leftType, rightType) {
    var err = this.subType.checkSubType(node, leftType, rightType);
    if (err) {
        this.addError(err);
        return false;
    }
    return true;
};

ProgramMeta.prototype.checkSubTypeRaw =
function checkSubTypeRaw(node, leftType, rightType) {
    return this.subType.checkSubType(node, leftType, rightType);
};

ProgramMeta.prototype.isSubType =
function isSubType(node, leftType, rightType) {
    var e = this.subType.checkSubType(node, leftType, rightType);
    // console.log('e', e);
    return !e;
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile(required) {
    var headerFileName = this.fileName.replace(fileExtRegex, '.hjs');

    this.headerFile = this.checker.getOrCreateHeaderFile(
        headerFileName, required
    );
    if (!this.headerFile) {
        return;
    }

    var assignments = this.headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var expr = assignments[i];

        this.currentScope.preloadVar(expr.identifier, expr.typeExpression);
    }
};

ProgramMeta.prototype.allocateBranchScope =
function allocateBranchScope() {
    return new BranchScope(this.currentScope);
};

ProgramMeta.prototype.enterBranchScope =
function enterBranchScope(scope) {
    assert(scope, 'must have a scope to enter');

    this.currentScope = scope;
};

ProgramMeta.prototype.exitBranchScope =
function exitBranchScope() {
    this.currentScope = this.currentScope.parent;
};

ProgramMeta.prototype.enterFunctionScope =
function enterFunctionScope(funcNode, typeDefn) {
    var funcScope = new FunctionScope(
        this.currentScope, funcNode.id.name, funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.enterFunctionOverloadScope =
function enterFunctionOverloadScope(funcNode, typeDefn) {
    var funcScope = new FunctionScope(
        this.currentScope, funcNode.id.name, funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionOverloadScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.exitFunctionScope =
function exitFunctionScope() {
    this.currentScope = this.currentScope.parent;
};

/* As part of inference we believe that the function named
    "name" which is untyped has a type of `newType`.

*/
ProgramMeta.prototype.tryUpdateFunction =
function tryUpdateFunction(name, newType) {
    var t = this.currentScope.getFunction(name);
    this.currentScope.updateFunction(name, newType);

    // Snap into scope of function decl
    var oldScope = this.currentScope;
    this.currentScope = t.currentScope;

    var beforeErrors = this.countErrors();

    this.verifyNode(t.node, null);
    this.currentScope = oldScope;

    var afterErrors = this.countErrors();
    if (beforeErrors !== afterErrors) {
        var info = this.currentScope.getKnownFunctionInfo(name);

        assert(info.funcScopes.length === 1,
            'expected only one function info obj');

        // verifyNode() failed
        this.currentScope.revertFunctionScope(name);
        this.currentScope.revertFunction(name, t);
        return false;
    }

    return true;
};
