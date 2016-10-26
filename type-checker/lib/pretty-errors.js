'use strict';

var process = global.process;
var assert = require('assert');
var path = require('path');
var TermColor = require('term-color');

var serializeType = require('../../serialize.js');

var isJSFileR = /\.js$/;
var STRAIGHT_LINE = '-----------------------------------------' +
    '------------------------';

var CWD = process ? process.cwd() : '/';

module.exports = {
    prettyPrintAllErrors: prettyPrintAllErrors,
    prettyPrintAllErrorsWithTrace: prettyPrintAllErrorsWithTrace,
    prettyPrintTraces: prettyPrintTraces,
    prettyPrintErrorStatement: prettyPrintErrorStatement
};

function prettyPrintAllErrors(checker) {
    var parts = [];
    parts.push('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];
        parts.push(prettyPrintErrorStatement(checker, error));
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    parts.push(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    parts.push('');

    return parts.join('\n');
}

function prettyPrintAllErrorsWithTrace(checker) {
    var parts = [];
    parts.push('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];

        parts.push(prettyPrintErrorStatement(checker, error));

        if (error.loc && isJSFileR.test(error.fileName)) {
            var extraTraces = findContextTraces(checker, error);

            if (extraTraces.length > 0) {
                parts.push('traces for error : ');
                parts.push('');
            }

            for (var j = 0; j < extraTraces.length; j++) {
                var trace = extraTraces[j];
                parts.push(prettyPrintTraceStatement(checker, trace, '    '));
            }
        }
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    parts.push(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    parts.push('');

    return parts.join('\n');
}

function prettyPrintTraces(checker) {
    var traces = checker.traces;
    var parts = [];
    parts.push('');

    for (var i = 0; i < traces.length; i++) {
        var trace = traces[i];
        parts.push(prettyPrintTraceStatement(checker, trace, ''));
    }

    return parts.join('\n');
}

function prettyPrintTraceStatement(checker, trace, prefix) {
    var str = '';

    assert(trace.fileName, 'trace must have fileName');
    var relativePath = path.relative(CWD, trace.fileName);

    str += prefix + TermColor.underline(relativePath) + '\n';
    str += prettyPrintTrace(checker, trace, {
        prefix: prefix || ''
    });

    return str;
}

function findContextTraces(checker, error) {
    var contextTraces = [];

    for (var i = 0; i < checker.traces.length; i++) {
        var trace = checker.traces[i];

        if (trace.fileName !== error.fileName) {
            continue;
        }

        var traceLoc = trace.node.loc;
        if (traceLoc.start.line < error.loc.start.line ||
            traceLoc.end.line > error.loc.end.line
        ) {
            continue;
        }

        contextTraces.push(trace);
    }

    return contextTraces;
}

function prettyPrintErrorStatement(checker, error) {
    assert(error.fileName, 'error must have fileName');
    var relativePath = path.relative(CWD, error.fileName);

    var str = '';
    str += TermColor.underline(relativePath) + '\n';
    str += prettyPrintError(checker, error, {
        prefix: ''
    });

    return str;
}

function lineGreen(text) {
    if (text.indexOf('\n') === -1) {
        return TermColor.green(text);
    }

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = TermColor.green(lines[i]);
    }

    return lines.join('\n');
}

function lineRed(text) {
    if (text.indexOf('\n') === -1) {
        return TermColor.red(text);
    }

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = TermColor.red(lines[i]);
    }

    return lines.join('\n');
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

        var failingLines = getFailingLines(sourceLines, error.loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
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
                column: sourceLines[error.line - 1].length
            }
        };

        failingLines = getFailingLines(sourceLines, loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
        parts.push('');
    }

    if (error.expected && error.actual) {
        parts.push(opts.prefix +
            'Expected : ' + lineGreen(error.expected));
        parts.push(opts.prefix +
            'Actual   : ' + lineRed(error.actual));
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

function prettyPrintTrace(checker, trace, opts) {
    var parts = [];

    parts.push(opts.prefix + 'TRACE: ' + TermColor.cyan(trace.type));

    if (trace.node.loc) {
        var meta = checker.getOrCreateMeta(trace.fileName);
        var failingLines = getFailingLines(meta.sourceLines, trace.node.loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
        parts.push('');
    }

    var expected = serializeType(trace.expected);
    var actual = serializeType(trace.actual);

    var expectedLines = expected.split('\n');
    var actualLines = actual.split('\n');
    if (expectedLines.length > 1) {
        expected = expectedLines.join('\n' + opts.prefix);
    }
    if (actualLines.length > 1) {
        actual = actualLines.join('\n' + opts.prefix);
    }

    parts.push(opts.prefix + 'Expected : ' + lineGreen(expected));
    parts.push(opts.prefix + 'Actual : ' + lineRed(actual));
    parts.push('');

    return parts.join('\n');
}

function getFailingLines(sourceLines, loc, opts) {
    var startLine = loc.start.line - 1;
    var endLine = loc.end.line - 1;

    var prevLine = sourceLines[startLine - 1] || '';
    var nextLine = sourceLines[endLine + 1] || '';

    var segments = [
        opts.prefix + String(startLine) + '. ' + TermColor.gray(prevLine)
    ];

    var failLine;
    var startColumn;
    var endColumn;
    if (startLine === endLine) {
        failLine = sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            opts.prefix +
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
            opts.prefix +
            String(startLine + 1) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, failLine.length))
        );

        for (var i = startLine + 1; i < endLine; i++) {
            segments.push(
                opts.prefix +
                String(i + 1) + '. ' + TermColor.red(sourceLines[i])
            );
        }

        failLine = sourceLines[endLine];

        segments.push(
            opts.prefix +
            String(endLine + 1) + '. ' +
            TermColor.red(failLine.slice(0, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    }

    segments.push(
        opts.prefix +
        String(endLine + 2) + '. ' + TermColor.gray(nextLine)
    );

    return segments.join('\n');
}
