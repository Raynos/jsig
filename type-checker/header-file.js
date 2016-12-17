'use strict';

var assert = require('assert');
var path = require('path');
var resolve = require('resolve');

var Errors = require('./errors.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');
var JsigAST = require('../ast/');
var deepCloneJSIG = require('./lib/deep-clone-ast.js');
var isSameType = require('./lib/is-same-type.js');

module.exports = HeaderFile;

function HeaderFile(checker, jsigAst, fileName, source) {
    this.checker = checker;
    this.source = source;
    this.fileName = fileName;
    this.folderName = path.dirname(fileName);
    this.rawJsigAst = jsigAst;
    this.resolvedJsigAst = null;

    this.indexTable = Object.create(null);
    this.genericIndexTable = Object.create(null);
    this.exportType = null;
    this.errors = [];
    this.dependentHeaders = Object.create(null);
    this.astReplacer = new JsigASTReplacer(this);

    this.genericResolutionCache = Object.create(null);
}

HeaderFile.prototype.replace = function replace(ast, rawAst, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, rawAst, stack);
    } else if (ast.type === 'import') {
        return this.replaceImport(ast, rawAst, stack);
    } else if (ast.type === 'genericLiteral') {
        return this.replaceGenericLiteral(ast, rawAst, stack);
    } else {
        assert(false, 'unexpected ast.type: ' + ast.type);
    }
};

HeaderFile.prototype.getToken =
function getToken(name) {
    return this.indexTable[name];
};

/*eslint dot-notation: 0*/
HeaderFile.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, rawAst, stack) {
    var name = ast.name;

    if (name === 'Error' && !this.indexTable['Error']) {
        this.checker.loadJavaScriptIntoIndexTable(this.indexTable);
    }

    var typeDefn = this.indexTable[name];
    if (!typeDefn) {
        this.errors.push(Errors.UnknownLiteralError({
            literal: name,
            loc: ast.loc,
            line: ast.line,
            source: this.source
        }));
        return null;
    }

    return typeDefn;
};

function GenericReplacer(headerFile, actualArgs, expectedArgs) {
    this.headerFile = headerFile;
    this.checker = headerFile.checker;
    this.actualArgs = actualArgs;
    this.expectedArgs = expectedArgs;
}

GenericReplacer.prototype.replace =
function replace(ast, rawAst, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, rawAst, stack);
    } else if (ast.type === 'genericLiteral') {
        return this.replaceGenericLiteral(ast, rawAst, stack);
    } else {
        assert(false, 'unexpected ast.type: ' + ast.type);
    }
};

GenericReplacer.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, rawAst, stack) {
    assert(ast.isGeneric, 'must be generic to replace');

    var foundIndex = -1;
    for (var i = 0; i < this.expectedArgs.length; i++) {
        var arg = this.expectedArgs[i];
        if (arg.name === ast.name &&
            arg.genericIdentifierUUID === ast.genericIdentifierUUID
        ) {
            foundIndex = i;
            break;
        }
    }

    assert(foundIndex !== -1, 'must have found this generic: ' + ast.name);
    return this.actualArgs[foundIndex];
};

GenericReplacer.prototype.replaceGenericLiteral =
function replaceGenericLiteral(ast, rawAst, stack) {
    return this.headerFile.replaceGenericLiteral(
        ast, rawAst, stack
    );
};

HeaderFile.prototype.resolveGenericLiteral =
function resolveGenericLiteral(ast, typeDefn, copyType) {
    var args = ast.generics;
    var expectedArgs = typeDefn.generics;

    copyType._raw = null;

    var replacer = new JsigASTReplacer(
        new GenericReplacer(this, args, expectedArgs), false, true, true
    );
    var rawAst = ast;
    // If any argument is generic then do not make it the "raw ast"
    // for (var i = 0; i < ast.generics.length; i++) {
    //     if (ast.generics[i].isGeneric) {
    //         rawAst = null;
    //         break;
    //     }
    // }

    copyType = replacer.inlineReferences(copyType, rawAst, []);
};

function CacheEntry(typeDefn) {
    this.typeDefn = typeDefn;

    this.solutions = [];
}

CacheEntry.prototype.addSolution =
function addSolution(args, resolvedType) {
    this.solutions.push(new CacheEntrySolution(args, resolvedType));
};

