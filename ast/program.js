'use strict';

module.exports = ProgramNode;

function ProgramNode(statements) {
    this.type = 'program';
    this.statements = statements;
    this._raw = null;
}
