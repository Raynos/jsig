'use strict';

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');
var typeLiteral = require('./type-literal.js');
var typeDefinition = require('./type-definition.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(typeLiteral, lexemes.comma))
    .skip(lexemes.closeAngularBrace);

var paramName = lexemes.labelName
    .skip(lexemes.labelSeperator)
    .atMost(1);

var typeParam = paramName
    .chain(function captureOptional(maybeName) {
        var name = maybeName[0] || null;
        var optional = false;
        if (name) {
            optional = name[name.length - 1] === '?';
            if (optional) {
                name = name.substr(0, name.length - 1);
            }
        }

        return typeDefinition
            .map(function toParam(value) {
                return AST.param(name, value, {
                    optional: optional
                });
            });
    });

var typeParams = join(typeParam, lexemes.comma);

var typeFunction = genericExpression.times(0, 1)
    .chain(function captureGeneric(list) {
        var generics = list[0] || null;
        if (generics) {
            for (var i = 0; i < generics.length; i++) {
                generics[i] = generics[i].name;
            }
        }

        return lexemes.openRoundBrace
            .then(typeParams)
            .chain(function captureArgs(args) {
                var thisArg = null;
                if (args[0] && args[0].name === 'this') {
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
