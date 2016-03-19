'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client-calls');

test('working method calls within a closure', function t(assert) {
    var file = getFile('good-working-method-with-closure.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('working method calls within a class', function t(assert) {
    var file = getFile('good-method-call-with-class.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('calling method with wrong args', function t(assert) {
    var file = getFile('bad-call-method-with-wrong-argument.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 18);
    assert.equal(err.expected, 'bucketStart: Number');
    assert.equal(err.actual, 'op: PendingOutOperation');

    assert.end();
});

test('calling method without argument', function t(assert) {
    var file = getFile('bad-calling-method-with-no-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-args-in-call');
    assert.equal(err.line, 18);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 0);
    assert.equal(err.funcName, 'this.getOrCreateBucket');

    assert.end();
});

test('calling method with extra argument', function t(assert) {
    var file = getFile('bad-calling-method-with-extra-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-many-args-in-call');
    assert.equal(err.line, 19);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 2);
    assert.equal(err.funcName, 'this.getOrCreateBucket');

    assert.end();
});

test('calling method on wrong object', function t(assert) {
    var file = getFile('bad-calling-method-on-wrong-object.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.line, 19);
    assert.equal(err.fieldName, 'getOrCreateBucket');
    assert.equal(err.objName, 'op');

    assert.end();
});

test('calling method on primitive');
test('assigning result of method to wrong type');
test('calling method that does not exist');

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
