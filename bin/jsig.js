#!/usr/bin/env node
'use strict';

var process = global.process;
var minimist = require('minimist');
var console = require('console');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var TermColor = require('term-color');

var $package = require('../package.json');
var TypeChecker = require('../type-checker/').TypeChecker;

/*eslint no-process-exit: 0*/
module.exports = main;

function getHEADCommit() {
    var gitFolder = path.join(__dirname, '..', '.git');

    var headText = fs.readFileSync(path.join(gitFolder, 'HEAD'), 'utf8');
    assert(headText.indexOf('ref:') === 0, 'must be ref');

    var ref = headText.slice(5).trim();
    return fs.readFileSync(path.join(gitFolder, ref), 'utf8');
}

function main(args) {
    if (args.h || args.help) {
        return shortHelp();
    }

    if (args.v || args.version) {
        console.log('version: ' + $package.version);
        var commit = $package.gitHead;
        if (!commit) {
            commit = getHEADCommit();
        }

        console.log('commit: ' + commit);
        return null;
    }

    var fileName = args._[0];
    if (!fileName) {
        console.warn('WARN: unknown fileName');
        return shortHelp();
    }

    var sourceFile = path.resolve(process.cwd(), fileName);
    var checker = new TypeChecker(sourceFile, {
        definitions: args.definitions || null,
        globalsFile: args.globals || null
    });

    /* eslint-disable no-restricted-syntax */
    try {
        checker.checkProgram();
    } catch (error) {
    /* eslint-enable no-restricted-syntax */

        console.log(TermColor.red('Fatal Exception: '), {
            message: error.message,
            stackLine: error.stack && error.stack.split('\n')[1],
            rawStack: error.stack && error.stack.split('\n')
        });

        var currMeta = checker.currentMeta;
        console.log('was processing the following text: ');
        console.log();
        console.log(TermColor.red(
            currMeta.serializeAST(currMeta.currentNode)
        ));
        console.log();
        console.log('on: ' + currMeta.fileName + ':' +
            currMeta.currentNode.loc.start.line);

        return process.exit(1);
    }

    if (checker.errors.length === 0) {
        console.log('No type errors');
        return process.exit(0);
    }

    console.log(checker.prettyPrintAllErrors());
    process.exit(1);
}

function shortHelp() {
    console.log('jsig [-h] [-v] [--help] [fileName]');
}

if (require.main === module) {
    main(minimist(process.argv.slice(2)));
}
