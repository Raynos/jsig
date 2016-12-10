'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var innerTypes = Parsimmon.lazy(lazyAlt);

var unionType = Parsimmon.alt(
    join(innerTypes, lexemes.unionSeperator, 1)
        .map(function unpackUnions(unions) {
            if (unions.length === 1) {
                return unions[0];
            }

            return AST.union(unions);
        }),
    innerTypes
);

var intersectionType = Parsimmon.alt(
    join(unionType, lexemes.intersectionSeperator, 1)
        .map(function unpackIntersections(intersections) {
            if (intersections.length === 1) {
                return intersections[0];
            }

            return AST.intersection(intersections);
        }),
    unionType
);

var typeDefinition = intersectionType;

var typeDefinitionWithParen = Parsimmon.alt(
    typeDefinition,
    lexemes.openBrace
        .then(typeDefinition)
        .skip(lexemes.closeBrace)
);

module.exports = typeDefinitionWithParen;

var typeExpression = require('./type-expression.js');
var typeFunction = require('./type-function.js');
var typeObject = require('./type-object.js');
var typeTuple = require('./type-tuple.js');

function lazyAlt() {
    var baseExpression = Parsimmon.alt(
        typeExpression,
        typeFunction,
        typeObject,
        typeTuple
    ).skip(lexemes.optWhitespace);

    return Parsimmon.alt(
        baseExpression,
        lexemes.openBrace
            .then(baseExpression)
            .skip(lexemes.closeBrace)
    );
}
