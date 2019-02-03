'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var TypeChecker = require('../../type-checker/');

var PREVIOUS_CHECKER = null;
var batchClientDir = path.join(
    __dirname, '..', 'fixtures', 'batch-client-calls'
);

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
    assert.equal(meta.errors.length, 2, 'expected three errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 18);
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual,
        '{\n    timedOut: Boolean,\n' +
        '    data: String,\n' +
        '    timeout: Number\n}');

    var err3 = meta.errors[1];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, 'push');
    assert.equal(err3.line, 16);

    assert.end();
});

test('calling method without argument', function t(assert) {
    var file = getFile('bad-calling-method-with-no-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected three errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-args-in-call');
    assert.equal(err.line, 18);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 0);
    assert.equal(err.funcName, 'this.getOrCreateBucket');

    var err3 = meta.errors[1];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, 'push');
    assert.equal(err3.line, 16);

    assert.end();
});

test('calling method with extra argument', function t(assert) {
    var file = getFile('bad-calling-method-with-extra-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected three errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-many-args-in-call');
    assert.equal(err.line, 19);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 2);
    assert.equal(err.funcName, 'this.getOrCreateBucket');

    var err3 = meta.errors[1];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, 'push');
    assert.equal(err3.line, 16);

    assert.end();
});

test('calling method on wrong object', function t(assert) {
    var file = getFile('bad-calling-method-on-wrong-object.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 4, 'expected five errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.line, 19);
    assert.equal(err.fieldName, 'getOrCreateBucket');
    assert.equal(err.objName, 'op');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.untyped-identifier');
    assert.equal(err2.line, 21);
    assert.equal(err2.tokenName, 'bucket');

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-identifier');
    assert.equal(err3.line, 22);
    assert.equal(err3.tokenName, 'bucket');

    var err5 = meta.errors[3];
    assert.equal(err5.type, 'jsig.verify.untyped-function-found');
    assert.equal(err5.funcName, 'push');
    assert.equal(err5.line, 16);

    assert.end();
});

test('calling method on primitive', function t(assert) {
    var file = getFile('bad-calling-method-on-primitive.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 4, 'expected five errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.line, 19);
    assert.equal(err.fieldName, 'getOrCreateBucket');
    assert.equal(err.nonObjectType, 'Boolean');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.untyped-identifier');
    assert.equal(err2.line, 21);
    assert.equal(err2.tokenName, 'bucket');

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-identifier');
    assert.equal(err3.line, 22);
    assert.equal(err3.tokenName, 'bucket');

    var err5 = meta.errors[3];
    assert.equal(err5.type, 'jsig.verify.untyped-function-found');
    assert.equal(err5.funcName, 'push');
    assert.equal(err5.line, 16);

    assert.end();
});

test('assigning result of method to wrong type', function t(assert) {
    var file = getFile('bad-assign-result-of-method-to-wrong-type.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected 3 errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 21);
    assert.equal(err.expected, 'String');
    assert.equal(err.actual,
        '{\n    elements: PendingElements,\n' +
        '    count: Number\n}');

    var err3 = meta.errors[1];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, 'push');
    assert.equal(err3.line, 17);

    assert.end();
});

test('calling method that does not exist', function t(assert) {
    var file = getFile('bad-calling-non-existant-method.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 4, 'expected five errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.line, 19);
    assert.equal(err.fieldName, 'getOrCreateBucket2');
    assert.equal(err.objName, 'this');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.untyped-identifier');
    assert.equal(err2.line, 21);
    assert.equal(err2.tokenName, 'bucket');

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-identifier');
    assert.equal(err3.line, 22);
    assert.equal(err3.tokenName, 'bucket');

    var err5 = meta.errors[3];
    assert.equal(err5.type, 'jsig.verify.untyped-function-found');
    assert.equal(err5.funcName, 'push');
    assert.equal(err5.line, 16);

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
