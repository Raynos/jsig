'use strict';

var path = require('path');
var assert = require('assert');

var isModuleExports = require('./lib/is-module-exports.js');
var serialize = require('../serialize.js');
var ASTVerifier = require('./ast-verifier.js');
var TypeInference = require('./type-inference.js');
var SubTypeChecker = require('./sub-type.js');
var NarrowType = require('./narrow-type.js');
var FileScope = require('./scope.js').FileScope;
var FunctionScope = require('./scope.js').FunctionScope;
var BranchScope = require('./scope.js').BranchScope;
var Errors = require('./errors.js');
var JsigAst = require('../ast/');

module.exports = ProgramMeta;

function CheckerRules() {
    this.optin = false;
    this.partialExport = false;
    this.allowUnusedFunction = false;
    this.allowUnknownRequire = false;
}

function TraceInfo(type, node, expected, actual) {
    this.node = node;
    this.expected = expected;
    this.actual = actual;
    this.type = type;
    this.fileName = '';
}

function ProgramMeta(checker, ast, fileName, source) {
    this.checker = checker;
    this.ast = ast;
    this.fileName = fileName;
    this.source = source;
    this.sourceLines = source.split('\n');
    this.checkerRules = new CheckerRules();

    this.identifiers = {};
    this.operators = {};
    this.virtualTypes = {};

    this.type = 'program';

    // Esprima AST for exports
    this.moduleExportsNode = null;
    // JSig type AST for exports type
    this.moduleExportsType = null;
    // Name of variable, if applicable
    this.moduleExportsName = null;
    // Whether an module.exports statement exists
    this.hasModuleExports = false;
    // Which field names were exported
    this.exportedFields = [];

    this.globalScope = checker.globalScope;
    this.currentScope = new FileScope(this.globalScope);
    this.currentScope.loadModuleTokens();

    this.fatalError = false;

    this.headerFile = null;
    this.subType = new SubTypeChecker(this);
    this.verifier = new ASTVerifier(this, this.checker, this.fileName);
    this.inference = new TypeInference(this);
    this.narrow = new NarrowType(this);

    this.currentNode = null;
    this.currentExpressionType = null;
}

ProgramMeta.prototype.serializeType =
function serializeType(type, opts) {
    return serialize(type, opts);
};

ProgramMeta.prototype.serializeAST =
function serializeAST(ast) {
    var startLine = ast.loc.start.line;
    var endLine = ast.loc.end.line;

    if (startLine === endLine) {
        return this.sourceLines[startLine - 1].slice(
            ast.loc.start.column, ast.loc.end.column
        );
    }

    var segments = [
        this.sourceLines[startLine - 1].slice(ast.loc.start.column)
    ];

    for (var i = startLine + 1; i < endLine; i++) {
        segments.push(this.sourceLines[i - 1]);
    }

    segments.push(
        this.sourceLines[endLine - 1].slice(0, -ast.loc.end.column)
    );

    return segments.join('\n');
};

ProgramMeta.prototype.getOperator = function getOperator(id) {
    return this.globalScope.getOperator(id);
};

ProgramMeta.prototype.getVirtualType = function getVirtualType(id) {
    return this.globalScope.getVirtualType(id);
};

function parseCommentLines(commentText) {
    var lines = commentText.split('\n');
    var segments = [];
    for (var i = 0; i < lines.length; i++) {
        var chunks = lines[i].split(',');
        for (var j = 0; j < chunks.length; j++) {
            var trimmed = chunks[j].trim();
            if (trimmed !== '') {
                segments.push(trimmed);
            }
        }
    }

    return segments;
}

ProgramMeta.prototype.parseRules = function parseRules() {
    var node = this.ast;
    assert(node.type === 'Program', 'Esprima ast must be program');

    var firstComment = node.comments[0];
    var commentText = firstComment ? firstComment.value.trim() : '';

    if (commentText.length === 0) {
        return;
    }

    // If not startsWith @jsig
    if (commentText.indexOf('@jsig') !== 0) {
        return;
    }

    this.checkerRules.optin = true;
    commentText = commentText.slice(5);
    var segments = parseCommentLines(commentText);

    for (var i = 0; i < segments.length; i++) {
        var parts = segments[i].split(':');
        var key = parts[0].trim();
        var value = parts[1].trim();

        if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        }

        if (key === 'partialExport') {
            this.checkerRules.partialExport = value;
        } else if (key === 'allowUnusedFunction') {
            this.checkerRules.allowUnusedFunction = value;
        } else if (key === 'allowUnknownRequire') {
            this.checkerRules.allowUnknownRequire = value;
        } else {
            this.addError(Errors.UnrecognisedOption({
                key: key,
                loc: firstComment.loc,
                line: firstComment.loc.start.line
            }));
        }
    }
};

