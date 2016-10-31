'use strict';

var test = require('tape');
var path = require('path');

var TypeChecker = require('../type-checker/');

var PREVIOUS_CHECKER = null;
var batchClientDir = path.join(__dirname, 'fixtures', 'batch-client-modules');

test('working require from another file', function t(assert) {
    var file = getFile('good-working-require1.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('working require with json file', function t(assert) {
    var file = getFile('good-working-json-require.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no error');

    assert.end();
});

test('working require side effect file');

test('require non-existant file');
test('require file with ES syntax error');
test('require file that does not export anything');
test('require file that does not type check');
test('require function from file and call incorrectly');

test('import non-existant file in hjs');
test('import header file with jsig syntax error');
test('import header file that does not define token');
test('import header file but no tokens');
test('redefine token imported from header file');

function compile(fileName) {
    var checker = new TypeChecker(fileName, {
        previousChecker: PREVIOUS_CHECKER
    });
    checker.checkProgram();

    if (PREVIOUS_CHECKER === null) {
        PREVIOUS_CHECKER = checker;
    }
    return checker;
}

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
