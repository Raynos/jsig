'use strict';

var process = global.process;
var assert = require('assert');
var path = require('path');
var TermColor = require('term-color');

var serializeType = require('../../serialize.js');

var STRAIGHT_LINE = '-----------------------------------------' +
    '------------------------';

module.exports = {
    prettyPrintAllErrors: prettyPrintAllErrors,
    prettyPrintTraces: prettyPrintTraces
};

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
        var sourceLines;
        if (error.source) {
            sourceLines = error.source.split('\n');
        } else {
            var meta = checker.getOrCreateMeta(error.fileName);
            sourceLines = meta.sourceLines;
        }

        var failingLines = getFailingLines(sourceLines, error.loc);

        parts.push(opts.prefix + failingLines);
        parts.push('');
    } else if (opts.showLoc !== false &&
        (
            error.type === 'jsig.checker.could-not-parse-javascript' ||
            error.type === 'jsig.parser.cannot-parse-header-file'
        )
    ) {
        sourceLines = error.source.split('\n');
        var loc = {
            start: {
                column: 0,
                line: error.line
            },
            end: {
                line: error.line,
                column: sourceLines[error.line].length
            }
        };
        failingLines = getFailingLines(sourceLines, loc);

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
            var e = error.originalErrors[j];
            parts.push(
                nestedPrefix + 'Branch: ' + TermColor.green(e.branchType)
            );
            parts.push(prettyPrintError(checker, e, {
                prefix: nestedPrefix,
                showLoc: false
            }));
            parts.push('');
        }
    }

    return parts.join('\n');
}

function prettyPrintTraces(checker) {
    var traces = checker.traces;
    var parts = [];
    parts.push('');

    for (var i = 0; i < traces.length; i++) {
        var trace = traces[i];

        assert(trace.fileName, 'trace must have fileName');
        var relativePath = path.relative(process.cwd(), trace.fileName);

        parts.push(TermColor.underline(relativePath));
        parts.push(prettyPrintTrace(checker, trace));
    }

    return parts.join('\n');
}

function prettyPrintTrace(checker, trace) {
    var parts = [];

    parts.push('TRACE: ' + TermColor.cyan(trace.type));

    if (trace.node.loc) {
        var meta = checker.getOrCreateMeta(trace.fileName);
        var failingLines = getFailingLines(meta.sourceLines, trace.node.loc);

        parts.push(failingLines);
        parts.push('');
    }

    var expected = serializeType(trace.expected);
    var actual = serializeType(trace.actual);

    parts.push('Expected : ' + TermColor.green(expected));
    parts.push('Actual : ' + TermColor.red(actual));
    parts.push('');

    return parts.join('\n');
}

function getFailingLines(sourceLines, loc) {
    var startLine = loc.start.line - 1;
    var endLine = loc.end.line - 1;

    var prevLine = sourceLines[startLine - 1] || '';
    var nextLine = sourceLines[endLine + 1] || '';

    var segments = [
        String(startLine) + '. ' + TermColor.gray(prevLine)
    ];

    var failLine;
    var startColumn;
    var endColumn;
    if (startLine === endLine) {
        failLine = sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            String(startLine + 1) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    } else {
        failLine = sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            String(startLine + 1) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, failLine.length))
        );

        for (var i = startLine + 1; i < endLine; i++) {
            segments.push(
                String(i + 1) + '. ' + TermColor.red(sourceLines[i])
            );
        }

        failLine = sourceLines[endLine];

        segments.push(
            String(endLine + 1) + '. ' +
            TermColor.red(failLine.slice(0, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    }

    segments.push(
        String(endLine + 2) + '. ' + TermColor.gray(nextLine)
    );

    return segments.join('\n');
}
