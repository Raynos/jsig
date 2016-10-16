'use strict';

/* @jsig */

var assert = require('assert');

module.exports = IntersectionTypeNode;

function IntersectionTypeNode(intersections, label, opts) {
    assert(!label, 'cannot have label on intersection');
    assert(!(opts && opts.optional), 'cannot have optional on intersection');

    this.type = 'intersectionType';
    this.intersections = intersections;
    this._raw = null;
}

IntersectionTypeNode.prototype.buildObjectIndex =
function buildObjectIndex(index) {
    index = index || {};

    /* jsig ignore next: cannot yet narrow by string field check */
    for (var i = 0; i < this.intersections.length; i++) {
        var maybeObj = this.intersections[i];
        if (maybeObj.type !== 'object') {
            continue;
        }

        maybeObj.buildObjectIndex(index);
    }

    return index;
};
