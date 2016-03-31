'use strict';

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client-modules');

test('working require from another file', function t(assert) {
    var file = getFile('good-working-require1.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

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

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
