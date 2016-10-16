'use strict';

/* @jsig */

module.exports = LocationLiteralNode;

function LocationLiteralNode(name, location) {
    this.type = 'locationLiteral';
    this.name = name;
    this.location = location;
    this._raw = null;
}
