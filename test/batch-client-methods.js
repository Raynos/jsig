'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/').compile;

var batchClientDir = path.join(__dirname, 'fixtures', 'batch-client-methods');

test('Working prototype method definition', function t(assert) {
    var file = getFile('good-working-prototype-method-definition.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 0, 'expected no errors');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

test('declare export after assignment to prototype', function t(assert) {
    var file = getFile('good-declare-export-after-assignment-to-prototype.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 0, 'expected no errors');
    assert.ok(meta.moduleExportsType, 'expected export type');

    assert.end();
});

test('can declare methods using function expression', function t(assert) {
    var file = getFile('good-assign-method-as-func-expression.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 0, 'expected no errors');
    assert.ok(meta.moduleExportsType, 'expected export type');

    assert.end();
});

test('Assign method which has too many args', function t(assert) {
    var file = getFile('bad-assigning-method-which-has-too-many-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-many-function-args');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 2);
    assert.equal(err.line, 13);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 13);

    assert.end();
});

test('assign method too few args', function t(assert) {
    var file = getFile('bad-assigning-method-which-has-too-few-args.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-function-args');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.actualArgs, 0);
    assert.equal(err.line, 13);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 13);

    assert.end();
});

test('assign method with wrong arg number -> string', function t(assert) {
    var file = getFile('bad-assigning-method-with-wrong-arg-type.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'String');
    assert.equal(err.line, 14);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 13);

    assert.end();
});

test('assign non-existant field in method', function t(assert) {
    var file = getFile('bad-assigning-to-non-existant-field-in-method.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.fieldName, 'x');
    assert.equal(err.objName, 'this');
    assert.equal(err.line, 8);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 11);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 6);

    assert.end();
});

test('assign wrong value to field in method', function t(assert) {
    var file = getFile('bad-assign-wrong-value-to-field-in-method.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 9);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 12);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 7);

    assert.end();
});

test('return the wrong value from method', function t(assert) {
    var file = getFile('bad-return-the-wrong-value-from-method.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 4, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'String');
    assert.equal(err.line, 10);

    var err1 = meta.errors[1];
    assert.equal(err1.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err1.expected, 'Number');
    assert.equal(err1.actual, 'String');
    assert.equal(err1.line, 10);

    var err2 = meta.errors[2];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 13);

    var err3 = meta.errors[3];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 7);

    assert.end();
});

test('forget to return', function t(assert) {
    var file = getFile('bad-method-without-a-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-return-statement');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'void');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.line, 7);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 11);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 7);

    assert.end();
});

test('return when it says void', function t(assert) {
    var file = getFile('bad-method-returning-when-it-should-not.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 4, 'expected 3 error');

    var err0 = meta.errors[0];
    assert.equal(err0.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err0.expected, 'void');
    assert.equal(err0.actual, 'Number');
    assert.equal(err0.line, 10);

    var err = meta.errors[1];
    assert.equal(err.type, 'jsig.verify.non-void-return-type');
    assert.equal(err.expected, 'void');
    assert.equal(err.actual, 'Number');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.line, 10);

    var err2 = meta.errors[2];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 13);

    var err3 = meta.errors[3];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 7);

    assert.end();
});

test('forget to assign to prototype', function t(assert) {
    var file = getFile('bad-forget-to-assign-to-prototype.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 2, 'expected 2 error');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err1.fieldName, '_sendRequest');
    assert.equal(err1.otherField, 'no-field');
    assert.equal(err1.funcName, 'BatchClient');
    assert.equal(err1.line, 12);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.untyped-function-found');
    assert.equal(err2.funcName, '_sendRequest');
    assert.equal(err2.line, 8);

    assert.end();
});

test('treat this value as a string', function t(assert) {
    var file = getFile('bad-treat-this-value-as-string.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 1 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual,
        '{\n    channel: Channel,\n' +
        '    hosts: Array<String>,\n' +
        '    value: String,\n' +
        '    _sendRequest: (this: TBatchClient, foo: String) => void\n}');
    assert.equal(err.line, 8);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 11);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 7);

    assert.end();
});

test('this type is required in method definition', function t(assert) {
    var file = getFile('bad-accessing-this-without-definition.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta');
    assert.equal(meta.errors.length, 3, 'expected 3 error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-this');
    assert.equal(err.funcName, '_sendRequest');
    assert.equal(err.funcType, '(foo: String) => void');
    assert.equal(err.line, 14);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, '_sendRequest');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.untyped-function-found');
    assert.equal(err3.funcName, '_sendRequest');
    assert.equal(err3.line, 13);

    assert.end();
});

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
