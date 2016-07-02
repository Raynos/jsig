'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : (String)', function t(assert) {
    var content = 'foo : (String)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        isGeneric: false,
        builtin: true,
        label: null,
        optional: false,
        name: 'String',
        _raw: null
    });

    assert.end();
});

test('foo : (String | Number)', function t(assert) {
    var content = 'foo : (String | Number)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'typeLiteral',
            isGeneric: false,
            label: null,
            optional: false,
            name: 'String',
            builtin: true,
            _raw: null
        }, {
            type: 'typeLiteral',
            isGeneric: false,
            label: null,
            optional: false,
            name: 'Number',
            builtin: true,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : (A) => B | C', function t(assert) {
    var content = 'foo : (A) => B | C';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        label: null,
        brand: 'Object',
        optional: false,
        generics: [],
        _raw: null
    });

    assert.end();
});

test('foo : (A) => (B | C)', function t(assert) {
    var content = 'foo : (A) => (B | C)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        label: null,
        generics: [],
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => B | C)', function t(assert) {
    var content = 'foo : ((A) => B | C)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        generics: [],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => (B | C))', function t(assert) {
    var content = 'foo : ((A) => (B | C))';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        generics: [],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => B) | C', function t(assert) {
    var content = 'foo : ((A) => B) | C';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                isGeneric: false,
                builtin: false,
                label: null,
                optional: false,
                name: 'A',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'C',
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((String) => String) | ((Number) => Number)', function t(assert) {
    var content = 'foo : ((String) => String) | ((Number) => Number)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'String',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'String',
                builtin: true,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }, {
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'Number',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                isGeneric: false,
                label: null,
                optional: false,
                name: 'Number',
                builtin: true,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
