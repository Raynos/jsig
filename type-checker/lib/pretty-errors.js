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
        var failingLines = getFailingLines(checker, error.loc, error.fileName);

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
        var failingLines = getFailingLines(
            checker, trace.node.loc, trace.fileName
        );

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

function getFailingLines(checker, loc, fileName) {
    var meta = checker.getOrCreateMeta(fileName);
    var startLine = loc.start.line - 1;
    var endLine = loc.end.line - 1;

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
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            String(startLine) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    } else {
        failLine = meta.sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

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
