#!/usr/bin/env node
'use strict';

var process = global.process;
var minimist = require('minimist');
var console = require('console');
var path = require('path');

var compile = require('../type-checker/');

/*eslint no-process-exit: 0*/
module.exports = main;

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

    console.log(checker.prettyPrintAllErrors());
    process.exit(1);
}

function shortHelp() {
    console.log('jsig [fileName]');
}

if (require.main === module) {
    main(minimist(process.argv.slice(2)));
}