ProgramMeta.prototype.verify = function verify() {
    var node = this.ast;

    this.parseRules();

    var beforeErrors = this.countErrors();
    var success = this.loadHeaderFile(false);
    var afterErrors = this.countErrors();

    this.setModuleExportsNode(node);

    // If something went wrong in the header file loading phase
    // Then do not even bother to check the source code against
    // a malformed / half done header.
    if (!success || beforeErrors !== afterErrors) {
        return;
    }

    if (this.checker.optin) {
        if (this.checkerRules.optin) {
            this.verifyNode(node, null);
        }
    } else {
        this.verifyNode(node, null);
    }
};

ProgramMeta.prototype.verifyNode = function verifyNode(node, exprType) {
    if (this.fatalError) {
        return null;
    }

    assert(exprType !== undefined, 'must pass in exprType');

    var parent = this.currentNode;
    this.currentNode = node;
    var oldExprType = this.currentExpressionType;
    this.currentExpressionType = exprType;

    var type = this.verifier.verifyNode(node);

    this.currentExpressionType = oldExprType;
    this.currentNode = parent;
    return type;
};

ProgramMeta.prototype.inferType = function inferType(node) {
    if (this.fatalError) {
        return null;
    }

    var inferred = this.inference.inferType(node);

    this.addTrace(new TraceInfo(
        'meta.infer-type',
        node,
        JsigAst.literal('<InferredType>'),
        inferred || JsigAst.literal('<InferenceError>')
    ));

    return inferred;
};

ProgramMeta.prototype.narrowType =
function narrowType(node, ifBranch, elseBranch) {
    if (this.fatalError) {
        return null;
    }

    return this.narrow.narrowType(node, ifBranch, elseBranch);
};

ProgramMeta.prototype.resolveGeneric =
function resolveGeneric(funcType, node, currentExpressionType) {
    if (this.fatalError) {
        return null;
    }

    return this.inference.resolveGeneric(
        funcType, node, currentExpressionType
    );
};

ProgramMeta.prototype.setModuleExportsNode =
function setModuleExportsNode(astNode) {
    var moduleExports = null;
    for (var i = 0; i < astNode.body.length; i++) {
        if (isModuleExports(astNode.body[i])) {
            moduleExports = astNode.body[i];
        }
    }

    if (moduleExports) {
        this.moduleExportsNode = moduleExports.expression.right;
        if (this.moduleExportsNode.type === 'Identifier') {
            this.currentScope.setExportedIdentifier(
                this.moduleExportsNode.name
            );

            var prevErrors = this.getErrors();
            var exportType = this.verifyNode(this.moduleExportsNode, null);
            this.setErrors(prevErrors);

            if (exportType) {
                this.setModuleExportsType(
                    exportType, this.moduleExportsNode
                );
            }
        }
    }
};

ProgramMeta.prototype.setModuleExportsType =
function setModuleExportsType(typeDefn, astNode) {
    assert(this.moduleExportsType === null, 'cannot double export');

    this.moduleExportsName = astNode.name;
    this.moduleExportsType = typeDefn;
    this.hasModuleExports = true;
};

ProgramMeta.prototype.getModuleExportsType =
function getModuleExportsType() {
    return this.moduleExportsType;
};

ProgramMeta.prototype.hasExportDefined =
function hasExportDefined() {
    return this.moduleExportsType !== null;
};

ProgramMeta.prototype.setHasModuleExports =
function setHasModuleExports(bool) {
    this.hasModuleExports = bool;
};

ProgramMeta.prototype.hasFullyExportedType =
function hasFullyExportedType() {
    if (this.hasModuleExports) {
        return this.hasModuleExports;
    }

    if (this.exportedFields.length === 0 ||
        !this.moduleExportsType ||
        this.moduleExportsType.type !== 'object'
    ) {
        return false;
    }

    var objKeys = getFieldsFromObject(this.moduleExportsType).sort();
    var exported = this.exportedFields.sort();

    var isSame = exported.length === objKeys.length;
    for (var i = 0; i < objKeys.length; i++) {
        isSame = isSame && (objKeys[i] === exported[i]);
    }

    return isSame;
};

function getFieldsFromObject(objType) {
    var keys = [];

    for (var i = 0; i < objType.keyValues.length; i++) {
        keys.push(objType.keyValues[i].key);
    }

    return keys;
}

