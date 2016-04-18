'use strict';

var LiteralTypeNode = require('./literal.js');

module.exports = RenamedLiteralNode;

function RenamedLiteralNode(token, original, opts) {
    if (typeof token === 'string') {
        token = new LiteralTypeNode(token, false, opts);
    }
    if (typeof original === 'string') {
        original = new LiteralTypeNode(original);
    }

    this.type = 'renamedLiteral';
    this.name = token.name;
    this.builtin = token.builtin;
    this.optional = token.optional;
    this.label = token.label;
    this.original = original;
    this._raw = null;
}
