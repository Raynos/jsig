'use strict';

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');
var typeLiteral = require('./type-literal.js');
var typeDefinition = require('./type-definition.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(typeLiteral, lexemes.comma))
    .skip(lexemes.closeAngularBrace);

var typeFunction = genericExpression.times(0, 1)
    .chain(function captureGeneric(list) {
        var generics = list[0] || null;
        if (generics) {
            for (var i = 0; i < generics.length; i++) {
                generics[i] = generics[i].name;
            }
        }

        return lexemes.openRoundBrace
             .then(join(typeDefinition, lexemes.comma))
            .chain(function captureArgs(args) {
                var thisArg = null;
                if (args[0] && args[0].label === 'this') {
                    thisArg = args.shift();
                }

                return lexemes.closeRoundBrace
                    .then(lexemes.arrow)
                    .then(typeDefinition)
                    .map(function toFunctionType(def) {
                        return AST.functionType({
                            args: args,
                            thisArg: thisArg,
                            result: def,
                            generics: generics
                        });
                    });
            });
    });

module.exports = typeFunction;
