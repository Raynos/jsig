'use strict';

var tape = require('tape');
var tapeCluster = require('tape-cluster');
var multiline = require('multiline');
var console = require('console');

var compileJSIG = require('../../type-checker/');

JSigSnippet.test = tapeCluster(tape, JSigSnippet);
module.exports = JSigSnippet;

function JSigSnippet(opts) {
    if (typeof opts === 'function') {
        opts = {
            snippet: opts
        };
    }

    this.snippet = opts.snippet;
    this.text = multiline(this.snippet);
    this.header = opts.header ? multiline(opts.header) : null;

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
    this.programMeta = compileJSIG('snippet.js', {
        files: this.files
    });

    return this.programMeta;
};

JSigSnippet.prototype.checkMeta = function checkMeta(assert) {
    var meta = this.programMeta;

    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no error');

    if (meta.errors.length > 0) {
        console.error(meta.prettyPrintAllErrors());
    }
};

JSigSnippet.prototype.compileAndCheck = function compileAndCheck(assert) {
    this.compile();
    this.checkMeta(assert);
};