CacheEntry.prototype.findSolution =
function findSolution(args) {
    var solution = null;
    for (var i = 0; i < this.solutions.length; i++) {
        var maybeSolution = this.solutions[i];
        if (maybeSolution.args.length !== args.length) {
            continue;
        }

        var skip = false;
        for (var j = 0; j < maybeSolution.args.length; j++) {
            if (!isSameType(maybeSolution.args[j], args[j])) {
                skip = true;
                break;
            }
        }

        if (!skip) {
            solution = maybeSolution.resolvedType;
            break;
        }
    }

    return solution;
};

function CacheEntrySolution(args, resolvedType) {
    this.args = args;
    this.resolvedType = resolvedType;
}

HeaderFile.prototype.replaceGenericLiteral =
function replaceGenericLiteral(ast, rawAst, topStack) {
    var name = ast.value.name;

    var typeDefn = this.genericIndexTable[name];
    if (!typeDefn) {
        this.errors.push(Errors.UnknownLiteralError({
            literal: name
        }));
        return null;
    }

    assert(typeDefn.type === 'typeDeclaration',
        'A non builtin generic must come from type declaration');

    var cacheEntry = this.genericResolutionCache[name];
    var copyType;
    if (!cacheEntry) {
        cacheEntry = this.genericResolutionCache[name] = new CacheEntry();
        copyType = deepCloneJSIG(typeDefn.typeExpression);
        cacheEntry.addSolution(ast.generics, copyType);
        this.resolveGenericLiteral(ast, typeDefn, copyType);
    } else {
        copyType = cacheEntry.findSolution(ast.generics);
        if (!copyType) {
            copyType = deepCloneJSIG(typeDefn.typeExpression);
            cacheEntry.addSolution(ast.generics, copyType);
            this.resolveGenericLiteral(ast, typeDefn, copyType);
        }
    }

    // console.log('pre replaceGenericLiteral()');
    // console.log('replaceGenericLiteral()', {
    //     rawAST: this.checker.serializeType(ast),
    //     typeDefn: this.checker.serializeType(typeDefn.typeExpression),
    //     copyType: this.checker.serializeType(copyType)
    // });

    return copyType;
};

// Does the outer array start with the members of the inner array
function arrayStartsWith(outer, inner) {
    if (outer.length < inner.length) {
        return false;
    }

    for (var i = 0; i < inner.length; i++) {
        if (outer[i] !== inner[i]) {
            return false;
        }
    }

    return true;
}

HeaderFile.prototype._getHeaderFile =
function _getHeaderFile(importNode) {
    var depPath = importNode.dependency;
    var fileName = this._resolvePath(depPath, this.folderName);
    if (fileName === null) {
        // Could not resolve header
        this.errors.push(Errors.CouldNotFindHeaderFile({
            otherFile: depPath,
            loc: importNode.loc,
            line: importNode.line,
            source: this.source
        }));
        return null;
    }

    var otherHeader = this.checker.getOrCreateHeaderFile(
        fileName, importNode, this.source, this.fileName
    );
    if (otherHeader === null) {
        return null;
    }

    this.dependentHeaders[otherHeader.fileName] = otherHeader;
    return otherHeader;
};

// Find another HeaderFile instance for filePath
// Then reach into indexTable and grab tokens
// Copy tokens into local index table
HeaderFile.prototype.replaceImport =
function replaceImport(ast, rawAst) {
    if (ast.isMacro) {
        return this.replaceImportMacro(ast, rawAst);
    }

    var otherHeader = this._getHeaderFile(ast);
    if (!otherHeader || otherHeader.hasErrors()) {
        this.errors.push(Errors.CannotImport({
            otherFile: ast.dependency,
            loc: ast.loc,
            line: ast.line,
            source: this.source
        }));
        return null;
    }

    for (var i = 0; i < ast.types.length; i++) {
        var t = ast.types[i];
        assert(t.type === 'typeLiteral', 'expected typeLiteral');

        if (otherHeader.indexTable[t.name]) {
            this.addToken(t.name, otherHeader.indexTable[t.name]);
        } else if (otherHeader.genericIndexTable[t.name]) {
            this.addGenericToken(t.name, otherHeader.genericIndexTable[t.name]);
        } else {
            this.errors.push(Errors.CannotImportToken({
                identifier: t.name,
                otherFile: otherHeader.fileName,
                loc: t.loc,
                line: t.line,
                source: this.source
            }));
        }
    }

    return ast;
};

