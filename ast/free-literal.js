'use strict';

module.exports = FreeLiteralNode;

function FreeLiteralNode(name) {
    this.type = 'freeLiteral';
    this.name = name;
    this._raw = null;
}
