'use strict';

var assert = require('assert');
var path = require('path');
var resolve = require('resolve');

var Errors = require('./errors.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');
var JsigAST = require('../ast/');
var deepCloneJSIG = require('./lib/deep-clone-ast.js');

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

/*eslint max-statements: [2, 90], complexity: [2, 30]*/
HeaderFile.prototype.replaceGenericLiteral =
function replaceGenericLiteral(ast, rawAst, topStack) {
    var name = ast.value.name;

    // var serialize = require('../serialize.js');

    var typeDefn = this.genericIndexTable[name];
    if (!typeDefn) {
        this.errors.push(Errors.UnknownLiteralError({
            literal: name
        }));
        return null;
    }

    assert(typeDefn.type === 'typeDeclaration',
        'A non builtin generic must come from type declaration');

    // console.log('replaceGenericLiteral(' + name + ')', {
    //     ast: ast.generics.length,
    //     rawValue: serialize(ast),
    //     args: ast.generics.map(serialize)
    // });

    var args = ast.generics;
    var expectedArgs = typeDefn.generics;
    // console.log('expectedArgs?', typeDefn);

    var idMapping = Object.create(null);
    for (var i = 0; i < expectedArgs.length; i++) {
        idMapping[expectedArgs[i].name] = args[i];
    }

    var copyType = deepCloneJSIG(typeDefn.typeExpression);
    copyType._raw = null;

    // console.log('found typeExpression', {
    //     copyType: serialize(copyType),
    //     newType: serialize(idMapping['T'])
    // });

    var locations = typeDefn.seenGenerics;
    for (i = 0; i < locations.length; i++) {

        var g = locations[i];
        var newType = idMapping[g.name];
        assert(newType, 'newType must exist');

        // Only replace locations into the typeExpression
        // of the type declaration
        if (g.location[0] !== 'typeExpression') {
            continue;
        }

        var stack = g.location.slice(1);

        // console.log('inlining location', {
        //     newType: serialize(newType),
        //     stack: stack
        // });

        var obj = copyType;
        for (var j = 0; j < stack.length - 1; j++) {
            obj = obj[stack[j]];
            obj._raw = null;
        }

        var lastProp = stack[stack.length - 1];
        // console.log('setting', {
        //     obj: obj,
        //     lastProp: lastProp,
        //     newType: serialize(newType),
        //     g: g
        // });

        var currentGenericLiteral = obj[lastProp];
        assert(g.uuid === currentGenericLiteral.genericIdentifierUUID,
            'uuid must match before we insert the concrete type');

        obj[lastProp] = newType;
    }

    if (this.astReplacer.currentTypeDeclaration) {
        var typeDecl = this.astReplacer.currentTypeDeclaration;

        var exprIndex = topStack.lastIndexOf('typeExpression');
        var outerStack = topStack.slice(exprIndex);

        // seenGenerics are the locations where T exist
        // in the outer type declaration

        // typeDefn.seenGenerics is the location T exists
        // in the inner inlined generic type template

        // topStack is the current location inside the
        // outer typeDeclaration that we are in.

        var newSeenGenerics = [];

        for (i = 0; i < typeDecl.seenGenerics.length; i++) {
            var outerLoc = typeDecl.seenGenerics[i];
            if (outerLoc.location[0] !== 'typeExpression') {
                newSeenGenerics.push(outerLoc);
                continue;
            }

            if (!arrayStartsWith(outerLoc.location, outerStack)) {
                newSeenGenerics.push(outerLoc);
                continue;
            }

            // var locInto = outerLoc.location.slice(outerStack.length);
            // console.log('varName', outerLoc.name);
            // console.log('varUUID', outerLoc.uuid);

            var argIndex = -1;
            for (j = 0; j < ast.generics.length; j++) {
                if (ast.generics[j].genericIdentifierUUID === outerLoc.uuid) {
                    argIndex = j;
                    break;
                }
            }

            assert(argIndex !== -1, 'could not find index of seenGeneric');

            var addedLocations = false;
            var innerUUID = typeDefn.generics[argIndex].genericIdentifierUUID;
            for (j = 0; j < typeDefn.seenGenerics.length; j++) {
                var innerLoc = typeDefn.seenGenerics[j];
                if (innerLoc.location[0] !== 'typeExpression') {
                    continue;
                }

                if (innerLoc.uuid !== innerUUID) {
                    continue;
                }

                var innerStack = innerLoc.location.slice(1);
                var newStack = outerStack.slice();
                for (var k = 0; k < innerStack.length; k++) {
                    newStack.push(innerStack[k]);
                }

                var newLoc = JsigAST.locationLiteral(
                    outerLoc.name, newStack, outerLoc.uuid
                );
                newSeenGenerics.push(newLoc);
                addedLocations = true;
            }

            assert(addedLocations, 'could not find new seenGeneric');
        }

        assert(newSeenGenerics.length >= typeDecl.seenGenerics.length,
            'when replacing seenGenerics must be at least as many');
        typeDecl.seenGenerics = newSeenGenerics;

        // console.log('inside a typeDeclaration', {
        //     typeDecl: serialize(typeDecl),
        //     args: ast.generics,
        //     outerStack: outerStack,
        //     typeDefn: typeDefn.generics
        // });
    }

    // console.log('typeDefn?', {
    //     expr: serialize(typeDefn.typeExpression),
    //     copyType: serialize(copyType)
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