ProgramMeta.prototype.addExportedField =
function addExportedField(fieldName) {
    if (this.exportedFields.indexOf(fieldName) === -1) {
        this.exportedFields.push(fieldName);
    }
};

ProgramMeta.prototype.getExportedFields =
function getExportedFields() {
    return this.exportedFields;
};

ProgramMeta.prototype.addTrace = function addTrace(trace) {
    trace.fileName = this.fileName;
    this.checker.addTrace(trace);
};

ProgramMeta.prototype.addError = function addError(error) {
    /* silence untyped-function-found if opted in */
    if (this.checkerRules.allowUnusedFunction &&
        error.type === 'jsig.verify.untyped-function-found'
    ) {
        return;
    }

    error.fileName = this.fileName;
    // console.trace('addError(' + error.type + ')');
    this.checker.addError(error);
};

ProgramMeta.prototype.countErrors = function countErrors() {
    return this.checker.countErrors();
};

ProgramMeta.prototype.getErrors =
function getErrors() {
    return this.checker.getErrors();
};
ProgramMeta.prototype.setErrors =
function setErrors(list) {
    this.checker.setErrors(list);
};

ProgramMeta.prototype.checkSubType =
function checkSubType(node, leftType, rightType) {
    var err = this.checkSubTypeRaw(node, leftType, rightType);
    if (err) {
        this.addError(err);
        return false;
    }
    return true;
};

ProgramMeta.prototype.checkSubTypeRaw =
function checkSubTypeRaw(node, leftType, rightType) {
    this.addTrace(new TraceInfo(
        'meta.check-sub-type', node, leftType, rightType
    ));

    return this.subType.checkSubType(node, leftType, rightType);
};

ProgramMeta.prototype.isSubType =
function isSubType(node, leftType, rightType) {
    var e = this.checkSubTypeRaw(node, leftType, rightType);
    return !e;
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile(required) {
    var extName = path.extname(this.fileName);
    var extIndex = this.fileName.lastIndexOf(extName);

    var headerFileName = this.fileName.slice(0, extIndex) + '.hjs';

    this.headerFile = this.checker.getOrCreateHeaderFile(
        headerFileName, required
    );
    if (!this.headerFile) {
        return false;
    }

    var assignments = this.headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var expr = assignments[i];

        this.currentScope.preloadVar(expr.identifier, expr.typeExpression);
    }

    var exportType = this.headerFile.getExportType();
    if (exportType !== null) {
        this.moduleExportsType = exportType;
    }

    return true;
};

ProgramMeta.prototype.allocateBranchScope =
function allocateBranchScope() {
    return new BranchScope(this.currentScope);
};

ProgramMeta.prototype.enterBranchScope =
function enterBranchScope(scope) {
    assert(scope, 'must have a scope to enter');

    this.currentScope = scope;
};

ProgramMeta.prototype.exitBranchScope =
function exitBranchScope() {
    this.currentScope = this.currentScope.parent;
};

function getFunctionName(node) {
    if (node.id) {
        return node.id.name;
    }

    return '(anonymous @ ' + node.loc.start.line +
        ' : ' + node.loc.start.column;
}

ProgramMeta.prototype.enterFunctionScope =
function enterFunctionScope(funcNode, typeDefn) {
    var funcScope = new FunctionScope(
        this.currentScope, getFunctionName(funcNode), funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.enterFunctionOverloadScope =
function enterFunctionOverloadScope(funcNode, typeDefn) {
    var funcScope = new FunctionScope(
        this.currentScope, getFunctionName(funcNode), funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionOverloadScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.exitFunctionScope =
function exitFunctionScope() {
    this.currentScope = this.currentScope.parent;
};

/* As part of inference we believe that the function named
    "name" which is untyped has a type of `newType`.

*/
ProgramMeta.prototype.tryUpdateFunction =
function tryUpdateFunction(name, newType) {
    var t = this.currentScope.getFunction(name);
    this.currentScope.updateFunction(name, newType);

    // Snap into scope of function decl
    var oldScope = this.currentScope;
    this.currentScope = t.currentScope;

    var beforeErrors = this.countErrors();

    this.verifyNode(t.node, null);
    this.currentScope = oldScope;

    var afterErrors = this.countErrors();
    if (beforeErrors !== afterErrors) {
        var info = this.currentScope.getKnownFunctionInfo(name);

        assert(info.funcScopes.length === 1,
            'expected only one function info obj');

        // verifyNode() failed
        t.currentScope.revertFunctionScope(name);
        this.currentScope.revertFunction(name, t);
        return false;
    }

    return true;
};
