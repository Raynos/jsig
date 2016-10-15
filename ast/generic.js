'use strict';

/* @jsig */

var assert = require('assert');

module.exports = GenericLiteralNode;

function GenericLiteralNode(value, generics, label) {
    assert(!label, 'cannot have label on generic');

    this.type = 'genericLiteral';
    this.value = value;
    this.generics = generics;
    this._raw = null;
}
