'use strict';

module.exports = ValueLiteralNode;

function ValueLiteralNode(value, name, label) {
    name = name ? name :
        value === 'null' ? 'null' :
        value === 'undefined' ? 'undefined' :
        /*istanbul ignore next*/ 'unknown';

    this.type = 'valueLiteral';
    this.value = value;
    this.name = name;
    this.label = label || null;
    this.optional = false;
    this._raw = null;
}
