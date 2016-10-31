'use strict';

var tape = require('tape');
var tapeCluster = require('tape-cluster');
var multiline = require('multiline');
var console = require('console');
var process = global.process;

var TypeChecker = require('../../type-checker/');

var PREVIOUS_CHECKER = null;

JSigSnippet.test = tapeCluster(tape, JSigSnippet);
module.exports = JSigSnippet;

function getText(funcOrStr) {
    if (typeof funcOrStr === 'string') {
        return funcOrStr;
    }

    return multiline(funcOrStr);
}

function JSigSnippet(opts) {
    if (typeof opts === 'function') {
        opts = {
            snippet: opts
        };
    }

    this.snippet = opts.snippet;
    this.text = getText(this.snippet);
    this.header = opts.header ? getText(opts.header) : null;
    this.optin = opts.optin || false;

    this.files = {};

    this.files['snippet.js'] = this.text;
    if (this.header) {
        this.files['snippet.hjs'] = this.header;
    }

    this.programMeta = null;
}

JSigSnippet.prototype.bootstrap = function bootstrap(cb) {
    cb(null);
};

JSigSnippet.prototype.close = function close(cb) {
    cb(null);
};

JSigSnippet.prototype.compile = function compile() {
    this.programMeta = new TypeChecker('snippet.js', {
        files: this.files,
        optin: this.optin,
        previousChecker: PREVIOUS_CHECKER
    });

    if (PREVIOUS_CHECKER === null) {
        PREVIOUS_CHECKER = this.programMeta;
    }

    this.programMeta.checkProgram();

    return this.programMeta;
};

JSigSnippet.prototype.checkMeta = function checkMeta(assert) {
    var meta = this.programMeta;

    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no error');

    if (meta.errors.length > 0) {
        /* eslint-disable no-process-env */
        if (process.env.TRACE) {
            console.error(meta.prettyPrintTraces());
        }
        /* eslint-enable no-process-env */

        console.error(meta.prettyPrintAllErrors());
    }
};

JSigSnippet.prototype.compileAndCheck = function compileAndCheck(assert) {
    var meta = this.compile();
    this.checkMeta(assert);

    return meta;
};
