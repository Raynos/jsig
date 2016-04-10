'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('type Foo : Bar | Baz', function t(assert) {
    var content = 'type Foo : Bar | Baz';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'typeDeclaration');
    assert.equal(result.identifier, 'Foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'typeLiteral',
            label: null,
            optional: false,
            name: 'Bar',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            label: null,
            optional: false,
            name: 'Baz',
            builtin: false,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('type A : ObjectE | C | D', function t(assert) {
    var content = '\ntype A :\n     ObjectE | C | D';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'typeDeclaration');
    assert.equal(result.identifier, 'A');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'typeLiteral',
            label: null,
            optional: false,
            name: 'ObjectE',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            label: null,
            optional: false,
            name: 'C',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            label: null,
            optional: false,
            name: 'D',
            builtin: false,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('type Foo : (arg: Number | String) => void', function t(assert) {
    var content = 'type Foo : (arg: Number | String) => void';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'typeDeclaration');
    assert.equal(result.identifier, 'Foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        args: [{
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                name: 'Number',
                builtin: true,
                label: null,
                optional: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                name: 'String',
                builtin: true,
                label: null,
                optional: false,
                _raw: null
            }],
            label: 'arg',
            optional: false,
            _raw: null
        }],
        result: {
            type: 'typeLiteral',
            name: 'void',
            builtin: true,
            label: null,
            optional: false,
            _raw: null
        },
        generics: [],
        brand: 'Object',
        thisArg: null,
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
