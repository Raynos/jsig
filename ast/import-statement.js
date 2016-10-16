'use strict';

/* @jsig */

var ASTConfig = require('./_ast-config.js');

module.exports = ImportStatementNode;

function ImportStatementNode(dependency, types, opts) {
    this.type = 'import';
    this.dependency = dependency;
    this.types = types;
    this.line = (ASTConfig.loc && opts && opts.line) || null;
    this.loc = (ASTConfig.loc && opts && opts.loc) || null;
    this.isMacro = (opts && opts.isMacro) || false;
    this._raw = null;
}
