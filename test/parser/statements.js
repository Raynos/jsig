'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : String', function t(assert) {
    var content = 'foo : String';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        builtin: true,
        label: null,
        optional: false,
        name: 'String',
        _raw: null
    });

    assert.end();
});

test('foo : Error', function t(assert) {
    var content = 'foo : Error';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        builtin: false,
        label: null,
        optional: false,
        name: 'Error',
        _raw: null
    });

    assert.end();
});

test('foo : null', function t(assert) {
    var content = 'foo : null';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'null',
        value: 'null',
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : RegExp', function t(assert) {
    var content = 'foo : RegExp';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        name: 'RegExp',
        label: null,
        optional: false,
        builtin: true,
        _raw: null
    });

    assert.end();
});

test('foo : undefined', function t(assert) {
    var content = 'foo : undefined';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'undefined',
        value: 'undefined',
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : Array', function t(assert) {
    var content = 'foo : Array';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        name: 'Array',
        label: null,
        optional: false,
        builtin: true,
        _raw: null
    });

    assert.end();
});

test('foo-bar : Number', function t(assert) {
    var content = 'foo-bar : Number';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo-bar');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        builtin: true,
        label: null,
        optional: false,
        name: 'Number',
        _raw: null
    });

    assert.end();
});

test('foo : () => Number', function t(assert) {
    var content = 'foo : () => Number';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        args: [],
        generics: [],
        thisArg: null,
        result: {
            type: 'typeLiteral',
            builtin: true,
            label: null,
            optional: false,
            name: 'Number',
            _raw: null
        },
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('two statements', function t(assert) {
    var content = 'foo : () => Number\n' +
        'bar : String';
    var result = parse(content);

    assert.equal(result.type, 'program');
    assert.equal(result.statements.length, 2);

    assert.deepEqual(result.statements[0], {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            thisArg: null,
            args: [],
            generics: [],
            result: {
                type: 'typeLiteral',
                label: null,
                optional: false,
                builtin: true,
                name: 'Number',
                _raw: null
            },
            label: null,
            optional: false,
            _raw: null
        },
        _raw: null
    });
    assert.deepEqual(result.statements[1], {
        type: 'assignment',
        identifier: 'bar',
        typeExpression: {
            type: 'typeLiteral',
            label: null,
            optional: false,
            builtin: true,
            name: 'String',
            _raw: null
        },
        _raw: null
    });

    assert.end();
});

test('foo-baz/bar-boz : Number', function t(assert) {
    var content = 'foo-baz/bar-boz : Number';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo-baz/bar-boz',
        typeExpression: {
            type: 'typeLiteral',
            label: null,
            optional: false,
            builtin: true,
            name: 'Number',
            _raw: null
        },
        _raw: null
    });

    assert.end();
});
