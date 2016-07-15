'use strict';

var assert = require('assert');

module.exports = IntersectionTypeNode;

function IntersectionTypeNode(intersections, label, opts) {
    assert(!label, 'cannot have label on intersection');
    assert(!(opts && opts.optional), 'cannot have optional on intersection');

    this.type = 'intersectionType';
    this.intersections = intersections;
    this._raw = null;
}
