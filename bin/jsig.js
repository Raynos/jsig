#!/usr/bin/env node
'use strict';

var process = global.process;
var minimist = require('minimist');
var console = require('console');
var path = require('path');
var TermColor = require('term-color');

var TypeChecker = require('../type-checker/').TypeChecker;

/*eslint no-process-exit: 0*/
module.exports = main;

function main(args) {
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

    try {
        checker.checkProgram();
    } catch (error) {
        console.log(TermColor.red('Fatal Exception: '), {
            message: error.message
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
    console.log('jsig [fileName]');
}

if (require.main === module) {
    main(minimist(process.argv.slice(2)));
}
