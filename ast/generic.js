'use strict';

module.exports = GenericLiteralNode;

function GenericLiteralNode(value, generics, label) {
    this.type = 'genericLiteral';
    this.value = value;
    this.generics = generics;
    this.label = label || null;
    this.optional = false;
    this._raw = null;
}
