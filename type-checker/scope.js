'use strict';

var assert = require('assert');
var util = require('util');

var JsigAST = require('../ast/');
var isSameType = require('./lib/is-same-type.js');
var cloneAST = require('./lib/clone-ast.js');

var moduleType = JsigAST.object({
    exports: JsigAST.literal('%Any%%ModuleExports', true)
});
moduleType.isNodeModuleToken = true;

module.exports = {
    GlobalScope: GlobalScope,
    FileScope: FileScope,
    FunctionScope: FunctionScope,
    BranchScope: BranchScope
};

function BaseScope(parent) {
    this.parent = parent;
    this.type = 'base';

    this.identifiers = Object.create(null);
    this.unknownIdentifiers = Object.create(null);
    this.typeRestrictions = Object.create(null);
    this.functionScopes = Object.create(null);
    this.writableTokenLookup = false;
}

BaseScope.prototype.addVar =
function addVar(id, typeDefn) {
    if (this.identifiers[id]) {
        assert(this.identifiers[id].preloaded, 'identifier must not exist');
    }

    assert(typeDefn, 'addVar() must have typeDefn');
    assert(!typeDefn.optional, 'cannot add optional type');

    var token = {
        type: 'variable',
        preloaded: false,
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.preloadVar =
function preloadVar(id, typeDefn) {
    assert(!this.identifiers[id], 'identifier must not exist');
    assert(typeDefn, 'addVar() must have typeDefn');
    assert(!typeDefn.optional, 'cannot add optional type');

    var token = {
        type: 'variable',
        preloaded: true,
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.getVar = function getVar(id) {
    // console.log('getVar(', id, ',', this.writableTokenLookup, ')');
    if (this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id);
    }

    return this.typeRestrictions[id] || this.identifiers[id] ||
        this.parent.getVar(id);
};

BaseScope.prototype.getOwnVar = function getOwnVar(id) {
    if (this.writableTokenLookup) {
        return this.identifiers[id];
    }

    return this.typeRestrictions[id] || this.identifiers[id];
};

BaseScope.prototype.getFunctionScope =
function getFunctionScope() {
    return null;
};

BaseScope.prototype.setWritableTokenLookup =
function setWritableTokenLookup() {
    this.writableTokenLookup = true;
};

BaseScope.prototype.unsetWritableTokenLookup =
function unsetWritableTokenLookup() {
    this.writableTokenLookup = false;
};

BaseScope.prototype.addUnknownVar =
function addUnknownVar(id) {
    var token = {
        type: 'unknown-variable'
    };
    this.unknownIdentifiers[id] = token;
    return token;
};

BaseScope.prototype.getUnknownVar =
function getUnknownVar(id) {
    return this.unknownIdentifiers[id];
};

/*
    This permanently mutates the read-only and write-only
    state of a variable.

    When this is applied it must be applied up the chain if
    necessary as it changes the type inside and outside a scope
*/
BaseScope.prototype.forceUpdateVar =
function forceUpdateVar(id, typeDefn) {
    if (!this.identifiers[id] && this.parent) {
        return this.parent.forceUpdateVar(id, typeDefn);
    }

    assert(this.identifiers[id], 'identifier must already exist');
    assert(typeDefn, 'cannot force update to null');

    var token = {
        type: 'variable',
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.updateRestriction =
function updateRestriction() {
};

BaseScope.prototype.getGlobalType =
function getGlobalType() {
    return this.parent.getGlobalType();
};

BaseScope.prototype._addFunctionScope =
function _addFunctionScope(funcScope) {
    var currScope = this.functionScopes[funcScope.funcName];
    if (currScope) {
        assert.equal(currScope.funcScopes.length, 1,
            'cannot _addFunctionScope to overloaded function');
        var currentType = currScope.funcScopes[0].funcType;

        assert(isSameType(currentType, funcScope.funcType),
            'cannot add function twice with different types: ' +
            funcScope.funcName
        );

        return;
    }

    this.functionScopes[funcScope.funcName] = {
        funcScopes: [funcScope],
        currentScope: this
    };
};

BaseScope.prototype._revertFunctionScope =
function _revertFunctionScope(name) {
    var info = this.functionScopes[name];
    assert(info, 'cannot revert what does not exist');

    delete this.functionScopes[name];
};

BaseScope.prototype._addFunctionOverloadScope =
function _addFunctionOverloadScope(funcScope) {
    var currScope = this.functionScopes[funcScope.funcName];
    if (!currScope) {
        this.functionScopes[funcScope.funcName] = {
            funcScopes: [funcScope],
            currentScope: this
        };
        return;
    }

    for (var i = 0; i < currScope.funcScopes.length; i++) {
        var existingScope = currScope.funcScopes[i];

        assert(!isSameType(existingScope.funcType, funcScope.funcType),
            'cannot add same type twice in overload :' +
            funcScope.funcName
        );
    }

    currScope.funcScopes.push(funcScope);
};

function GlobalScope() {
    this.type = 'global';

    this.identifiers = Object.create(null);
    this.operators = Object.create(null);
    this.virtualTypes = Object.create(null);
}

GlobalScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id];
};

GlobalScope.prototype.getOperator = function getOperator(id) {
    return this.operators[id];
};

GlobalScope.prototype.getVirtualType = function getVirtualType(id) {
    return this.virtualTypes[id];
};

GlobalScope.prototype._addVar = function _addVar(id, typeDefn) {
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};
GlobalScope.prototype._addOperator = function _addOperator(id, typeDefn) {
    this.operators[id] = {
        type: 'operator',
        defn: typeDefn
    };
};
GlobalScope.prototype._addVirtualType = function _addVirtualType(id, typeDefn) {
    this.virtualTypes[id] = {
        type: 'virtual-type',
        defn: typeDefn
    };
};

GlobalScope.prototype.getGlobalType =
function getGlobalType() {
    var props = Object.keys(this.identifiers);
    var keyValues = {};

    for (var i = 0; i < props.length; i++) {
        keyValues[props[i]] = this.identifiers[props[i]].defn;
    }

    return JsigAST.object(keyValues);
};

function FileScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'file';

    this.untypedFunctions = Object.create(null);
    this.prototypes = Object.create(null);
}
util.inherits(FileScope, BaseScope);

FileScope.prototype.loadModuleTokens =
function loadModuleTokens() {
    this.addVar('module', moduleType);
    this.addVar('__dirname', JsigAST.literal('String'));
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node,
        currentScope: this
    };
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

FileScope.prototype.revertFunction =
function revertFunction(id, token) {
    this.identifiers[id] = null;
    this.untypedFunctions[id] = token;
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

FileScope.prototype.getReturnExpressionType =
function getReturnExpressionType() {
    return null;
};

FileScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    this._addFunctionScope(funcScope);
};

FileScope.prototype.revertFunctionScope =
function revertFunctionScope(name) {
    this._revertFunctionScope(name);
};

FileScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FileScope.prototype.getKnownFunctionInfo =
function getKnownFunctionInfo(funcName) {
    return this.functionScopes[funcName];
};

function FunctionScope(parent, funcName, funcNode) {
    BaseScope.call(this, parent);
    this.type = 'function';

    this.untypedFunctions = Object.create(null);

    this.funcName = funcName;
    this.returnValueType = null;
    this._thisValueType = null;
    this.funcType = null;
    this.isConstructor = /[A-Z]/.test(funcName[0]);

    this.knownFields = [];
    this.knownReturnType = null;
    this.returnStatementASTNode = null;
    this.funcASTNode = funcNode;
    this.writableTokenLookup = false;
}
util.inherits(FunctionScope, BaseScope);

FunctionScope.prototype.loadTypes =
function loadTypes(funcNode, typeDefn) {
    var len = Math.min(typeDefn.args.length, funcNode.params.length);

    for (var i = 0; i < len; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i];

        if (argType.optional) {
            argType = cloneAST(argType);
            argType.optional = false;
            if (argType.label) {
                argType.label = argType.label.substr(0, argType.label - 1);
            }

            argType = JsigAST.union([
                argType, JsigAST.value('undefined')
            ]);
        }

        this.addVar(param.name, argType);
    }

    this._thisValueType = typeDefn.thisArg;
    this.returnValueType = typeDefn.result;
    this.funcType = typeDefn;
};

FunctionScope.prototype.getThisType =
function getThisType() {
    return this._thisValueType;
};

FunctionScope.prototype.addFunction = function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node,
        currentScope: this
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

FunctionScope.prototype.revertFunction = function revertFunction(id, token) {
    if (this.identifiers[id]) {
        this.identifiers[id] = null;
        this.untypedFunctions[id] = token;
        return;
    }

    this.parent.revertFunction(id, token);
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

FunctionScope.prototype.getFunctionScope =
function getFunctionScope() {
    return this;
};

/*
    restrictType() is used to create a typeRestriction which
    is a read only construct.
*/
FunctionScope.prototype.restrictType = function restrictType(id, type) {
    // TODO: gaurd against weird restrictions? ...
    assert(!this.typeRestrictions[id], 'cannot double restrict type: ' + id);
    assert(id !== 'this', 'cannot restrict this');
    assert(type, 'cannot restrictType to null');

    this.typeRestrictions[id] = {
        type: 'restriction',
        defn: type
    };
};

FunctionScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    this._addFunctionScope(funcScope);
};

FunctionScope.prototype.revertFunctionScope =
function revertFunctionScope(name) {
    this._revertFunctionScope(name);
};

FunctionScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FunctionScope.prototype.getKnownFunctionInfo =
function getKnownFunctionInfo(funcName) {
    return this.functionScopes[funcName] ||
        this.parent.getKnownFunctionInfo(funcName);
};

function BranchScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'branch';

    this._restrictedThisValueType = null;
}
util.inherits(BranchScope, BaseScope);

