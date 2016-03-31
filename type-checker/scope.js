'use strict';

var assert = require('assert');
var util = require('util');
var JsigAST = require('../ast.js');

var moduleType = JsigAST.object({
    exports: JsigAST.literal('Any:ModuleExports', true)
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
    this.currentAssignmentType = null;
    this.writableTokenLookup = false;
}

BaseScope.prototype.addVar =
function addVar(id, typeDefn) {
    var token = {
        type: 'variable',
        defn: typeDefn
    };
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.getVar = function getVar(id) {
    if (this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id);
    }

    return this.typeRestrictions[id] || this.identifiers[id] ||
        this.parent.getVar(id);
};

BaseScope.prototype.restrictType = function restrictType(id, type) {
    assert(!this.typeRestrictions[id], 'cannot double restict type: ' + id);

    this.typeRestrictions[id] = {
        type: 'restriction',
        defn: type
    };
};

BaseScope.prototype.enterAssignment =
function enterAssignment(leftType) {
    this.currentAssignmentType = leftType;
};

BaseScope.prototype.exitAssignment =
function exitAssignment() {
    this.currentAssignmentType = null;
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

GlobalScope.prototype.loadLanguageIdentifiers =
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
            result: JsigAST.literal('Object:Empty', true)
        }),
        'keys': JsigAST.functionType({
            args: [JsigAST.generic(
                JsigAST.literal('Object'),
                [JsigAST.literal('K'), JsigAST.literal('V')]
            )],
            result: JsigAST.generic(
                JsigAST.literal('Array'),
                [JsigAST.literal('String')]
            ),
            generics: [JsigAST.literal('K'), JsigAST.literal('V')]
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

    this._addOperator('+',
        JsigAST.union([
            JsigAST.functionType({
                args: [JsigAST.literal('String'), JsigAST.literal('String')],
                result: JsigAST.literal('String')
            }),
            JsigAST.functionType({
                args: [JsigAST.literal('Number'), JsigAST.literal('Number')],
                result: JsigAST.literal('Number')
            })
        ])
    );

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

    this._addOperator('void', JsigAST.functionType({
        args: [JsigAST.literal('Boolean:Any', true)],
        result: JsigAST.literal('void')
    }));

    this._addOperator('===', JsigAST.functionType({
        args: [
            JsigAST.literal('Boolean:Any', true),
            JsigAST.literal('Boolean:Any', true)
        ],
        result: JsigAST.literal('Boolean')
    }));
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
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node
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

function FunctionScope(parent, funcName, funcNode) {
    BaseScope.call(this, parent);
    this.type = 'function';

    this.untypedFunctions = Object.create(null);

    this.funcName = funcName;
    this.returnValueType = null;
    this.thisValueType = null;
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
    for (var i = 0; i < funcNode.params.length; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i];

        this.addVar(param.name, argType);
    }

    this.thisValueType = typeDefn.thisArg;
    this.returnValueType = typeDefn.result;
};

FunctionScope.prototype.addFunction = function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

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

FunctionScope.prototype.getFunctionScope =
function getFunctionScope() {
    return this;
};

FunctionScope.prototype.updateVar =
function updateVar() {
};

function BranchScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'branch';
}
util.inherits(BranchScope, BaseScope);

BranchScope.prototype.getFunctionScope =
function getFunctionScope() {
    var parent = this.parent;
    while (parent && parent.type !== 'function') {
        parent = parent.parent;
    }

    return parent;
};

BranchScope.prototype.updateVar =
function updateVar(id, typeDefn) {
    var restriction = this.typeRestrictions[id];
    if (!restriction) {
        return;
    }

    this.typeRestrictions[id] = {
        type: 'restriction',
        defn: typeDefn
    };
};
