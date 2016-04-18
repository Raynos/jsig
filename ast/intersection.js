'use strict';

module.exports = IntersectionTypeNode;

function IntersectionTypeNode(intersections, label, opts) {
    this.type = 'intersectionType';
    this.intersections = intersections;
    this.label = label || null;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}
