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

    var checker = compile(path.resolve(process.cwd(), fileName));
    if (checker.errors.length === 0) {
        console.log('No type errors');
        return process.exit(0);
    }

    console.log('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];
        var relativePath = path.relative(process.cwd(), error.fileName);

        console.log(TermColor.underline(relativePath));
        console.log('Found error: ' + TermColor.cyan(error.type));
        console.log(error.message);

        if (error.loc) {
            var failingLines = getFailingLines(checker, error);

            console.log('');
            console.log(failingLines);
            console.log('');
        }

        if (error.type === 'jsig.sub-type.type-class-mismatch') {
            console.log('Expected : ' + TermColor.green(error.expected));
            console.log('Actual   : ' + TermColor.red(error.actual));
            console.log('');
        }
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    console.log(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    console.log('');

    process.exit(1);
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

    if (startLine === endLine) {
        var failLine = meta.sourceLines[startLine];

        var startColumn = err.loc.start.column;
        var endColumn = err.loc.end.column;

        segments.push(
            String(startLine) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    } else {
        assert(false, 'multi-line pretty print not implemented');
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
