'use strict';

var esprima = require('esprima');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var resolve = require('resolve');
var process = global.process;

var Errors = require('./errors.js');
var HeaderFile = require('./header-file.js');
var parseJSigAST = require('./lib/read-jsig-ast.js').parseJSigAST;
var ProgramMeta = require('./meta.js');
var GlobalScope = require('./scope.js').GlobalScope;
var pretty = require('./lib/pretty-errors.js');
var serialize = require('../serialize.js');

var operatorsFile = path.join(__dirname, 'definitions', 'operators.hjs');
var es5File = path.join(__dirname, 'definitions', 'es5.hjs');
var isHeaderR = /\.hjs$/;

compile.TypeChecker = TypeChecker;

module.exports = compile;

function compile(fileName, options) {
    var checker = new TypeChecker(fileName, options);
    checker.checkProgram();
    return checker;
}

function TypeChecker(entryFile, options) {
    options = options || {};

    var entryFiles = null;
    if (typeof entryFile === 'string') {
        entryFiles = [entryFile];
    } else if (Array.isArray(entryFile)) {
        entryFiles = entryFile;
    } else {
        assert(false, 'entryFile must be string or array');
    }

    this.entryFiles = entryFiles;
    this.files = options.files || Object.create(null);
    this.basedir = process.cwd();

    this.globalScope = new GlobalScope();
    this.metas = Object.create(null);
    this.headerFiles = Object.create(null);

    this.definitions = Object.create(null);

    this.definitionsFolder = options.definitions || null;
    this.globalsFile = options.globalsFile || null;
    this.optin = options.optin || false;

    this.errors = [];
    this.traces = [];
    this.moduleExportsType = null;
    this.currentMeta = null;
}

TypeChecker.prototype.serializeType =
function serializeType(type, opts) {
    return serialize(type, opts);
};

TypeChecker.prototype.addError = function addError(err) {
    // console.trace('addError(' + err.type + ')');
    this.errors.push(err);
};

TypeChecker.prototype.addTrace = function addTrace(trace) {
    this.traces.push(trace);
};

TypeChecker.prototype.countErrors = function countErrors() {
    return this.errors.length;
};

TypeChecker.prototype.getErrors =
function getErrors() {
    return this.errors.slice();
};

TypeChecker.prototype.setErrors =
function setErrors(list) {
    this.errors = list;
};

TypeChecker.prototype.prettyPrintAllErrors =
function prettyPrintAllErrors() {
    return pretty.prettyPrintAllErrors(this);
};

TypeChecker.prototype.prettyPrintTraces =
function prettyPrintTraces() {
    return pretty.prettyPrintTraces(this);
};

TypeChecker.prototype.checkProgram =
function checkProgram() {
    this.loadLanguageIdentifiers();
    this.preloadDefinitions();
    this.preloadGlobals();

    var meta;
    for (var i = 0; i < this.entryFiles.length; i++) {
        meta = this.getOrCreateMeta(this.entryFiles[i]);
    }

    if (this.entryFiles.length === 1) {
        this.moduleExportsType = meta.moduleExportsType;
    }
};

TypeChecker.prototype.loadLanguageIdentifiers =
function loadLanguageIdentifiers() {
    var opHeaderFile = this.getOrCreateHeaderFile(operatorsFile, true);
    assert(this.errors.length === 0, 'must be no errors');
    assert(opHeaderFile, 'must be able to load operators');

    var assignments = opHeaderFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        this.globalScope._addOperator(a.identifier, a.typeExpression);
    }

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File, true);
    assert(this.errors.length === 0, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    assignments = es5HeaderFile.getResolvedAssignments();

    for (i = 0; i < assignments.length; i++) {
        a = assignments[i];

        if (a.identifier === 'Error') {
            // Must know that in ES5 the new Error() constructor
            // brands the result as an Error instance.
            a.typeExpression.brand = 'Error';
        }

        this.globalScope._addVar(a.identifier, a.typeExpression);
    }

    this.globalScope._addVirtualType(
        'TString', es5HeaderFile.getToken('TString')
    );
    this.globalScope._addVirtualType(
        'TNumber', es5HeaderFile.getToken('TNumber')
    );
    this.globalScope._addVirtualType(
        'TArray', es5HeaderFile.getToken('TArray')
    );
    this.globalScope._addVirtualType(
        'TObject', es5HeaderFile.getToken('TObject')
    );
};

