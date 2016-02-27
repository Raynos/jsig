'use strict';

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

    this.type = 'file';
}

FileScope.prototype.loadModuleTokens =
function loadModuleTokens() {
    this.addVar('require', requireType);
    this.addVar('module', moduleType);
};

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

FileScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

function FunctionScope(parent, funcName, funcNode) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.type = 'function';

    this.funcName = funcName;
    this.returnValueType = null;
    this.thisValueType = null;
    this.isConstructor = /[A-Z]/.test(funcName[0]);

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
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};

FunctionScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};

FunctionScope.prototype.getFunction = function getFunction(id) {
    return this.parent.getFunction(id);
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
