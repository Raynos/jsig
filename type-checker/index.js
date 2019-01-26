'use strict';

/* @jsig */

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

var operatorsFile = path.join(
    __dirname, 'builtin-definitions', 'operators.hjs'
);
var es5File = path.join(
    __dirname, 'builtin-definitions', 'es5.hjs'
);
var isHeaderR = /\.hjs$/;
var BIN_HEADER = '#!/usr/bin/env';

TypeChecker.compile = function compile(fileName, options) {
    var checker = new TypeChecker(fileName, options);
    checker.checkProgram();
    return checker;
};

module.exports = TypeChecker;

function TypeChecker(entryFile, options) {
    options = options || {};

    var entryFiles = entryFile;
    if (typeof entryFiles === 'string') {
        entryFiles = [entryFiles];
    }

    if (!Array.isArray(entryFiles)) {
        assert(false, 'entryFile must be string or array');
    }

    this.entryFiles = entryFiles;
    this.files = options.files || Object.create(null);
    this.basedir = process ? process.cwd() : '/';

    this.globalScope = new GlobalScope(this);
    this.metas = Object.create(null);
    this.headerFiles = Object.create(null);

    this.definitions = Object.create(null);

    this.definitionsFolder = options.definitions || null;
    this.globalsFile = options.globalsFile || null;
    this.optin = options.optin || false;
    this.fullInference = options.fullInference || false;
    this.previousChecker = options.previousChecker || null;

    this.errors = [];
    this.traces = [];
    this.moduleExportsType = null;
    this.currentMeta = null;

    this.errorType = null;
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

TypeChecker.prototype.prettyPrintErrorStatement =
function prettyPrintErrorStatement(error) {
    return pretty.prettyPrintErrorStatement(this, error);
};

TypeChecker.prototype.prettyPrintAllErrorsWithTrace =
function prettyPrintAllErrors() {
    return pretty.prettyPrintAllErrorsWithTrace(this);
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
        meta = this.getOrCreateMeta(this.entryFiles[i], {
            loose: true
        });
    }

    if (this.entryFiles.length === 1 && meta) {
        this.moduleExportsType = meta.moduleExportsType;
    }
};

TypeChecker.prototype.loadLanguageIdentifiers =
function loadLanguageIdentifiers() {
    if (this.previousChecker) {
        this.errorType = this.previousChecker.errorType;
        this.globalScope = this.previousChecker.globalScope;
        return;
    }

    var opHeaderFile = this.getOrCreateHeaderFile(operatorsFile);
    assert(this.errors.length === 0, 'must be no errors');
    assert(opHeaderFile, 'must be able to load operators');

    var assignments = opHeaderFile.getResolvedAssignments();
    var a;
    for (var i = 0; i < assignments.length; i++) {
        a = assignments[i];
        this.globalScope._addOperator(a.identifier, a.typeExpression);
    }

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File);
    assert(this.errors.length === 0, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    assignments = es5HeaderFile.getResolvedAssignments();

    for (i = 0; i < assignments.length; i++) {
        a = assignments[i];

        if (a.identifier === 'Error') {
            // Must know that in ES5 the new Error() constructor
            // brands the result as an Error instance.

            /*jsig ignore next: narrow type cannot narrow by string*/
            a.typeExpression.brand = 'Error';
        }

        /*jsig ignore next: tech debt... */
        if (a.identifier === 'Array') {
            var arrType = a.typeExpression;
            assert(arrType.type === 'intersectionType',
                'builtin Array is an intersection');

            var arrObj = arrType.intersections[0];
            assert(arrObj.type === 'object',
                'builtin Array is an object');

            var index = arrObj.buildObjectIndex();
            assert(index['isArray'] &&
                index['isArray'].type === 'function',
                'must implement isArray'
            );

            // Must know that isArray() function has the property
            // that it can narrow arrays
            index['isArray'].specialKind = 'isArray';
        }

        this.globalScope._addVar(a.identifier, a.typeExpression);
    }

    var errType = es5HeaderFile.getToken('Error');
    /*jsig ignore next: need to implement narrow by assert()*/
    errType.brand = 'Error';
    this.errorType = errType;

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
    this.globalScope._addVirtualType(
        'TDate', es5HeaderFile.getToken('TDate')
    );
    this.globalScope._addVirtualType(
        'TFunction', es5HeaderFile.getToken('TFunction')
    );
    this.globalScope._addVirtualType(
        'TRegExp', es5HeaderFile.getToken('TRegExp')
    );
};

