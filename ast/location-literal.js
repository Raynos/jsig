'use strict';

/* @jsig */

var assert = require('assert');

module.exports = LocationLiteralNode;

function LocationLiteralNode(name, location) {
    assert(location.length > 0, 'location must contain values');

    this.type = 'locationLiteral';
    this.name = name;
    this.location = location;
    this._raw = null;
}
