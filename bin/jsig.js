#!/usr/bin/env node
'use strict';

var process = global.process;
var console = require('console');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var TermColor = require('term-color');

var $package = require('../package.json');
var TypeChecker = require('../type-checker/');
var ArgsVerify = require('./lib/args-verify.js');
var findFiles = require('./find-files.js');

function TypeCheckBinary(args) {
    this.args = args;
    this.fileName = args._[0];
    this.ignore = args.ignore || [];
    for (var i = 0; i < this.ignore.length; i++) {
        // If relative
        if (this.ignore[i][0] !== '/') {
            this.ignore[i] = path.join(process.cwd(), this.ignore[i]);
        }
    }

    this.entryFiles = null;
    this.checker = null;
}

TypeCheckBinary.args = new ArgsVerify({
    name: 'jsig'
});
TypeCheckBinary.args.addBoolean('h');
TypeCheckBinary.args.addBoolean('v');
TypeCheckBinary.args.addBoolean('help');
TypeCheckBinary.args.addBoolean('version');
TypeCheckBinary.args.addBoolean('color');
TypeCheckBinary.args.addPositional('fileName');

TypeCheckBinary.args.add('definitions', {
    help: 'path to a folder of type definition files',
    type: 'directory'
});
TypeCheckBinary.args.add('globalsFile', {
    help: 'path to file defining global types',
    type: 'filePath'
});
TypeCheckBinary.args.add('ignore', {
    help: 'directory to ignore',
    type: 'directory',
    multiple: true
});
TypeCheckBinary.args.add('optin', {
    boolean: true,
    help: 'Turn on optin only mode'
});
TypeCheckBinary.args.add('trace', {
    boolean: true,
    help: 'Turns on tracing mode, lots of extra output...'
});

TypeCheckBinary.prototype.run = function run() {
    if (this.args.h || this.args.help) {
        return this.shortHelp();
    }

    if (this.args.v || this.args.version) {
        return this.version();
    }

    if (!this.fileName) {
        this.shortHelp();
        console.log('WARN: unknown fileName');
        return null;
    }

    this.check();
};

TypeCheckBinary.prototype.check = function check() {
    var rootFile = path.resolve(process.cwd(), this.fileName);

    this.entryFiles = findFiles(rootFile, {
        ignore: this.ignore
    });
    this.checker = new TypeChecker(this.entryFiles, {
        definitions: this.args.definitions || null,
        globalsFile: this.args.globals || null,
        optin: this.args.optin || false
    });

    var success = this.checkProgram();

    /* eslint-disable no-process-env */
    if (process.env.TRACE || this.args.trace) {
        console.log(this.checker.prettyPrintTraces());
    }
    /* eslint-enable no-process-env */

    if (success && this.checker.errors.length === 0) {
        console.log('No type errors');

        return this.exit(0);
    }

    console.log(this.checker.prettyPrintAllErrors());

    this.exit(1);
};

TypeCheckBinary.prototype.checkProgram =
function checkProgram() {
    var success = true;
    /* eslint-disable no-restricted-syntax */
    try {
        this.checker.checkProgram();
    } catch (error) {
    /* eslint-enable no-restricted-syntax */

        this.warnError(error);
        success = false;
    }

    return success;
};

TypeCheckBinary.prototype.warnError = function warnError(error) {
    console.log(TermColor.red('Fatal Exception: '), {
        message: error.message,
        stackLine: error.stack && error.stack.split('\n')[1],
        rawStack: error.stack && error.stack.split('\n')
    });

    var currMeta = this.checker.currentMeta;
    console.log('was processing the following text: ');
    console.log();
    console.log(TermColor.red(
        currMeta.serializeAST(currMeta.currentNode)
    ));
    console.log();
    console.log('on: ' + currMeta.fileName + ':' +
        currMeta.currentNode.loc.start.line);
};

TypeCheckBinary.prototype.exit = function exit(code) {
    process.exit(code);
};

TypeCheckBinary.prototype.unknownFilename =
function unknownFilename() {
    return this.shortHelp();
};

TypeCheckBinary.prototype.shortHelp =
function shortHelp() {
    console.log(TypeCheckBinary.args.createHelpText());
};

TypeCheckBinary.prototype.version =
function version() {
    console.log('version: ' + $package.version);
    var commit = $package.gitHead;
    if (!commit) {
        commit = this._getHeadCommit();
    }

    console.log('commit: ' + commit);
};

TypeCheckBinary.prototype._getHeadCommit =
function _getHeadCommit() {
    var gitFolder = path.join(__dirname, '..', '.git');

    var headText = fs.readFileSync(path.join(gitFolder, 'HEAD'), 'utf8');
    assert(headText.indexOf('ref:') === 0, 'must be ref');

    var ref = headText.slice(5).trim();
    return fs.readFileSync(path.join(gitFolder, ref), 'utf8');
};

/*eslint no-process-exit: 0*/
module.exports = TypeCheckBinary;

function main(argv) {
    var opts = TypeCheckBinary.args.parse(argv);
    if (!opts) {
        var errors = TypeCheckBinary.args.errors;

        console.log(TypeCheckBinary.args.createHelpText());
        console.log('');

        for (var i = 0; i < errors.length; i++) {
            console.log('WARN: ' + errors[i]);
        }
        return process.exit(1);
    }

    var bin = new TypeCheckBinary(opts);
    bin.run();
}

if (require.main === module) {
    main(process.argv);
}