TypeChecker.prototype.loadJavaScriptIntoIndexTable =
function loadJavaScriptIntoIndexTable(indexTable) {
    var before = this.errors.length;

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File, true);
    assert(this.errors.length === before, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    es5HeaderFile.resolveReferences();
    indexTable['Error'] = es5HeaderFile.indexTable['Error'];
};

TypeChecker.prototype.getOrCreateHeaderFile =
function getOrCreateHeaderFile(fileName, required) {
    assert(typeof required === 'boolean',
        'required parameter needed');

    if (!this.files[fileName]) {
        fileName = path.resolve(fileName);
    }

    if (this.headerFiles[fileName]) {
        return this.headerFiles[fileName];
    }

    var source = this.files[fileName];
    if (!source) {
        if (!fs.existsSync(fileName)) {
            if (required) {
                this.addError(Errors.CouldNotFindHeaderFile({
                    fileName: fileName
                }));
            }
            return null;
        }

        source = fs.readFileSync(fileName, 'utf8');
    }

    var res = parseJSigAST(source);
    if (res.error) {
        res.error.fileName = fileName;
        this.addError(res.error);
        return null;
    }

    if (!res.value) {
        return null;
    }

    var headerFile = new HeaderFile(this, res.value, fileName);
    headerFile.resolveReferences();
    if (headerFile.errors.length) {
        for (var i = 0; i < headerFile.errors.length; i++) {
            headerFile.errors[i].fileName = fileName;
            this.addError(headerFile.errors[i]);
        }
        return null;
    }

    this.headerFiles[fileName] = headerFile;
    return headerFile;
};

TypeChecker.prototype.getOrCreateMeta =
function getOrCreateMeta(fileName) {
    if (!this.files[fileName]) {
        fileName = resolve.sync(fileName, {
            basedir: this.basedir
        });
    }

    if (this.metas[fileName]) {
        return this.metas[fileName];
    }

    var source = this.files[fileName];
    if (!source) {
        source = fs.readFileSync(fileName, 'utf8');
    }

    var ast = esprima.parse(source, {
        loc: true,
        comment: true
    });

    var meta = new ProgramMeta(this, ast, fileName, source);
    this.metas[fileName] = meta;

    this.currentMeta = meta;
    meta.verify();
    this.currentMeta = null;

    return meta;
};

TypeChecker.prototype.getDefinition =
function getDefinition(id) {
    return this.definitions[id];
};

TypeChecker.prototype._addDefinition =
function _addDefinition(id, typeDefn) {
    var token = {
        type: 'external-definition',
        defn: typeDefn
    };
    this.definitions[id] = token;
    return token;
};

TypeChecker.prototype.getDefinitionFilePath =
function getDefinitionFilePath(packageName) {
    return path.join(
        this.definitionsFolder, packageName + '.hjs'
    );
};

TypeChecker.prototype.preloadDefinitions =
function preloadDefinitions() {
    if (!this.definitionsFolder) {
        return;
    }

    var files = fs.readdirSync(this.definitionsFolder);
    for (var i = 0; i < files.length; i++) {
        var fileName = path.join(this.definitionsFolder, files[i]);
        if (!isHeaderR.test(fileName)) {
            continue;
        }

        var headerFile = this.getOrCreateHeaderFile(fileName, true);
        if (!headerFile) {
            continue;
        }

        var assignments = headerFile.getResolvedAssignments();
        for (var j = 0; j < assignments.length; j++) {
            var a = assignments[j];
            this._addDefinition(a.identifier, a.typeExpression);
        }
    }
};

TypeChecker.prototype.preloadGlobals =
function preloadGlobals() {
    if (!this.globalsFile) {
        return;
    }

    var headerFile = this.getOrCreateHeaderFile(this.globalsFile, true);
    if (!headerFile) {
        return;
    }

    var assignments = headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        this.globalScope._addVar(a.identifier, a.typeExpression);
    }
};
