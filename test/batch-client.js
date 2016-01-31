'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client');

test('batch-client-1', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-1.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    var errors = meta.errors;
    assert.equal(errors.length, 1, 'expected one error');

    var error = errors[0];
    assert.equal(error.type, 'jsig.missing.header-file',
        'should have a missing header file error');
    assert.equal(error.fileName, file.replace('.js', '.hjs'),
        'header file error should be for our file');

    assert.end();
});

test('batch-client-2', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-2.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('batch-client-3', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-3.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');

    assert.equal(meta.errors.length, 2, 'expected error');
    var err1 = meta.errors[0];
    var err2 = meta.errors[1];

    assert.equal(err1.type, 'jsig.header-file.unknown-literal');
    assert.equal(err1.literal, 'Channel');
    assert.equal(err2.type, 'jsig.header-file.unknown-literal');
    assert.equal(err2.literal, 'Channel');

    assert.end();
});

test('batch-client-4', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-4.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];

    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 7);
    assert.equal(err.expected, 'Array<String>');
    assert.equal(err.actual, 'String');

    assert.end();
});

test('batch-client-5', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-5.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err.fieldName, 'hosts');
    assert.equal(err.otherField, 'no-field');
    assert.equal(err.line, 5);

    assert.end();
});

test('batch-client-6', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-6.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.fieldName, 'wat');
    assert.equal(err.objName, 'this');
    assert.equal(err.line, 8);

    assert.end();
});

test('batch-client-7', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-7.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Array<String>');
    assert.equal(err.actual, 'Array<Number>');
    assert.equal(err.line, 7);

    assert.end();
});
