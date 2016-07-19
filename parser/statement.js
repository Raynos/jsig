'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var typeDefinition = require('./type-definition.js');
var typeLiteral = require('./type-literal.js');
var typeDeclaration = require('./type-declaration.js');
var join = require('./lib/join.js');

var renamedLiteral = typeLiteral
    .chain(function captureOriginal(original) {
        return lexemes.asWord
            .then(typeLiteral)
            .map(function toRenamedLiteral(literal) {
                return AST.renamedLiteral(literal, original);
            });
    });

var importStatement = Parsimmon.seqMap(

    lexemes.importWord
        .then(Parsimmon.index),

    lexemes.macroWord
        .atMost(1),

    lexemes.openCurlyBrace
        .then(join(Parsimmon.alt(
            renamedLiteral,
            typeLiteral
        ), lexemes.comma)),

    lexemes.closeCurlyBrace
        .then(lexemes.fromWord)
        .then(Parsimmon.index),

    lexemes.quote
        .then(lexemes.moduleName)
        .skip(lexemes.quote),

    function onParts(
        startIndex, macroWord, importLiterals, endIndex, identifier
    ) {
        var isMacro = macroWord.length === 1;

        var loc = {
            start: {
                column: 0,
                line: startIndex.line
            },
            end: {
                line: endIndex.line,
                column: Number.MAX_VALUE
            }
        };

        return AST.importStatement(
            identifier, importLiterals, {
                loc: loc,
                isMacro: isMacro,
                line: startIndex.line
            }
        );
    }
);

var assignment = lexemes.assignmentIdentifier
    .chain(function captureIdentifier(identifier) {
        identifier = identifier.replace(/\\\-/g, '-');

        return lexemes.labelSeperator
            .then(typeDefinition)
            .map(function toAssignment(type) {
                return AST.assignment(identifier, type);
            });
    });

var exportStatement = lexemes.exportWord
    .then(lexemes.defaultWord)
    .then(typeDefinition)
    .map(function toDefaultExport(type) {
        return AST.defaultExport(type);
    });

var commentStatement = lexemes.commentStart
    .then(lexemes.nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('--' + text.join(''));
    });

var altCommentStatement = lexemes.altCommentStart
    .then(lexemes.nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('//' + text.join(''));
    });

var blockCommentStatement = lexemes.blockCommentStart
    .then(lexemes.nonBlockCommentEnd.many())
    .skip(lexemes.blockCommentEnd)
    .map(function comment(text) {
        return AST.comment('/*' + text.join('') + '*/');
    });

var statement = Parsimmon.alt(
    commentStatement,
    altCommentStatement,
    blockCommentStatement,
    importStatement,
    assignment,
    typeDeclaration,
    exportStatement
);

module.exports = statement;
