'use strict';

var Parsimmon = require('parsimmon');

var RAW_TYPE_NAME = Parsimmon.regex(/[a-z%]+/i);

var lexemes = {
    importWord: lexeme(Parsimmon.string('import')),
    macroWord: lexeme(Parsimmon.string('macro')),
    rowTypeVariable: lexeme(Parsimmon.string('..R')),
    openCurlyBrace: lexeme(Parsimmon.string('{')),
    closeCurlyBrace: lexeme(Parsimmon.string('}')),
    fromWord: lexeme(Parsimmon.string('from')),
    exportWord: lexeme(Parsimmon.string('export')),
    defaultWord: lexeme(Parsimmon.string('default')),
    quote: lexeme(Parsimmon.regex(/['"]/)),
    identifier: lexeme(Parsimmon.regex(/[a-z\-\/]+/i)),
    assignmentIdentifier: lexeme(
        Parsimmon.regex(/[a-z0-9+*/%<=>!\|\-\/\\\~\&\^]+/i)
    ),
    moduleName: lexeme(Parsimmon.regex(/[a-z0-9_\-\/\.]+/i)),
    labelName: lexeme(Parsimmon.regex(/[a-z0-9_\?]+/i)),
    rawTypeName: RAW_TYPE_NAME,
    typeName: lexeme(RAW_TYPE_NAME),
    labelSeperator: lexeme(Parsimmon.string(':')),
    comma: lexeme(Parsimmon.string(',')),
    openAngularBrace: lexeme(Parsimmon.string('<')),
    closeAngularBrace: lexeme(Parsimmon.string('>')),
    typeWord: lexeme(Parsimmon.string('type')),
    interfaceWord: lexeme(Parsimmon.string('interface')),
    unionSeperator: lexeme(Parsimmon.string('|')),
    intersectionSeperator: lexeme(Parsimmon.string('&')),
    openRoundBrace: lexeme(Parsimmon.string('(')),
    closeRoundBrace: lexeme(Parsimmon.string(')')),
    arrow: lexeme(Parsimmon.string('=>')),
    openSquareBrace: lexeme(Parsimmon.string('[')),
    closeSquareBrace: lexeme(Parsimmon.string(']')),
    notAQuote: lexeme(Parsimmon.regex(/[^\"\']+/i)),
    number: lexeme(Parsimmon.regex(/\-?[0-9]+/i)),
    nullWord: lexeme(Parsimmon.string('null')),
    undefinedWord: lexeme(Parsimmon.string('undefined')),
    asWord: lexeme(Parsimmon.string('as')),
    openBrace: lexeme(Parsimmon.string('(')),
    closeBrace: lexeme(Parsimmon.string(')')),
    commentStart: Parsimmon.string('--'),
    altCommentStart: Parsimmon.string('//'),
    nonNewLine: Parsimmon.regex(/[^\n]/),
    blockCommentStart: Parsimmon.string('/*'),
    nonBlockCommentEnd: Parsimmon.regex(/(\*(?!\/)|[^*])/),
    blockCommentEnd: Parsimmon.string('*/')
};

module.exports = lexemes;

function lexeme(p) {
    return p.skip(Parsimmon.optWhitespace);
}
