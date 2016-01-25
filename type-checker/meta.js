'use strict';

/*eslint no-console: 0*/
var console = require('console');

var isModuleExports = require('./lib/is-module-exports.js');
var verifiers = require('./verifiers.js');
var JsigAST = require('../ast.js');
var readJSigAST = require('./lib/read-jsig-ast.js');

var fileExtRegex = /.js$/;
var requireType = JsigAST.functionType({
    args: [JsigAST.literal('String')],
    result: JsigAST.literal('Any')
});
requireType.isNodeRequireToken = true;

var moduleType = JsigAST.object({
    exports: JsigAST.literal('Any')
});
moduleType.isNodeModuleToken = true;

module.exports = ProgramMeta;

function ProgramMeta(ast, fileName) {
    this.ast = ast;
    this.fileName = fileName;

    this.identifiers = {};
    this.type = 'program';

    this.moduleExportsNode = null;
    this.moduleExportsType = null;

    this.currentScope = new FileMeta(this);
    this.currentScope.addVar('require', requireType);
    this.currentScope.addVar('module', moduleType);

    this.errors = [];
    this.fatalError = false;
}

ProgramMeta.prototype.getVar = function getVar(id) {
    return this.identifiers[id];
};

ProgramMeta.prototype.verify = function verify() {
    var node = this.ast;

    this.verifyNode(node);
};

ProgramMeta.prototype.verifyNode = function verifyNode(node) {
    if (this.fatalError) {
        return;
    }

    var verifyFn = verifiers[node.type];
    if (verifyFn) {
        verifyFn(node, this);
    } else {
        console.warn('skipping verifyNode', node.type);
    }
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
    }
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile() {
    var headerFileName = this.fileName.replace(fileExtRegex, '.hjs');

    var res = readJSigAST(headerFileName);
    if (res.error) {
        this.errors.push(res.error);
        this.fatalError = true;
        return;
    }
};

function FileMeta(parent) {
    this.parent = parent;

    this.identifiers = Object.create(null);
    this.type = 'file';
}

FileMeta.prototype.addVar =
function addVar(id, typeDefn) {
    this.identifiers[id] = {
        type: 'variable',
        defn: typeDefn
    };
};

FileMeta.prototype.getVar = function getVar(id) {
    return this.identifiers[id] || this.parent.getVar(id);
};
