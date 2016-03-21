'use strict';

var esprima = require('esprima');
var fs = require('fs');

var HeaderFile = require('./header-file.js');
var readJSigAST = require('./lib/read-jsig-ast.js');
var ProgramMeta = require('./meta.js');

module.exports = compile;

function compile(fileName) {
    var checker = new TypeChecker(fileName);
    checker.checkProgram();
    return checker;
}

function TypeChecker(entryFile) {
    this.entryFile = entryFile;

    this.metas = Object.create(null);
    this.headerFiles = Object.create(null);

    this.errors = [];
    this.moduleExportsType = null;
}

TypeChecker.prototype.addError = function addError(err) {
    this.errors.push(err);
};

TypeChecker.prototype.checkProgram =
function checkProgram() {
    var meta = this.getOrCreateMeta(this.entryFile);
    meta.verify();
    this.moduleExportsType = meta.moduleExportsType;
};

TypeChecker.prototype.getOrCreateHeaderFile =
function getOrCreateHeaderFile(fileName) {
    if (this.headerFiles[fileName]) {
        return this.headerFiles[fileName];
    }

    var res = readJSigAST(fileName);
    if (res.error) {
        this.addError(res.error);
        return null;
    }

    var headerFile = new HeaderFile(res.value);
    headerFile.resolveReferences();
    if (headerFile.errors.length) {
        for (var i = 0; i < headerFile.errors.length; i++) {
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
    this.metas[fileName] = meta;
    return meta;
};
