'use strict';

/* @jsig */

var assert = require('assert');

var ASTConfig = require('./_ast-config.js');
var builtinTypes = require('../parser/builtin-types.js');

var KNOWN_BUILTINS = builtinTypes.slice().concat([
    '%Object%%Empty',
    '%Void%%Uninitialized',
    '%Void%%UnknownReturn',
    '%Null%%Default',
    '%Require%%RequireFunction',
    '%Export%%ModuleExports',
    '%Export%%ExportsObject',
    '%Mixed%%UnknownRequire',
    '%Mixed%%UnknownExports',
    '%Mixed%%AllowedUnusedfunction',
    '%Mixed%%UnknownExportsField',
    '%Mixed%%OpenField',
    '%Mixed%%MethodInferrenceField',
    '%Macro%%Placeholder'
]);

module.exports = LiteralTypeNode;

function LiteralTypeNode(name, builtin, opts) {
    assert(!(opts && opts.label), 'cannot have label on literal');
    assert(!(opts && opts.optional), 'cannot have optional on literal');

    builtin = builtin !== undefined ? builtin :
        builtinTypes.indexOf(name) !== -1;

    if (builtin) {
        assert(KNOWN_BUILTINS.indexOf(name) > -1,
            'unknown builtin LiteralTypeNode : ' + name);
    }

    this.type = 'typeLiteral';
    this.name = name;
    this.builtin = builtin;
    this.line = (ASTConfig.loc && opts && opts.line) || null;
    this.loc = (ASTConfig.loc && opts && opts.loc) || null;

    // TODO: gaurd against re-assignment...
    this.concreteValue = (opts && 'concreteValue' in opts) ?
        opts.concreteValue : null;

    this.isGeneric = false;
    this.genericIdentifierUUID = null;
    this._raw = null;
}
