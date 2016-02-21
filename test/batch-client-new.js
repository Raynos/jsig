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

test('calling constructor with wrong type', function t(assert) {
    var file = getFile('bad-calling-constructor-with-wrong-type.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'str: String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 9);

    assert.end();
});

test('calling constructor with too many args', function t(assert) {
    var file = getFile('bad-calling-constructor-with-too-many-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-many-args-in-new-expression');
    assert.equal(err.funcName, 'Buffer');
    assert.equal(err.actualArgs, 2);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.line, 9);

    assert.end();
});

test('calling constructor with too few args', function t(assert) {
    var file = getFile('bad-calling-constructor-with-too-few-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-args-in-new-expression');
    assert.equal(err.funcName, 'Buffer');
    assert.equal(err.actualArgs, 0);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.line, 9);

    assert.end();
});

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
