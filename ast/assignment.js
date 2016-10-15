'use strict';

/* @jsig */

module.exports = AssignmentNode;

function AssignmentNode(id, expr) {
    this.type = 'assignment';
    this.identifier = id;
    this.typeExpression = expr;
    this._raw = null;
}
