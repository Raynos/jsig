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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 7
                },
                end: {
                    line: 1,
                    column: 13
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Number',
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 15
                },
                end: {
                    line: 1,
                    column: 21
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Number',
            _raw: null
        }],
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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 7
                },
                end: {
                    line: 1,
                    column: 13
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'String',
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 15
                },
                end: {
                    line: 1,
                    column: 21
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Object',
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 23
                },
                end: {
                    line: 1,
                    column: 28
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Array',
            _raw: null
        }],
        _raw: null
    });

    assert.end();
});
