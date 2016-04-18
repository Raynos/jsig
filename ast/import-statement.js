'use strict';

module.exports = ImportStatementNode;

function ImportStatementNode(dependency, types) {
    this.type = 'import';
    this.dependency = dependency;
    this.types = types;
    this._raw = null;
}
