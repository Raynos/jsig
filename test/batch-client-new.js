'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client-new');

test('working new call', function t(assert) {
    var file = getFile('good-working-new-call.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('calling constructor with wrong type');
test('calling constructor with too many args');
test('calling constructor with too few args');
test('calling new on normal function');
test('calling new on non-object thisArg');
test('calling new on empty object thisArg');
test('assigning result of new to wrong type');
test('calling new on constructor with a return string');
test('calling new on constructor with a return other object');
test('calling new on constructor with return null');
test('calling new on constructor with return undefined');
test('calling new on constructor with an empty return');

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
