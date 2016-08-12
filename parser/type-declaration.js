'use strict';

var Parsimmon = require('parsimmon');
var assert = require('assert');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var typeDefinition = require('./type-definition.js');
var typeFunction = require('./type-function.js');
var typeLiteral = require('./type-literal.js');
var typeKeyValue = require('./type-key-value.js');
var join = require('./lib/join.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(
        typeLiteral,
        lexemes.comma
    ))
    .skip(lexemes.closeAngularBrace);

var rawTypeDeclaration = lexemes.typeWord
    .then(Parsimmon.seq(
        lexemes.identifier,
        genericExpression.times(0, 1)
    ))
    .chain(function captureIdentifiers(list) {
        var identifier = list[0];
        var generics = list[1][0] || [];

        return lexemes.labelSeperator
            .then(typeDefinition)
            .map(function toTypeDeclaration(type) {
                return AST.typeDeclaration(identifier, type,
                    generics);
            });
    });

var methodKeyValue = Parsimmon.seq(
    lexemes.labelName,
    typeFunction
).map(function createType(list) {
    var name = list[0];
    var type = list[1];

    assert(!type.thisArg, 'cannot have thisArg in method');

    var pair = AST.keyValue(name, type);
    pair.isMethod = true;
    return pair;
});

var typeKeyValues = join(Parsimmon.alt(
    typeKeyValue, methodKeyValue
), lexemes.comma);

var interfaceDeclaration = lexemes.interfaceWord
    .then(lexemes.identifier)
    .chain(function captureIdentifier(id) {
        return lexemes.openCurlyBrace
            .then(typeKeyValues)
            .skip(lexemes.closeCurlyBrace)
            .map(function capturePairs(pairs) {
                for (var i = 0; i < pairs.length; i++) {
                    var p = pairs[i];
                    if (!p.isMethod) {
                        continue;
                    }

                    var v = p.value;
                    assert(v.type === 'function', 'method must be function');
                    assert(!v.thisArg, 'method cannot have thisArg');

                    v.thisArg = AST.param('this', AST.literal(id));
                }

                var obj = AST.object(pairs);

                return AST.typeDeclaration(id, obj, []);
            });
    });

module.exports = Parsimmon.alt(
    rawTypeDeclaration,
    interfaceDeclaration
);
