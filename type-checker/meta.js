'use strict';

/*eslint no-console: 0*/
// var console = require('console');

var isModuleExports = require('./lib/is-module-exports.js');
var ASTVerifier = require('./ast-verifier.js');
var JsigAST = require('../ast.js');
var readJSigAST = require('./lib/read-jsig-ast.js');
var HeaderFile = require('./header-file.js');
var SubTypeChecker = require('./sub-type.js');

var fileExtRegex = /.js$/;
var requireType = JsigAST.functionType({
    args: [JsigAST.literal('String')],
    result: JsigAST.value('null')
});
requireType.isNodeRequireToken = true;

var moduleType = JsigAST.object({
    exports: JsigAST.literal('Any:ModuleExports', true)
});
moduleType.isNodeModuleToken = true;

module.exports = ProgramMeta;

function ProgramMeta(ast, fileName) {
    this.ast = ast;
    this.fileName = fileName;

    this.identifiers = {};
    this.untypedFunctions = {};

    this.type = 'program';

    this.moduleExportsNode = null;
    this.moduleExportsType = null;

    this.currentScope = new FileScope(this);
    this.currentScope.addVar('require', requireType);
    this.currentScope.addVar('module', moduleType);

    this.errors = [];
    this.fatalError = false;

    this.headerFile = null;
    this.subType = new SubTypeChecker();
    this.verifier = new ASTVerifier(this);
}

ProgramMeta.prototype.getVar = function getVar(id) {
    return this.identifiers[id];
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
function setModuleExportsType(typeDefn) {
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
        this.errors.push(res.error);
        this.fatalError = true;
        return;
    }

    this.headerFile = new HeaderFile(res.value);

    var assignments = this.headerFile.getResolvedAssignments();
    if (this.headerFile.errors.length) {
        for (var i = 0; i < this.headerFile.errors.length; i++) {
            this.errors.push(this.headerFile.errors[i]);
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
        this.currentScope, funcNode.id.name
    );

    for (var i = 0; i < funcNode.params.length; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i];

        funcScope.addVar(param.name, argType);
    }

    funcScope.thisValueType = typeDefn.thisArg;
    funcScope.returnValueType = typeDefn.result;

    this.currentScope = funcScope;
};

ProgramMeta.prototype.exitFunctionScope =
function exitFunctionScope() {
    this.currentScope = this.currentScope.parent;
};

function FileScope(parent) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.untypedFunctions = {};

    this.type = 'file';
}

FileScope.prototype.addVar =
function addVar(id, typeDefn) {
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node
    };
};

FileScope.prototype.getFunction =
function getFunction(id) {
    return this.untypedFunctions[id] || null;
};

FileScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

function FunctionScope(parent, funcName) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.type = 'function';

    this.funcName = funcName;
    this.returnValueType = null;
    this.thisValueType = null;
    this.isConstructor = /[A-Z]/.test(funcName[0]);

    this.knownFields = [];
}

FunctionScope.prototype.addVar =
function addVar(id, typeDefn) {
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};

FunctionScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

FunctionScope.prototype.addKnownField =
function addKnownField(fieldName) {
    if (this.knownFields.indexOf(fieldName) === -1) {
        this.knownFields.push(fieldName);
    }
};
