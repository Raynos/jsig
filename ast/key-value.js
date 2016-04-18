'use strict';

module.exports = KeyValueNode;

function KeyValueNode(key, value, opts) {
    this.type = 'keyValue';
    this.key = key;
    this.value = value;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}
