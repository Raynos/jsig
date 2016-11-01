'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var TypeChecker = require('../../type-checker/');

var PREVIOUS_CHECKER = null;
var batchClientDir = path.join(
    __dirname, '..', 'fixtures', 'batch-client-constructor'
);

test('Working simple constructor', function t(assert) {
    var file = getFile('good-working-simple-constructor.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected no errors');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('Calling String(x) in constructor', function t(assert) {
    var file = getFile('good-calling-string-x-in-constructor.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 0, 'expected 0 errors');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('Missing header file', function t(assert) {
    var file = getFile('bad-missing-header-file.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    var errors = meta.errors;
    assert.equal(errors.length, 2, 'expected two errors');

    var error1 = errors[0];
    assert.equal(error1.type, 'jsig.verify.unknown-module-exports',
        'should have an unknown export error');
    assert.equal(error1.funcName, 'BatchClient');
    assert.equal(error1.line, 3);

    var error2 = errors[1];
    assert.equal(error2.type, 'jsig.verify.untyped-function-found');
    assert.equal(error2.funcName, 'BatchClient');
    assert.equal(error2.line, 5);

    assert.end();
});

test('Header file references unknown literal', function t(assert) {
    var file = getFile('bad-header-file-references-unknown-literal.js');

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

test('Assigning field in constructor to wrong type', function t(assert) {
    var file = getFile('bad-assigning-field-in-constructor-to-wrong-type.js');

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

test('Skipping a field in the constructor', function t(assert) {
    var file = getFile('bad-skipping-a-field-in-the-constructor.js');

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

test('Assigning non-existant field in constructor', function t(assert) {
    var file = getFile('bad-assigning-non-existant-field-in-constructor.js');

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

test('Assigning Array<Number> to Array<String> field', function t(assert) {
    var file = getFile('bad-assigning-array-number-to-array-string-field.js');

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
