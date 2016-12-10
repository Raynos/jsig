'use strict';

var Parsimmon = require('parsimmon');

var AST = require('../ast/');

var commentStart = Parsimmon.string('--');
var altCommentStart = Parsimmon.string('//');
var nonNewLine = Parsimmon.regex(/[^\n]/);
var blockCommentStart = Parsimmon.string('/*');
var nonBlockCommentEnd = Parsimmon.regex(/(\*(?!\/)|[^*])/);
var blockCommentEnd = Parsimmon.string('*/');

var commentStatement = commentStart
    .then(nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('--' + text.join(''));
    });

var altCommentStatement = altCommentStart
    .then(nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('//' + text.join(''));
    });

var blockCommentStatement = blockCommentStart
    .then(nonBlockCommentEnd.many())
    .skip(blockCommentEnd)
    .map(function comment(text) {
        return AST.comment('/*' + text.join('') + '*/');
    });

// var rawComments = Parsimmon.alt(
//     commentStart.skip(nonNewLine.many()),

//     altCommentStart.skip(nonNewLine.many()),

//     blockCommentStart
//         .skip(nonBlockCommentEnd.many())
//         .skip(blockCommentEnd)
// );

// var whitespaceWithComment = Parsimmon.seq(
//     Parsimmon.optWhitespace.atMost(1),

//     rawComments.atMost(1),

//     Parsimmon.optWhitespace.atMost(1)
// );

// var commentLine = Parsimmon.regex(/\/\/[^\n]*/);
// var altCommentLine = Parsimmon.regex(/\-\-[^\n]*/);
// var multilineComment = Parsimmon.custom(function multi(success, failure) {
//     return function parse(stream, i) {
//         if (stream.slice(i, i + 2) === '/*') {
//             for (var j = i + 2; j + 2 <= stream.length; j++) {
//                 if (stream.slice(j, j + 2) === '*/') {
//                     return success(j + 2, 'multi-line comment');
//                 }
//             }

//             return failure(i, '"*/"');
//         } else {
//             return failure(i, '"*/"');
//         }
//     }
// });

// var commentExpression = commentLine
//     .or(altCommentLine)
//     .or(multilineComment)
//     .desc('comment');

module.exports = {
    commentStatement: commentStatement,
    altCommentStatement: altCommentStatement,
    blockCommentStatement: blockCommentStatement

    // rawComments: rawComments,
    // whitespaceWithComment: whitespaceWithComment
};
