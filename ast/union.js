'use strict';

var assert = require('assert');

module.exports = UnionTypeNode;

function UnionTypeNode(unions, label, opts) {
    assert(!label, 'cannot have label on union');
    assert(!(opts && opts.optional), 'cannot have optional on union');

    this.type = 'unionType';
    this.unions = unions;
    this._raw = null;
}
