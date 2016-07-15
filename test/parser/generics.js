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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 6
                },
                end: {
                    line: 1,
                    column: 12
                }
            },
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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 13
                },
                end: {
                    line: 1,
                    column: 19
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'String',
            label: null,
            optional: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 21
                },
                end: {
                    line: 1,
                    column: 27
                }
            },
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