HeaderFile.prototype.replaceImportMacro =
function replaceImportMacro(ast, rawAst) {
    var filePath = resolve.sync(ast.dependency, {
        basedir: this.folderName
    });

    for (var i = 0; i < ast.types.length; i++) {
        var t = ast.types[i];
        assert(t.type === 'typeLiteral', 'expected typeLiteral');

        var macro = JsigAST.macroLiteral(t.name, filePath);
        this.addToken(t.name, macro);
    }

    return ast;
};

HeaderFile.prototype._resolvePath =
function resolvePath(possiblePath, dirname) {
    if (possiblePath[0] === path.sep) {
        // is absolute path
        return possiblePath;
    } else if (possiblePath[0] === '.') {
        // is relative path
        return path.resolve(dirname, possiblePath);
    } else {
        // TODO: improve handling to reach into sub modules
        assert(possiblePath.indexOf('/') === -1,
            'node_modules nested files lookup not implemented');

        return this.checker.getDefinitionFilePath(possiblePath);
    }
};

HeaderFile.prototype.addToken =
function addToken(token, defn) {
    assert(!this.indexTable[token], 'cannot double add token');
    this.indexTable[token] = defn;
};

HeaderFile.prototype.addGenericToken =
function addGenericToken(token, expr) {
    assert(!this.indexTable[token], 'cannout double add generic token');
    assert(!this.genericIndexTable[token], 'cannot double add generic token');
    this.genericIndexTable[token] = expr;
};

HeaderFile.prototype.addDefaultExport =
function addDefaultExport(defn) {
    assert(this.exportType === null, 'cannot have double export');
    this.exportType = defn;
};

HeaderFile.prototype.resolveReferences =
function resolveReferences() {
    if (this.resolvedJsigAst) {
        return;
    }

    var ast = this.rawJsigAst;
    var copyAst = deepCloneJSIG(ast);

    for (var i = 0; i < copyAst.statements.length; i++) {
        var line = copyAst.statements[i];

        if (line.type === 'typeDeclaration') {
            if (line.typeExpression.type === 'typeLiteral') {
                assert(line.typeExpression.builtin,
                    'cannot alias non-builtin types...');
            }

            if (line.generics.length > 0) {
                this.addGenericToken(line.identifier, line);
            } else {
                this.addToken(line.identifier, line.typeExpression);
            }
        }
    }

    copyAst = this.astReplacer.inlineReferences(copyAst, ast, []);

    // Hoist default export only after inlining it.
    for (i = 0; i < copyAst.statements.length; i++) {
        line = copyAst.statements[i];

        if (line.type === 'defaultExport') {
            this.addDefaultExport(line.typeExpression);
        }
    }

    this.resolvedJsigAst = copyAst;
};

HeaderFile.prototype.inlineReferences =
function inlineReferences(ast) {
    var copyAst = deepCloneJSIG(ast);

    return this.astReplacer.inlineReferences(copyAst, ast, []);
};

HeaderFile.prototype.getResolvedAssignments =
function getResolvedAssignments() {
    this.resolveReferences();

    if (!this.resolvedJsigAst) {
        return null;
    }

    var statements = [];
    for (var i = 0; i < this.resolvedJsigAst.statements.length; i++) {
        if (this.resolvedJsigAst.statements[i].type === 'assignment') {
            statements.push(this.resolvedJsigAst.statements[i]);
        }
    }

    return statements;
};

HeaderFile.prototype.hasErrors =
function hasErrors() {
    if (this.errors.length > 0) {
        return true;
    }

    var keys = Object.keys(this.dependentHeaders);
    for (var i = 0; i < keys.length; i++) {
        var otherHeader = this.dependentHeaders[keys[i]];

        if (otherHeader.errors.length > 0) {
            return true;
        }
    }

    return false;
};

HeaderFile.prototype.getExportType =
function getExportType() {
    this.resolveReferences();

    return this.exportType;
};
