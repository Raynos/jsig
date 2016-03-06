'use strict';

var isModuleExports = require('./lib/is-module-exports.js');
var ASTVerifier = require('./ast-verifier.js');
var JsigAST = require('../ast.js');
var readJSigAST = require('./lib/read-jsig-ast.js');
var HeaderFile = require('./header-file.js');
var SubTypeChecker = require('./sub-type.js');
var FileScope = require('./scope.js').FileScope;
var FunctionScope = require('./scope.js').FunctionScope;

var fileExtRegex = /.js$/;

module.exports = ProgramMeta;

function ProgramMeta(ast, fileName, source) {
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

    this.errors = [];
    this.fatalError = false;

    this.headerFile = null;
    this.subType = new SubTypeChecker();
    this.verifier = new ASTVerifier(this);

    this.loadLanguageIdentifiers();
}

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
        'push': JsigAST.functionType({
            thisArg: JsigAST.generic(
                JsigAST.literal('Array'),
                [JsigAST.literal('T')]
            ),
            args: [JsigAST.literal('T')],
            result: JsigAST.literal('Number'),
            generics: [JsigAST.literal('T')]
        })
    }));

    this._addOperator('*', JsigAST.functionType({
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
}

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
    this.errors.push(error);
};

ProgramMeta.prototype.checkSubType =
function checkSubType(node, leftType, rightType) {
    var err = this.subType.checkSubType(node, leftType, rightType);
    if (err) {
        this.addError(err);
    }
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile() {
    var headerFileName = this.fileName.replace(fileExtRegex, '.hjs');

    var res = readJSigAST(headerFileName);
    if (res.error) {
        this.addError(res.error);
        this.fatalError = true;
        return;
    }

    this.headerFile = new HeaderFile(res.value);

    var assignments = this.headerFile.getResolvedAssignments();
    if (this.headerFile.errors.length) {
        for (var i = 0; i < this.headerFile.errors.length; i++) {
            this.addError(this.headerFile.errors[i]);
        }
        this.fatalError = true;
        return;
    }

    for (i = 0; i < assignments.length; i++) {
        var expr = assignments[i];

        this.currentScope.addVar(expr.identifier, expr.typeExpression);
    }
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
