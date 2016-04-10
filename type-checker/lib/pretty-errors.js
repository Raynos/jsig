'use strict';

var process = global.process;
var assert = require('assert');
var path = require('path');
var TermColor = require('term-color');

var STRAIGHT_LINE = '-----------------------------------------' +
    '------------------------';

module.exports = prettyPrintAllErrors;

function prettyPrintAllErrors(checker) {
    var parts = [];
    parts.push('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];

        assert(error.fileName, 'error must have fileName');
        var relativePath = path.relative(process.cwd(), error.fileName);

        parts.push(TermColor.underline(relativePath));

        parts.push(prettyPrintError(checker, error, {
            prefix: ''
        }));
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    parts.push(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    parts.push('');

    return parts.join('\n');
}

function prettyPrintError(checker, error, opts) {
    var parts = [];

    parts.push(opts.prefix + 'Found error: ' + TermColor.cyan(error.type));
    parts.push(opts.prefix + error.message);
    parts.push('');

    if (opts.showLoc !== false && error.loc) {
        var failingLines = getFailingLines(checker, error);

        parts.push(opts.prefix + failingLines);
        parts.push('');
    }

    if (error.expected && error.actual) {
        parts.push(opts.prefix +
            'Expected : ' + TermColor.green(error.expected));
        parts.push(opts.prefix +
            'Actual   : ' + TermColor.red(error.actual));
        parts.push('');
    }

    if (Array.isArray(error.originalErrors)) {
        var nestedPrefix = opts.prefix + '    ';
        parts.push(nestedPrefix + STRAIGHT_LINE);
        parts.push(nestedPrefix + 'Error caused by: ');
        parts.push('');

        for (var j = 0; j < error.originalErrors.length; j++) {
            parts.push(prettyPrintError(checker, error.originalErrors[j], {
                prefix: nestedPrefix,
                showLoc: false
            }));
            parts.push('');
        }
    }

    return parts.join('\n');
}

function getFailingLines(checker, err) {
    assert(err.loc, 'need loc on error');
    assert(err.fileName, 'need fileName on error');

    var meta = checker.getOrCreateMeta(err.fileName);
    var startLine = err.loc.start.line - 1;
    var endLine = err.loc.end.line - 1;

    var prevLine = meta.sourceLines[startLine - 1] || '';
    var nextLine = meta.sourceLines[endLine + 1] || '';

    var segments = [
        String(startLine - 1) + '. ' + TermColor.gray(prevLine)
    ];

    var failLine;
    var startColumn;
    var endColumn;
    if (startLine === endLine) {
        failLine = meta.sourceLines[startLine];
        startColumn = err.loc.start.column;
        endColumn = err.loc.end.column;

        segments.push(
            String(startLine) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    } else {
        failLine = meta.sourceLines[startLine];
        startColumn = err.loc.start.column;
        endColumn = err.loc.end.column;

        segments.push(
            String(startLine) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, failLine.length))
        );

        for (var i = startLine + 1; i < endLine; i++) {
            segments.push(
                String(i) + '. ' + TermColor.red(meta.sourceLines[i])
            );
        }

        failLine = meta.sourceLines[endLine];

        segments.push(
            String(endLine) + '. ' +
            TermColor.red(failLine.slice(0, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    }

    segments.push(
        String(endLine + 1) + '. ' + TermColor.gray(nextLine)
    );

    return segments.join('\n');
}
