'use strict';

var assert = require('assert');
var util = require('util');

var JsigAST = require('../ast/');
var isSameType = require('./lib/is-same-type.js');

module.exports = {
    GlobalScope: GlobalScope,
    FileScope: FileScope,
    FunctionScope: FunctionScope,
    BranchScope: BranchScope
};

/*
    identifiers : A dictionary of TypeDefinitions for tokens
        in this scope

    unknownIdentifiers : A dictionary of tokens that exist in
        scope but have no type because evaluation their initial
        type turned into a type error

    typeRestrictions : The type of an identifier after a restriction
        as applied, for example inside an if branch a token might
        have a smaller type. This type is used for reading, however
        if you want to assign to the token we use the original
        unrestricted type.

    untypedFunctions : A dictionary of tokens that are known to
        be functions but do not currently have a type. Their
        type will be guessed via call-based inference on the
        first call site.

    functionScopes : A dictionary of FunctionScope instances
        for functions in the file, or nested closures in a
        function.

*/
function BaseScope(parent) {
    assert(parent, 'parent required');
    assert(parent.checker, 'checker required');
    this.parent = parent;
    this.checker = parent.checker;
    this.type = 'base';

    this.identifiers = Object.create(null);
    this.unknownIdentifiers = Object.create(null);
    this.typeRestrictions = Object.create(null);
    this.functionScopes = Object.create(null);
    this.writableTokenLookup = false;
    this._restrictedThisValueType = null;
}

function IdentifierToken(defn, preloaded) {
    this.type = 'variable';
    this.preloaded = preloaded || false;
    this.defn = defn;
    this.inferred = 'inferred' in defn ? defn.inferred : false;
    this.aliasCount = 0;
}

BaseScope.prototype.addVar =
function addVar(id, typeDefn) {
    if (this.identifiers[id]) {
        assert(this.identifiers[id].preloaded, 'identifier must not exist');
    }

    assert(typeDefn, 'addVar() must have typeDefn');

    var token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);
    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

BaseScope.prototype.preloadVar =
function preloadVar(id, typeDefn) {
    assert(!this.identifiers[id], 'identifier must not exist');
    assert(typeDefn, 'addVar() must have typeDefn');

    var token = new IdentifierToken(typeDefn, true);
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.getVar = function getVar(id, isWritable) {
    // console.log('getVar(', id, ',', this.writableTokenLookup, ')');
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id, true);
    }

    return this.typeRestrictions[id] || this.identifiers[id] ||
        this.parent.getVar(id, isWritable);
};

BaseScope.prototype.getOwnVar = function getOwnVar(id, isWritable) {
    if (isWritable || this.writableTokenLookup) {
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
    if (id === 'this') {
        assert(this._thisValueType, 'thisValueType must already exist');
        assert(typeDefn, 'cannot force update to null');

        this._thisValueType = typeDefn;
        return new IdentifierToken(typeDefn, false);
    }

    if (!this.identifiers[id] && this.parent) {
        return this.parent.forceUpdateVar(id, typeDefn);
    }

    assert(this.identifiers[id], 'identifier must already exist');
    assert(typeDefn, 'cannot force update to null');

    var token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
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
function _revertFunctionScope(name, funcType) {
    var info = this.functionScopes[name];
    assert(info, 'cannot revert what does not exist');

    assert(funcType.type !== 'functionType' || info.funcScopes.length === 1,
        'plain functions can only have one func type');

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

        // If the function scope already exists then bail.
        if (isSameType(existingScope.funcType, funcScope.funcType)) {
            return;
        }
    }

    currScope.funcScopes.push(funcScope);
};

/*
    restrictType() is used to create a typeRestriction which
    is a read only construct.

    restrictType() is only done on a FunctionScope to apply
    a consistent type restriction after an if statement, for
    example:

    ```
    foo : Foo | null
    if (!foo) {
        foo = DEFAULT_FOO;
    }
    // type is restricted foo : Foo
    ```

    The other place where a type restriction can happen in
    a FunctionScope ( or FileScope... ) is with an assert
    statement. An assert(expr, msg) function call will restrict
    the type of the expression.
*/
BaseScope.prototype._restrictType =
function _restrictType(id, type) {
    // TODO: gaurd against weird restrictions? ...
    // assert(!this.typeRestrictions[id], 'cannot double restrict type: ' + id);
    assert(type, 'cannot restrictType to null');

    if (id === 'this') {
        this._restrictedThisValueType = type;
        return null;
    }

    var token = {
        type: 'restriction',
        defn: type
    };
    this.typeRestrictions[id] = token;
    return token;
};

function GlobalScope(checker) {
    this.parent = null;
    this.checker = checker;
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

GlobalScope.prototype.forceUpdateVar = function forceUpdateVar(id) {
    assert(false, 'cannot forceUpdateVar(' + id + ') in global scope ');
};

GlobalScope.prototype.getVirtualType = function getVirtualType(id) {
    return this.virtualTypes[id];
};

GlobalScope.prototype._addVar = function _addVar(id, typeDefn) {
    this.identifiers[id] = new IdentifierToken(typeDefn, false);
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

    this.exportedIdentifier = null;
    this.untypedFunctions = Object.create(null);
    this.prototypes = Object.create(null);
}
util.inherits(FileScope, BaseScope);

FileScope.prototype.getPrototypeFields =
function getPrototypeFields(funcName) {
    var p = this.prototypes[funcName];
    if (!p) {
        return null;
    }

    return p.fields;
};

FileScope.prototype.loadModuleTokens =
function loadModuleTokens() {
    var moduleType = JsigAST.object({
        exports: JsigAST.literal('%Export%%ModuleExports', true)
    });
    var exportsType = JsigAST.literal('%Export%%ExportsObject', true);
    var requireType = JsigAST.literal('%Require%%RequireFunction', true);

    this.addVar('require', requireType);
    this.addVar('module', moduleType);
    this.addVar('exports', exportsType);
    this.addVar('__dirname', JsigAST.literal('String'));
};

FileScope.prototype.getExportedIdentifier =
function getExportedIdentifier(name) {
    return this.exportedIdentifier;
};

FileScope.prototype.setExportedIdentifier =
function setExportedIdentifier(name) {
    this.exportedIdentifier = name;
};

FileScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);

    if (!token) {
        /* skip mark alias for untyped functions */
        var untyped = this.getUntypedFunction(name);
        if (untyped) {
            return null;
        }
    }

    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        name: id,
        node: node,
        currentScope: this,
        attemptedStaticInference: false
    };
};

FileScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
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

    var proto = this.prototypes[id];
    // TODO: we always assign the type of the last method
    // assignment in case there are multiple.
    proto.fields[fieldName] = typeDefn;
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
function revertFunctionScope(name, funcType) {
    this._revertFunctionScope(name, funcType);
};

FileScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FileScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.functionScopes[funcName];
};

FileScope.prototype.restrictType = function restrictType(name, type) {
    return this._restrictType(name, type);
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
    this.knownReturnTypes = [];
    this.returnStatementASTNodes = [];
    this.funcASTNode = funcNode;
    this.writableTokenLookup = false;
}
util.inherits(FunctionScope, BaseScope);

FunctionScope.prototype.loadTypes =
function loadTypes(funcNode, typeDefn) {
    var len = Math.min(typeDefn.args.length, funcNode.params.length);

    var argumentsTypes = [];

    for (var i = 0; i < len; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i].value;

        if (typeDefn.args[i].optional) {
            argType = JsigAST.union([
                argType, JsigAST.value('undefined')
            ]);
        }

        argumentsTypes.push(argType);
        this.addVar(param.name, argType);
    }

    // Add the arguments type to scope as a tuple
    this.addVar('arguments', JsigAST.tuple(argumentsTypes));

    this._thisValueType = null;
    if (typeDefn.thisArg) {
        this._thisValueType = typeDefn.thisArg.value;
        if (typeDefn.thisArg.optional) {
            this._thisValueType = JsigAST.union([
                this._thisValueType, JsigAST.value('undefined')
            ]);
        }
    }

    this.returnValueType = typeDefn.result;
    this.funcType = typeDefn;
};

FunctionScope.prototype.getReturnValueType =
function getReturnValueType() {
    return this.returnValueType;
};

FunctionScope.prototype.getThisType =
function getThisType(isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this._thisValueType;
    }

    return this._restrictedThisValueType || this._thisValueType;
};

FunctionScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);

    if (!token) {
        /* skip mark alias for untyped functions */
        var untyped = this.getUntypedFunction(name);
        if (untyped) {
            return null;
        }
    }

    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

FunctionScope.prototype.addFunction = function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        name: id,
        node: node,
        currentScope: this,
        attemptedStaticInference: false
    };
};

FunctionScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
    return this.untypedFunctions[id] || this.parent.getUntypedFunction(id);
};

/*
    updateFunction()

    Move a function `id` from `untypedFunction` predeclared
        into `identifiers`.
*/
FunctionScope.prototype.updateFunction = function updateFunction(id, type) {
    var func = this.untypedFunctions[id];
    if (func) {
        this.untypedFunctions[id] = null;
        return this.addVar(id, type);
    }

    return this.parent.updateFunction(id, type);
};

/*
    revertFunction()

    Move a function `id` from identifiers back into the untypedFunctions
        table.
*/
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

    return parent.getPrototypeFields(this.funcName);
};

FunctionScope.prototype.addKnownField =
function addKnownField(fieldName) {
    if (this.knownFields.indexOf(fieldName) === -1) {
        this.knownFields.push(fieldName);
    }
};

