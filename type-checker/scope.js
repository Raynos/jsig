'use strict';

var assert = require('assert');
var JsigAST = require('../ast.js');

var requireType = JsigAST.functionType({
    args: [JsigAST.literal('String')],
    result: JsigAST.value('null')
});
requireType.isNodeRequireToken = true;

var moduleType = JsigAST.object({
    exports: JsigAST.literal('Any:ModuleExports', true)
});
moduleType.isNodeModuleToken = true;

module.exports = {
    FileScope: FileScope,
    FunctionScope: FunctionScope
};

function FileScope(parent) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.untypedFunctions = {};
    this.prototypes = {};
    this.currentAssignmentType = null;

    this.type = 'file';
}

FileScope.prototype.loadModuleTokens =
function loadModuleTokens() {
    this.addVar('require', requireType);
    this.addVar('module', moduleType);
};

FileScope.prototype.addVar =
function addVar(id, typeDefn) {
    var token = {
        type: 'variable',
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node
    };
};

FileScope.prototype.addPrototypeField =
function addPrototypeField(id, fieldName, typeDefn) {
    if (!this.prototypes[id]) {
        this.prototypes[id] = {
            type: 'prototype',
            fields: {}
        };
    }

    this.prototypes[id].fields[fieldName] = typeDefn;
};

FileScope.prototype.getFunction =
function getFunction(id) {
    return this.untypedFunctions[id] || null;
};

FileScope.prototype.updateFunction =
function updateFunction(id, typeDefn) {
    assert(this.untypedFunctions[id], 'function must exist already');
    this.untypedFunctions[id] = null;
    return this.addVar(id, typeDefn);
};

FileScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

FileScope.prototype.enterAssignment =
function enterAssignment(leftType) {
    this.currentAssignmentType = leftType;
};

FileScope.prototype.exitAssignment =
function exitAssignment() {
    this.currentAssignmentType = null;
};

function FunctionScope(parent, funcName, funcNode) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.untypedFunctions = {};
    this.type = 'function';

    this.funcName = funcName;
    this.returnValueType = null;
    this.thisValueType = null;
    this.isConstructor = /[A-Z]/.test(funcName[0]);
    this.currentAssignmentType = null;

    this.knownFields = [];
    this.knownReturnType = null;
    this.returnStatementASTNode = null;
    this.funcASTNode = funcNode;
}

FunctionScope.prototype.loadTypes =
function loadTypes(funcNode, typeDefn) {
    for (var i = 0; i < funcNode.params.length; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i];

        this.addVar(param.name, argType);
    }

    this.thisValueType = typeDefn.thisArg;
    this.returnValueType = typeDefn.result;
};

FunctionScope.prototype.addVar =
function addVar(id, typeDefn) {
    var token = {
        type: 'variable',
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

FunctionScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

FunctionScope.prototype.addFunction = function addFunction(id, node) {
    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node
    };
};

FunctionScope.prototype.getFunction = function getFunction(id) {
    return this.untypedFunctions[id] || this.parent.getFunction(id);
};

FunctionScope.prototype.updateFunction = function updateFunction(id, type) {
    var func = this.untypedFunctions[id];
    if (func) {
        this.untypedFunctions[id] = null;
        return this.addVar(id, type);
    }

    return this.parent.updateFunction(id, type);
};

FunctionScope.prototype.getPrototypeFields =
function getPrototypeFields() {
    var parent = this.parent;
    while (parent.type === 'function') {
        parent = parent.parent;
    }

    var p = parent.prototypes[this.funcName];
    if (!p) {
        return null;
    }

    return p.fields;
};

FunctionScope.prototype.addKnownField =
function addKnownField(fieldName) {
    if (this.knownFields.indexOf(fieldName) === -1) {
        this.knownFields.push(fieldName);
    }
};

FunctionScope.prototype.markReturnType =
function markReturnType(defn, node) {
    this.knownReturnType = defn;
    this.returnStatementASTNode = node;
};

FunctionScope.prototype.enterAssignment =
function enterAssignment(leftType) {
    this.currentAssignmentType = leftType;
};

FunctionScope.prototype.exitAssignment =
function exitAssignment() {
    this.currentAssignmentType = null;
};
