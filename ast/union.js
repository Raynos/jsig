'use strict';

/* @jsig */

var assert = require('assert');

module.exports = UnionTypeNode;

function UnionTypeNode(unions, label, opts) {
    assert(!label, 'cannot have label on union');
    assert(!(opts && opts.optional), 'cannot have optional on union');

    assert(unions.length > 0, 'cannot allocate empty union');

    this.type = 'unionType';
    this.unions = unions;
    this._raw = null;
}
