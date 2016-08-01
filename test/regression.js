'use strict';

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/').compile;

var procWatcherDir = path.join(__dirname, 'fixtures', 'regression');
var definitionsDir = path.join(__dirname, 'lib', 'definitions');
var globalsFile = path.join(__dirname, 'lib', 'globals.hjs');

test('regression: ProcWatcher', function t(assert) {
    var file = getFile('good-proc-watcher.js');

    var meta = compile(file, {
        definitions: definitionsDir,
        globalsFile: globalsFile
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

// TODO: unbreak test suite...
test.skip('regression: HttpHash', function t(assert) {
    var file = getFile('good-http-hash.js');

    var meta = compile(file, {
        definitions: definitionsDir,
        globalsFile: globalsFile
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('regression: HttpServiceRouter', function t(assert) {
    var file = getFile('good-http-service-router.js');

    var meta = compile(file, {
        definitions: definitionsDir,
        globalsFile: globalsFile
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('regression: HttpHashServer', function t(assert) {
    var file = getFile('good-http-hash-server.js');

    var meta = compile(file, {
        definitions: definitionsDir,
        globalsFile: globalsFile
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('regression: global dependencies', function t(assert) {
    var file = getFile('good-global-dependency.js');

    var meta = compile(file, {
        definitions: definitionsDir,
        globalsFile: globalsFile
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no errors');

    assert.end();
});

function getFile(fileName) {
    return path.join(procWatcherDir, fileName);
}
