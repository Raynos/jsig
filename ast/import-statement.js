'use strict';

module.exports = ImportStatementNode;

function ImportStatementNode(dependency, types, opts) {
    this.type = 'import';
    this.dependency = dependency;
    this.types = types;
    this.line = opts && opts.line;
    this.loc = opts && opts.loc;
    this._raw = null;
}
