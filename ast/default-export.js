'use strict';

module.exports = DefaultExportNode;

function DefaultExportNode(expr) {
    this.type ='defaultExport';
    this.typeExpression = expr;
    this._raw = null;
}
