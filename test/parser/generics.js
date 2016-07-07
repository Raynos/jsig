'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : Object<String, String>', function t(assert) {
    var content = 'foo : Object<String, String>';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'genericLiteral',
        value: {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Object',
            label: null,
            optional: false,
            _raw: null
        },
        generics: [{
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'String',
            label: null,
            optional: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'String',
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
