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

function TypeCheckOptions() {
    this.color = false;
    this.definitions = null;
    this.globalsFile = null;
    this.ignore = [];
    this.optin = false;
    this.trace = false;
    this.fullTrace = false;
}

TypeCheckOptions.prototype.mergeWith =
function mergeWith(args) {
    if ('color' in args) {
        this.color = args.color;
    }
    if ('definitions' in args) {
        this.definitions = args.definitions;
    }
    if ('globalsFile' in args) {
        this.globalsFile = args.globalsFile;
    }
    if ('ignore' in args) {
        this.ignore = this.ignore.concat(args.ignore);
    }
    if ('optin' in args) {
        this.optin = args.optin;
    }
    if ('trace' in args) {
        this.trace = args.trace;
    }
    if ('fullTrace' in args) {
        this.fullTrace = args.fullTrace;
    }
};

function TypeCheckBinary(args) {
    this.fileName = args._[0];

    this.args = args;

    this.options = new TypeCheckOptions();
    // this.options.mergeWith(args);

    this.dirname = process.cwd();

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
TypeCheckBinary.args.addPositional('fileName/dirname');

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
    help: 'Adds line-local traces for all errors.'
});
TypeCheckBinary.args.add('fullTrace', {
    boolean: true,
    help: 'Turns on full tracing mode, lots of extra output...'
});
TypeCheckBinary.args.add('color', {
    boolean: true,
    help: 'Turns on colors'
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
        this.log(TermColor.yellow('WARN:') +
            ' Must pass in a fileName or dirname.');
        this.log(TermColor.yellow('WARN:') +
            ' e.g. `jsig .` or `jsig lib/my-file.js`');
        return null;
    }

    return this.check();
};

TypeCheckBinary.prototype.processOptions =
function processOptions() {
    var configFile = path.resolve(this.dirname, 'jsigconfig.json');
    if (fs.existsSync(configFile)) {
        /*eslint-disable global-require*/
        var json = require(configFile);
        /*eslint-enable global-require*/
        this.options.mergeWith(json);
    }

    this.fileName = path.resolve(this.dirname, this.fileName);

    for (var i = 0; i < this.options.ignore.length; i++) {
        // If relative
        if (this.options.ignore[i][0] !== '/') {
            this.options.ignore[i] = path.join(
                this.dirname, this.options.ignore[i]
            );
        }
    }

    if (this.options.color) {
        TermColor.enabled = true;
    }

    this.options.mergeWith(this.args);
};

TypeCheckBinary.prototype.check = function check() {
    this.processOptions();

    this.entryFiles = findFiles(this.fileName, {
        ignore: this.options.ignore
    });

    var opts = {
        definitions: this.options.definitions || null,
        globalsFile: this.options.globalsFile || null,
        optin: this.options.optin || false
    };
    this.checker = new TypeChecker(this.entryFiles, opts);

    var success = this.checkProgram();

    /* eslint-disable no-process-env */
    if (process.env.TRACE_FULL || this.options.fullTrace) {
        this.log(this.checker.prettyPrintTraces());
    }
    /* eslint-enable no-process-env */

    if (success && this.checker.errors.length === 0) {
        this.log('No type errors');

        return true;
    }

    /* eslint-disable no-process-env */
    if (process.env.TRACE) {
        this.log(this.checker.prettyPrintAllErrorsWithTrace());
    } else {
        this.log(this.checker.prettyPrintAllErrors());
    }
    /* eslint-enable no-process-env */

    return false;
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
    this.log(TermColor.red('Fatal Exception: '), {
        message: error.message,
        stackLine: error.stack && error.stack.split('\n')[1],
        rawStack: error.stack && error.stack.split('\n')
    });

    var currMeta = this.checker.currentMeta;
    this.log('was processing the following text: ');
    this.log();
    this.log(TermColor.red(
        currMeta.serializeAST(currMeta.currentNode)
    ));
    this.log();
    this.log('on: ' + currMeta.fileName + ':' +
        currMeta.currentNode.loc.start.line);
};

TypeCheckBinary.prototype.unknownFilename =
function unknownFilename() {
    return this.shortHelp();
};

TypeCheckBinary.prototype.shortHelp =
function shortHelp() {
    this.log(TypeCheckBinary.args.createHelpText());
};

TypeCheckBinary.prototype.version =
function version() {
    this.log('version: ' + $package.version);
    var commit = $package.gitHead;
    if (!commit) {
        commit = this._getHeadCommit();
    }

    this.log('commit: ' + commit);
};

TypeCheckBinary.prototype._getHeadCommit =
function _getHeadCommit() {
    var gitFolder = path.join(__dirname, '..', '.git');

    var headText = fs.readFileSync(path.join(gitFolder, 'HEAD'), 'utf8');
    assert(headText.indexOf('ref:') === 0, 'must be ref');

    var ref = headText.slice(5).trim();
    return fs.readFileSync(path.join(gitFolder, ref), 'utf8');
};

TypeCheckBinary.prototype.log =
function log(str, meta) {
    if (!str) {
        console.log();
    } else if (!meta) {
        console.log(str);
    } else {
        console.log(str, meta);
    }
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
            console.log(TermColor.yellow('WARN:') + ' ' + errors[i]);
        }
        return process.exit(1);
    }

    var bin = new TypeCheckBinary(opts);
    if (bin.run()) {
        process.exit(0);
    }

    process.exit(1);
}

if (require.main === module) {
    main(process.argv);
}
