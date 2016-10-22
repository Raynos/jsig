'use strict';

/* @jsig */

var assert = require('assert');

module.exports = ValueLiteralNode;

function ValueLiteralNode(value, name, label) {
    assert(!label, 'cannot have label on valueLiteral');

    name = name ? name :
        value === 'null' ? 'null' :
        value === 'undefined' ? 'undefined' :
        /*istanbul ignore next*/ 'unknown';

    this.type = 'valueLiteral';
    this.value = value;
    this.name = name;
    this._raw = null;
}
