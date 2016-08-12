'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('type Foo : String', function t(assert) {
    var content = 'type Foo : String';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'typeDeclaration');
    assert.equal(result.identifier, 'Foo');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 11
            },
            end: {
                line: 1,
                column: 17
            }
        },
        concreteValue: null,
        isGeneric: false,
        builtin: true,
        name: 'String',
        _raw: null
    });

    assert.end();
});

test('type OptionError<T> : { option: T }', function t(assert) {
    var content = 'type OptionError<T> : { option: T }';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'typeDeclaration');
    assert.equal(result.identifier, 'OptionError');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            isMethod: false,
            key: 'option',
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 32
                    },
                    end: {
                        line: 1,
                        column: 33
                    }
                },
                concreteValue: null,
                isGeneric: true,
                name: 'T',
                builtin: false,
                _raw: null
            },
            optional: false,
            _raw: null
        }],
        brand: 'Object',
        open: false,
        _raw: null
    });
    assert.deepEqual(result.generics, [{
        type: 'typeLiteral',
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 17
            },
            end: {
                line: 1,
                column: 18
            }
        },
        concreteValue: null,
        isGeneric: false,
        name: 'T',
        builtin: false,
        _raw: null
    }]);

    assert.end();
});
