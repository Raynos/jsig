'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client');

test('Working prototype method definition', function t(assert) {
    var file = getFile('good-working-prototype-method-definition.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 0, 'expected no errors');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('Assign method which has too many args', function t(assert) {
    var file = getFile('bad-assigning-method-which-has-too-many-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-many-function-args');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 2);
    assert.equal(err.line, 13);

    assert.end();
});

test('assign method too few args', function t(assert) {
    var file = getFile('bad-assigning-method-which-has-too-few-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-function-args');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 0);
    assert.equal(err.line, 13);

    assert.end();
});

test('assign method with wrong arg number -> string', function t(assert) {
    var file = getFile('bad-assigning-method-with-wrong-arg-type.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 1, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'foo: String');
    assert.equal(err.line, 14);

    assert.end();
});

test('assign non-existant field in method');
test('assign wrong value to field in method');
test('return the wrong value');
test('forget to return');
test('return when it says void');
test('forget to assign to prototype');
test('treat this value as a string');

test('declare export after assignment to prototype');
test('make assigning to prototype illegal after export');

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
