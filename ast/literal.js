'use strict';

var ASTConfig = require('./_ast-config.js');
var builtinTypes = require('../parser/builtin-types.js');

module.exports = LiteralTypeNode;

function LiteralTypeNode(name, builtin, opts) {
    builtin = builtin !== undefined ? builtin :
        builtinTypes.indexOf(name) !== -1;

    this.type = 'typeLiteral';
    this.name = name;
    this.builtin = builtin;
    this.line = (ASTConfig.loc && opts && opts.line) || null;
    this.loc = (ASTConfig.loc && opts && opts.loc) || null;
    this.label = (opts && opts.label) || null;
    this.optional = (opts && opts.optional) || false;

    // TODO: gaurd against re-assignment...
    this.concreteValue = (opts && typeof opts.concreteValue === 'string') ?
        ('"' + opts.concreteValue + '"') : null;

    this.isGeneric = false;
    this._raw = null;
}
