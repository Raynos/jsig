'use strict';

module.exports = UnionTypeNode;

function UnionTypeNode(unions, label, opts) {
    this.type = 'unionType';
    this.unions = unions;
    this.label = label || null;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}
