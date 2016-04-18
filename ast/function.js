'use strict';

module.exports = FunctionNode;

function FunctionNode(opts) {
    this.type = 'function';
    this.args = opts.args || [];
    this.result = opts.result;
    this.thisArg = opts.thisArg || null;
    this.label = opts.label || null;
    this.optional = opts.optional || false;
    this.brand = opts.brand || 'Object';
    this._raw = null;

    this.generics = opts.generics || [];
}
