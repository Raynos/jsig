#!/usr/bin/env node
'use strict';

var process = global.process;
var minimist = require('minimist');
var console = require('console');
var path = require('path');
var assert = require('assert');
var TermColor = require('term-color');

var compile = require('../type-checker/');

/*eslint no-process-exit: 0*/
module.exports = main;

/*
var template = style('{bold}{red}{title} {grey}{filename}{reset}\n'
                     + '    {red}{v}\n'
                     + '    {grey}{previousLineNo}. {previousLine}\n'
                     + '    {reset}{failingLineNo}. {failingLine}\n'
                     + '    {grey}{nextLineNo}. {nextLine}\n'
                     + '    {red}{^}{reset}\n'
                     + '    {stack}\n'
                     + '{reset}');
*/

function main(args) {
    var fileName = args._[0];
    if (!fileName) {
        console.warn('WARN: unknown fileName');
        return shortHelp();
    }

    var sourceFile = path.resolve(process.cwd(), fileName);
    var checker = compile(sourceFile, {
        definitions: args.definitions || null
    });
    if (checker.errors.length === 0) {
        console.log('No type errors');
        return process.exit(0);
    }

    console.log('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];

        assert(error.fileName, 'error must have fileName');
        var relativePath = path.relative(process.cwd(), error.fileName);

        console.log(TermColor.underline(relativePath));

        prettyPrintError(checker, error, {
            prefix: ''
        });
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    console.log(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    console.log('');

    process.exit(1);
}

function prettyPrintError(checker, error, opts) {
    log(opts.prefix, 'Found error: ' + TermColor.cyan(error.type));
    log(opts.prefix, error.message);
    log('', '');

    if (opts.showLoc !== false && error.loc) {
        var failingLines = getFailingLines(checker, error);

        log(opts.prefix, failingLines);
        log('', '');
    }

    if (error.type.indexOf('jsig.sub-type') === 0) {
        log(opts.prefix, 'Expected : ' + TermColor.green(error.expected));
        log(opts.prefix, 'Actual   : ' + TermColor.red(error.actual));
        log('', '');
    }

    if (Array.isArray(error.originalErrors)) {
        log(opts.prefix, '--------------------');
        log(opts.prefix, '    Error caused by: ');
        log('', '');

        var nestedPrefix = opts.prefix + '    ';
        for (var j = 0; j < error.originalErrors.length; j++) {
            prettyPrintError(checker, error.originalErrors[j], {
                prefix: nestedPrefix,
                showLoc: false
            });
            log('', '');
        }
    }
}

function log(prefix, line) {
    console.log(prefix + line);
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

function shortHelp() {
    console.log('jsig [fileName]');
}

if (require.main === module) {
    main(minimist(process.argv.slice(2)));
}
