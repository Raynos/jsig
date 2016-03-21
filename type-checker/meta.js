'use strict';

var assert = require('assert');

var isModuleExports = require('./lib/is-module-exports.js');
var serialize = require('../serialize.js');
var ASTVerifier = require('./ast-verifier.js');
var TypeInference = require('./type-inference.js');
var JsigAST = require('../ast.js');
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

    this.currentScope = new FileScope(this);
    this.currentScope.loadModuleTokens();

    this.fatalError = false;

    this.headerFile = null;
    this.subType = new SubTypeChecker();
    this.verifier = new ASTVerifier(this, this.checker, this.fileName);
    this.inference = new TypeInference(this);
    this.narrow = new NarrowType(this);

    this.loadLanguageIdentifiers();
}

ProgramMeta.prototype.serializeType =
function serializeType(type) {
    return serialize(type);
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

    for (var i = startLine + 1; i < endLine - 1; i++) {
        segments.push(this.sourceLines[i - 1]);
    }

    segments.push(
        this.sourceLines[endLine - 1].slice(0, -ast.loc.end.column)
    );

    return segments.join('\n');
};

ProgramMeta.prototype.loadLanguageIdentifiers =
function loadLanguageIdentifiers() {
    this._addVar('String', JsigAST.functionType({
        args: [JsigAST.literal('Number')],
        result: JsigAST.literal('String')
    }));

    this._addVar('Date', JsigAST.object({
        'now': JsigAST.functionType({
            args: [],
            result: JsigAST.literal('Number')
        })
    }));

    this._addVar('Object', JsigAST.object({
        'create': JsigAST.functionType({
            args: [JsigAST.value('null')],
            result: JsigAST.literal('Object:Empty')
        })
    }));

    this._addVirtualType('TArray', JsigAST.object({
        'length': JsigAST.literal('Number'),
        'push': JsigAST.functionType({
            thisArg: JsigAST.generic(
                JsigAST.literal('Array'),
                [JsigAST.literal('T')]
            ),
            args: [JsigAST.literal('T')],
            result: JsigAST.literal('Number'),
            generics: [JsigAST.literal('T')]
        }),
        'slice': JsigAST.functionType({
            thisArg: JsigAST.generic(
                JsigAST.literal('Array'),
                [JsigAST.literal('T')]
            ),
            args: [
                JsigAST.literal('Number'),
                JsigAST.literal('Number')
            ],
            result: JsigAST.generic(
                JsigAST.literal('Array'),
                [JsigAST.literal('T')]
            ),
            generics: [JsigAST.literal('T')]
        })
    }));

    this._addOperator('+', JsigAST.functionType({
        args: [JsigAST.literal('String'), JsigAST.literal('String')],
        result: JsigAST.literal('String')
    }));

    this._addOperator('*', JsigAST.functionType({
        args: [JsigAST.literal('Number'), JsigAST.literal('Number')],
        result: JsigAST.literal('Number')
    }));

    this._addOperator('%', JsigAST.functionType({
        args: [JsigAST.literal('Number'), JsigAST.literal('Number')],
        result: JsigAST.literal('Number')
    }));

    this._addOperator('-', JsigAST.functionType({
        args: [JsigAST.literal('Number'), JsigAST.literal('Number')],
        result: JsigAST.literal('Number')
    }));

    this._addOperator('<', JsigAST.functionType({
        args: [JsigAST.literal('Number'), JsigAST.literal('Number')],
        result: JsigAST.literal('Boolean')
    }));

    this._addOperator('++', JsigAST.functionType({
        args: [JsigAST.literal('Number')],
        result: JsigAST.literal('Number')
    }));

    this._addOperator('--', JsigAST.functionType({
        args: [JsigAST.literal('Number')],
        result: JsigAST.literal('Number')
    }));

    this._addOperator('!', JsigAST.functionType({
        args: [JsigAST.literal('Boolean:Any', true)],
        result: JsigAST.literal('Boolean')
    }));

    this._addOperator('===', JsigAST.functionType({
        args: [
            JsigAST.literal('Boolean:Any', true),
            JsigAST.literal('Boolean:Any', true)
        ],
        result: JsigAST.literal('Boolean')
    }));
};

ProgramMeta.prototype._addVar = function _addVar(id, typeDefn) {
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};
ProgramMeta.prototype._addOperator = function _addOperator(id, typeDefn) {
    this.operators[id] = {
        type: 'operator',
        defn: typeDefn
    };
};
ProgramMeta.prototype._addVirtualType = function _addVirtualType(id, typeDefn) {
    this.virtualTypes[id] = {
        type: 'virtual-type',
        defn: typeDefn
    };
};

ProgramMeta.prototype.getVar = function getVar(id) {
    return this.identifiers[id];
};

ProgramMeta.prototype.getOperator = function getOperator(id) {
    return this.operators[id];
};

ProgramMeta.prototype.getVirtualType = function getVirtualType(id) {
    return this.virtualTypes[id];
};

ProgramMeta.prototype.verify = function verify() {
    var node = this.ast;

    this.verifyNode(node);
};

ProgramMeta.prototype.verifyNode = function verifyNode(node) {
    if (this.fatalError) {
        return null;
    }

    return this.verifier.verifyNode(node);
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
    this.checker.addError(error);
};

ProgramMeta.prototype.countErrors = function countErrors() {
    return this.checker.countErrors();
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

ProgramMeta.prototype.isSubType =
function isSubType(node, leftType, rightType) {
    return !this.subType.checkSubType(node, leftType, rightType);
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile() {
    var headerFileName = this.fileName.replace(fileExtRegex, '.hjs');

    this.headerFile = this.checker.getOrCreateHeaderFile(headerFileName);
    if (!this.headerFile) {
        return;
    }

    var assignments = this.headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var expr = assignments[i];

        this.currentScope.addVar(expr.identifier, expr.typeExpression);
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

    this.currentScope = funcScope;
};

ProgramMeta.prototype.exitFunctionScope =
function exitFunctionScope() {
    this.currentScope = this.currentScope.parent;
};
