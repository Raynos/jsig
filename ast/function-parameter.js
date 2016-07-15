'use strict';

module.exports = FunctionParameterNode;

function FunctionParameterNode(name, value, opts) {
    this.type = 'param';
    this.name = name;
    this.value = value;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}
