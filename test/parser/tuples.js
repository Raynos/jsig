'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : [Number, Number]', function t(assert) {
    var content = 'foo : [Number, Number]';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'tuple',
        values: [{
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            label: null,
            optional: false,
            name: 'Number',
            _raw: null
        }, {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            label: null,
            optional: false,
            name: 'Number',
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('bar : [String, Object, Array]', function t(assert) {
    var content = 'bar : [String, Object, Array]';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'bar');
    assert.deepEqual(result.typeExpression, {
        type: 'tuple',
        values: [{
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            label: null,
            optional: false,
            name: 'String',
            _raw: null
        }, {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            label: null,
            optional: false,
            name: 'Object',
            _raw: null
        }, {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            label: null,
            optional: false,
            name: 'Array',
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