BranchScope.prototype.getThisType =
function getThisType() {
    if (this.writableTokenLookup) {
        return this.parent.getThisType();
    }

    return this._restrictedThisValueType || this.parent.getThisType();
};

BranchScope.prototype.getFunctionScope =
function getFunctionScope() {
    var parent = this.parent;
    while (parent && parent.type !== 'function') {
        parent = parent.parent;
    }

    return parent;
};

/*
    updateRestriction() changes a type restriction.
    Again a typeRestriction is a read only view.
*/
BranchScope.prototype.updateRestriction =
function updateRestriction(id, typeDefn) {
    var restriction = this.typeRestrictions[id];
    if (!restriction) {
        return;
    }

    this.typeRestrictions[id] = {
        type: 'restriction',
        defn: typeDefn
    };
};

BranchScope.prototype.getFunction =
function getFunction(id) {
    return this.parent.getFunction(id);
};

BranchScope.prototype.updateFunction =
function updateFunction(id, defn) {
    return this.parent.updateFunction(id, defn);
};

BranchScope.prototype.revertFunction =
function revertFunction(id, token) {
    return this.parent.revertFunction(id, token);
};

BranchScope.prototype.restrictType = function restrictType(id, type) {
    // TODO: gaurd against weird restrictions? ...
    // assert(!this.typeRestrictions[id], 'cannot double restrict type: ' + id);

    assert(type, 'cannot restrict to null');
    if (id === 'this') {
        this._restrictedThisValueType = type;
        return;
    }

    this.typeRestrictions[id] = {
        type: 'restriction',
        defn: type
    };
};

BranchScope.prototype.enterReturnStatement =
function enterReturnStatement(type) {
    return this.parent.enterReturnStatement(type);
};

BranchScope.prototype.getReturnExpressionType =
function getReturnExpressionType() {
    return this.parent.getReturnExpressionType();
};

BranchScope.prototype.exitReturnStatement =
function exitReturnStatement() {
    this.parent.exitReturnStatement();
};

BranchScope.prototype.getKnownFunctionInfo =
function getKnownFunctionInfo(funcName) {
    return this.parent.getKnownFunctionInfo(funcName);
};
