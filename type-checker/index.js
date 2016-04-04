'use strict';

var esprima = require('esprima');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var HeaderFile = require('./header-file.js');
var readJSigAST = require('./lib/read-jsig-ast.js');
var ProgramMeta = require('./meta.js');
var GlobalScope = require('./scope.js').GlobalScope;

var operatorsFile = path.join(__dirname, 'definitions', 'operators.hjs');
var es5File = path.join(__dirname, 'definitions', 'es5.hjs');

compile.TypeChecker = TypeChecker;

module.exports = compile;

function compile(fileName, options) {
    var checker = new TypeChecker(fileName, options);
    checker.checkProgram();
    return checker;
}

function TypeChecker(entryFile, options) {
    this.entryFile = entryFile;

    this.globalScope = new GlobalScope();
    this.metas = Object.create(null);
    this.headerFiles = Object.create(null);
    this.definitions = Object.create(null);

    this.definitionsFolder = options ? options.definitions : null;

    this.errors = [];
    this.moduleExportsType = null;
}

TypeChecker.prototype.addError = function addError(err) {
    this.errors.push(err);
};

TypeChecker.prototype.countErrors = function countErrors() {
    return this.errors.length;
};

TypeChecker.prototype.checkProgram =
function checkProgram() {
    this.loadLanguageIdentifiers();
    this.preloadDefinitions();

    var meta = this.getOrCreateMeta(this.entryFile);
    this.moduleExportsType = meta.moduleExportsType;
};

TypeChecker.prototype.loadLanguageIdentifiers =
function loadLanguageIdentifiers() {
    var opHeaderFile = this.getOrCreateHeaderFile(operatorsFile);
    assert(this.errors.length === 0, 'must be no errors');
    assert(opHeaderFile, 'must be able to load operators');

    var assignments = opHeaderFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        this.globalScope._addOperator(a.identifier, a.typeExpression);
    }

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File);
    assert(this.errors.length === 0, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    assignments = es5HeaderFile.getResolvedAssignments();
    for (i = 0; i < assignments.length; i++) {
        a = assignments[i];
        this.globalScope._addVar(a.identifier, a.typeExpression);
    }

    this.globalScope._addVirtualType(
        'TString', es5HeaderFile.getToken('TString')
    );

    this.globalScope.loadLanguageIdentifiers();
};

TypeChecker.prototype.getOrCreateHeaderFile =
function getOrCreateHeaderFile(fileName) {
    if (this.headerFiles[fileName]) {
        return this.headerFiles[fileName];
    }

    var res = readJSigAST(fileName);
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
    if (this.metas[fileName]) {
        return this.metas[fileName];
    }

    var source = fs.readFileSync(fileName, 'utf8');
    var ast = esprima.parse(source, {
        loc: true
    });
    var meta = new ProgramMeta(this, ast, fileName, source);
    meta.verify();

    this.metas[fileName] = meta;
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

TypeChecker.prototype.preloadDefinitions =
function preloadDefinitions() {
    if (!this.definitionsFolder) {
        return;
    }

    var files = fs.readdirSync(this.definitionsFolder);
    for (var i = 0; i < files.length; i++) {
        var fileName = path.join(this.definitionsFolder, files[i]);
        var headerFile = this.getOrCreateHeaderFile(fileName);
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
