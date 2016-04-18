'use strict';

module.exports = TupleNode;

function TupleNode(values, label, opts) {
    this.type = 'tuple';
    this.values = values;
    this.label = label || null;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}