/*
    Error is a global type, it must be preloaded into every
    other type table for resolution to work. Currently it's the
    only global type as the virtual types are never referenced but
    are instead builtins that are not resolved to anything else.
*/
TypeChecker.prototype.loadJavaScriptIntoIndexTable =
function loadJavaScriptIntoIndexTable(indexTable) {
    var before = this.errors.length;

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File);
    assert(this.errors.length === before, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    es5HeaderFile.resolveReferences();
    indexTable['Error'] = es5HeaderFile.indexTable['Error'];
};

TypeChecker.prototype.tryReadHeaderFile =
function tryReadHeaderFile(primaryFileName) {
    if (!this.files[primaryFileName]) {
        primaryFileName = path.resolve(primaryFileName);
    }

    var headerFile;
    if (this.headerFiles[primaryFileName]) {
        headerFile = this.headerFiles[primaryFileName];
        if (headerFile.hasErrors()) {
            return true;
        }

        return true;
    }

    var source = this.files[primaryFileName];
    // TODO: type checker does not complain about dead code.
    if (source || source === '') {
        return true;
    }

    if (fs.existsSync(primaryFileName)) {
        return true;
    }

    var secondaryFileName = getSecondaryFileName(primaryFileName);
    if (fs.existsSync(secondaryFileName)) {
        return true;
    }

    return false;
};

/*
    For each js + hjs file it can exist in two locations

    /foo/bar/x.js
    /foo/bar/x.hjs

    or

    /foo/bar/x.js
    /foo/bar/_types/x.hjs
*/
function getSecondaryFileName(primaryFileName) {
    var segments = primaryFileName.split(path.sep);
    var basename = segments[segments.length - 1];
    segments[segments.length - 1] = '_types';
    segments[segments.length] = basename;

    var secondaryFileName = segments.join(path.sep);
    return secondaryFileName;
}

TypeChecker.prototype._readAndParseHeaderFile =
function _readAndParseHeaderFile(source, fileName) {
    var res = parseJSigAST(source);
    if (res.error) {
        /*jsig ignore next: Support narrowing member expr? */
        res.error.fileName = fileName;
        this.addError(res.error);
        return null;
    }

    if (!res.value) {
        return null;
    }

    return res.value;
};

/* getOrCreateHeaderFile by headerFileName */
TypeChecker.prototype.getOrCreateHeaderFile =
function getOrCreateHeaderFile(
    primaryFileName, node, importSourceText, importFileName
) {
    if (!this.files[primaryFileName]) {
        primaryFileName = path.resolve(primaryFileName);
    }

    var headerFile;
    if (this.headerFiles[primaryFileName]) {
        headerFile = this.headerFiles[primaryFileName];
        if (headerFile.hasErrors()) {
            return null;
        }

        return headerFile;
    }

    var source = this.files[primaryFileName];
    if (typeof source !== 'string') {
        if (!fs.existsSync(primaryFileName)) {
            var secondaryFileName = getSecondaryFileName(primaryFileName);

            if (fs.existsSync(secondaryFileName)) {
                primaryFileName = secondaryFileName;
            } else {
                this.addError(Errors.CouldNotFindHeaderFile({
                    fileName: importFileName || 'unknown',
                    otherFile: primaryFileName,
                    loc: node ? node.loc : null,
                    line: node ? node.loc.start.line : null,
                    source: importSourceText ? importSourceText : null
                }));
                return null;
            }
        }

        source = fs.readFileSync(primaryFileName, 'utf8');
    }

    return this._createHeaderFile(source, primaryFileName);
};

TypeChecker.prototype._createHeaderFile =
function _createHeaderFile(source, fileName) {
    var jsigAST = this._readAndParseHeaderFile(source, fileName);
    if (!jsigAST) {
        return null;
    }

    var headerFile = new HeaderFile(this, jsigAST, fileName, source);
    this.headerFiles[fileName] = headerFile;

    headerFile.resolveReferences();

    if (headerFile.hasErrors()) {
        for (var i = 0; i < headerFile.errors.length; i++) {
            headerFile.errors[i].fileName = fileName;
            this.addError(headerFile.errors[i]);
        }
        return null;
    }

    return headerFile;
};

