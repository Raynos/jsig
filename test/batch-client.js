'use strict';

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

// test 3. use `Channel` without defining it.

// test 4. assign wrong type to field

// test 5. do not assign all fields

// test 6. assign to non-existant field