FunctionScope.prototype.markReturnType =
function markReturnType(defn, node) {
    this.knownReturnTypes.push(defn);
    this.returnStatementASTNodes.push(node);
};

FunctionScope.prototype.getFunctionScope =
function getFunctionScope() {
    return this;
};

FunctionScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    this._addFunctionScope(funcScope);
};

FunctionScope.prototype.revertFunctionScope =
function revertFunctionScope(name, funcType) {
    if (!this.functionScopes[name]) {
        return this.parent.revertFunctionScope(name, funcType);
    }

    this._revertFunctionScope(name, funcType);
};

FunctionScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FunctionScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.functionScopes[funcName] ||
        this.parent.getKnownFunctionScope(funcName);
};

FunctionScope.prototype.restrictType =
function restrictType(name, type) {
    return this._restrictType(name, type);
};

function BranchScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'branch';

    this._restrictedThisValueType = null;
    this._narrowedThisValueType = null;
    this.narrowedTypes = Object.create(null);
}
util.inherits(BranchScope, BaseScope);

BranchScope.prototype.getThisType =
function getThisType(isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this.parent.getThisType(true);
    }

    return this._restrictedThisValueType ||
        this._narrowedThisValueType || this.parent.getThisType();
};

BranchScope.prototype.getReturnValueType =
function getReturnValueType() {
    return this.parent.getReturnValueType();
};

BranchScope.prototype.getFunctionScope =
function getFunctionScope() {
    var parent = this.parent;
    while (parent && parent.type !== 'function') {
        parent = parent.parent;
    }

    return parent;
};

BranchScope.prototype.getVar = function getVar(id, isWritable) {
    // console.log('getVar(', id, ',', this.writableTokenLookup, ')');
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id, true);
    }

    return this.typeRestrictions[id] || this.narrowedTypes[id] ||
        this.identifiers[id] || this.parent.getVar(id, isWritable);
};

BranchScope.prototype.getOwnVar = function getOwnVar(id, isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id];
    }

    return this.typeRestrictions[id] || this.narrowedTypes[id] ||
        this.identifiers[id];
};

BranchScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
    return this.parent.getUntypedFunction(id);
};

BranchScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    return this.parent.addFunctionScope(funcScope);
};

BranchScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    return this.parent.addFunctionOverloadScope(funcScope);
};

BranchScope.prototype.updateFunction =
function updateFunction(id, defn) {
    return this.parent.updateFunction(id, defn);
};

BranchScope.prototype.revertFunction =
function revertFunction(id, token) {
    return this.parent.revertFunction(id, token);
};

BranchScope.prototype.getRestrictedTypes =
function getRestrictedTypes() {
    var restricted = Object.keys(this.typeRestrictions);
    var narrowed = Object.keys(this.narrowedTypes);

    for (var i = 0; i < narrowed.length; i++) {
        if (restricted.indexOf(narrowed[i]) === -1) {
            restricted.push(narrowed[i]);
        }
    }

    return restricted;
};

BranchScope.prototype.getRestrictedThisType =
function getRestrictedThisType() {
    return this._restrictedThisValueType ||
        this._narrowedThisValueType;
};

BranchScope.prototype.narrowType = function narrowType(id, type) {
    // TODO: gaurd against double narrow ?
    // assert(!this.narrowedTypes[id], 'cannot doulbe narrow type: ' + id);
    assert(type, 'cannot restrict to null');

    if (id === 'this') {
        this._narrowedThisValueType = type;
        return null;
    }

    var token = {
        type: 'narrowedType',
        defn: type
    };
    this.narrowedTypes[id] = token;
    return token;
};

BranchScope.prototype.restrictType = function restrictType(id, type) {
    return this._restrictType(id, type);
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

BranchScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.parent.getKnownFunctionScope(funcName);
};

/*
    This permanently mutates the read-only and write-only
    state of a variable.

    When this is applied it must be applied up the chain if
    necessary as it changes the type inside and outside a scope

    However, if the type of the variable currently is
    Null%%Default or Void%%Uninitialized then only locally
    mark it as a new identifier
*/
BranchScope.prototype.forceUpdateVar =
function forceUpdateVar(id, typeDefn) {
    var currentType = this.getVar(id, true);
    var token;

    if (currentType && currentType.defn &&
        currentType.defn.type === 'typeLiteral' &&
        (
            currentType.defn.name === '%Null%%Default' ||
            currentType.defn.name === '%Void%%Uninitialized'
        )
    ) {
        assert(typeDefn, 'cannot force update to null');

        return this.restrictType(id, typeDefn);
    }

    if (!this.identifiers[id] && this.parent) {
        return this.parent.forceUpdateVar(id, typeDefn);
    }

    assert(this.identifiers[id], 'identifier must already exist');
    assert(typeDefn, 'cannot force update to null');

    token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
};