function tryResolveSync(fileName, basedir) {
    var tuple = null;

    /*eslint-disable no-restricted-syntax*/
    try {
        tuple = [null, resolve.sync(fileName, {
            basedir: basedir
        })];
    } catch (err) {
        tuple = [err, null];
    }
    /*eslint-enable no-restricted-syntax*/

    return tuple;
}

/*jsig ignore next: cannot return err with extra fields*/
function tryEsprimaParse(source) {
    var tuple = null;

    /*eslint-disable no-restricted-syntax*/
    try {
        tuple = [null, esprima.parse(source, {
            loc: true,
            attachComment: true,
            comment: true
        })];
    } catch (err) {
        tuple = [err, null];
    }
    /*eslint-enable no-restricted-syntax*/

    return tuple;
}

TypeChecker.prototype.getOrCreateMeta =
function getOrCreateMeta(fileName, opts) {
    if (!this.files[fileName]) {
        var tuple = tryResolveSync(fileName, this.basedir);
        if (tuple[0]) {
            this.addError(Errors.CouldNotFindFile({
                fileName: fileName,
                origMessage: tuple[0].message
            }));
            return null;
        }

        fileName = tuple[1];
    }

    if (this.metas[fileName]) {
        return this.metas[fileName];
    }

    var source = this.files[fileName];
    if (typeof source !== 'string') {
        source = fs.readFileSync(fileName, 'utf8');
    }

    // Hack: to support JSON
    if (path.extname(fileName) === '.json') {
        source = 'module.exports = ' + source;
    }

    // Munge source text if it has unix executable header
    if (source.indexOf(BIN_HEADER) === 0) {
        var firstNewline = source.indexOf('\n');
        source = source.slice(firstNewline);
    }

    // In loose mode we do not care about meta.moduleExportsNode
    if (opts.loose && this.optin) {
        var jsigCommentIndex = source.indexOf('@jsig');
        if (jsigCommentIndex === -1) {
            return null;
        }
    }

    var parserTuple = tryEsprimaParse(source);
    if (parserTuple[0]) {
        var parseError = parserTuple[0];
        this.addError(Errors.CouldNotParseJavaScript({
            fileName: fileName,
            // Should be 1 index.
            line: parseError.lineNumber,
            detail: parseError.description,
            charOffset: parseError.index,
            source: source
        }));
        return null;
    }

    var ast = parserTuple[1];

    var meta = new ProgramMeta(this, ast, fileName, source);
    this.metas[fileName] = meta;

    var previousMeta = this.currentMeta;
    this.currentMeta = meta;
    meta.verify();
    this.currentMeta = previousMeta;

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
    if (!this.definitionsFolder) {
        return null;
    }

    return path.join(
        this.definitionsFolder, packageName + '.hjs'
    );
};

/*
    definitions folder is preloaded and it contains the types for any
    require calls that you might invoke. This allows you to define the
    type of third party dependencies.
*/
TypeChecker.prototype.preloadDefinitions =
function preloadDefinitions() {
    var i = 0;
    if (this.previousChecker) {
        var defns = this.previousChecker.definitions;
        var keys = Object.keys(defns);

        for (i = 0; i < keys.length; i++) {
            this._addDefinition(keys[i], defns[keys[i]].defn);
        }

        return;
    }

    if (!this.definitionsFolder) {
        return;
    }

    var files = fs.readdirSync(this.definitionsFolder);
    for (i = 0; i < files.length; i++) {
        var fileName = path.join(this.definitionsFolder, files[i]);
        if (!isHeaderR.test(fileName)) {
            continue;
        }

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

/*
    The globals file allows you to define any global variables that
    exist in your environment outside of ES5.

    For example `process` in nodejs.
*/
TypeChecker.prototype.preloadGlobals =
function preloadGlobals() {
    if (this.previousChecker) {
        return;
    }

    if (!this.globalsFile) {
        return;
    }

    var headerFile = this.getOrCreateHeaderFile(this.globalsFile);
    if (!headerFile) {
        return;
    }

    var assignments = headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        this.globalScope._addVar(a.identifier, a.typeExpression);
    }
};
