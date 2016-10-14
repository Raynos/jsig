'use strict';

var assert = require('assert');

module.exports = TupleNode;

function TupleNode(values, label, opts) {
    assert(!label, 'cannot have label on tuple');
    assert(!(opts && opts.optional), 'cannot have optional on tuple');

    this.type = 'tuple';
    this.values = values;
    this.inferred = (opts && 'inferred' in opts) ?
        opts.inferred : false;
    this._raw = null;
}
