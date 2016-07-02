'use strict';

module.exports = DB;

function DB() {
    this._values = Object.create(null);
}

DB.prototype.get = get;
function get(key, $default) {
    var value = this._values[key];
    if (!value) {
        value = $default;
    }
    return value;
}

DB.prototype.set = set;
function set(key, value) {
    this._values[key] = value;
}

DB.prototype.keys = keys;
function keys() {
    return Object.keys(this._values);
}
