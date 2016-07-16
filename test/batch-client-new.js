'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'fixtures', 'batch-client-new');

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
    assert.equal(err.expected, 'String');
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

test('assigning result of new to wrong type', function t(assert) {
    var file = getFile('bad-assigning-result-of-new-to-wrong-type.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, '{ str: String }');
    assert.equal(err.line, 9);

    assert.end();
});

test('calling new on camel case constructor', function t(assert) {
    var file = getFile('bad-calling-new-on-camel-case-constructor.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-must-be-pascal-case');
    assert.equal(err1.line, 10);
    assert.equal(err1.funcName, 'makeBuffer');
    assert.equal(err1.funcType, '(this: TBuffer, str: String) => void');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.line, 6);
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');

    assert.end();
});

test('calling new on normal function', function t(assert) {
    var file = getFile('bad-calling-new-on-normal-function.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.calling-new-on-plain-function');
    assert.equal(err1.line, 10);
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.funcType, '(str: String) => String');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.line, 5);
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');

    assert.end();
});

test('calling new on non-object thisArg', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-weird-this.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 3, 'expected two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-this-type-must-be-object');
    assert.equal(err1.line, 9);
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.thisType, 'String');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.line, 5);
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.constructor-this-type-must-be-object');
    assert.equal(err3.line, 12);
    assert.equal(err3.funcName, 'Buffer');
    assert.equal(err3.thisType, 'String');

    assert.end();
});

test('calling new on empty object thisArg', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-empty-this.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 2, 'expected two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-this-type-must-be-object');
    assert.equal(err1.line, 9);
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.thisType, '{}');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.line, 5);
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');

    assert.end();
});

test('calling new on constructor with a return string', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-string-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-must-return-void');
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.returnType, 'String');
    assert.equal(err1.line, 9);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.return-statement-in-constructor');
    assert.equal(err3.funcName, 'Buffer');
    assert.equal(err3.returnType, 'String');
    assert.equal(err3.line, 14);

    assert.end();
});

test('calling new on constructor with a return object', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-object-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-must-return-void');
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.returnType, '{ str: String }');
    assert.equal(err1.line, 9);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.return-statement-in-constructor');
    assert.equal(err3.funcName, 'Buffer');
    assert.equal(err3.returnType, '{ str: String }');
    assert.equal(err3.line, 15);

    assert.end();
});

test('calling new on constructor with return null', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-null-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-must-return-void');
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.returnType, 'null');
    assert.equal(err1.line, 9);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.return-statement-in-constructor');
    assert.equal(err3.funcName, 'Buffer');
    assert.equal(err3.returnType, 'null');
    assert.equal(err3.line, 14);

    assert.end();
});

test('calling new on constructor with return undefined', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-undefined-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.constructor-must-return-void');
    assert.equal(err1.funcName, 'Buffer');
    assert.equal(err1.returnType, 'undefined');
    assert.equal(err1.line, 9);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-field-in-constructor');
    assert.equal(err2.fieldName, 'key');
    assert.equal(err2.otherField, 'no-field');
    assert.equal(err2.funcName, 'BatchClient');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.return-statement-in-constructor');
    assert.equal(err3.funcName, 'Buffer');
    assert.equal(err3.returnType, 'undefined');
    assert.equal(err3.line, 14);

    assert.end();
});

test('calling new on constructor with an empty return', function t(assert) {
    var file = getFile('bad-calling-new-on-function-with-empty-return.js');

    var meta = compile(file);
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 1, 'expected three errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.return-statement-in-constructor');
    assert.equal(err.funcName, 'Buffer');
    assert.equal(err.returnType, 'empty return');
    assert.equal(err.line, 14);

    assert.end();
});

function getFile(fileName) {
    return path.join(batchClientDir, fileName);
}
