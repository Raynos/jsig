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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 11
                },
                end: {
                    line: 1,
                    column: 14
                }
            },
            concreteValue: null,
            isGeneric: false,
            label: null,
            optional: false,
            name: 'Bar',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 17
                },
                end: {
                    line: 1,
                    column: 20
                }
            },
            concreteValue: null,
            isGeneric: false,
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
            line: 3,
            loc: {
                start: {
                    line: 3,
                    column: 5
                },
                end: {
                    line: 3,
                    column: 12
                }
            },
            concreteValue: null,
            isGeneric: false,
            label: null,
            optional: false,
            name: 'ObjectE',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 3,
            loc: {
                start: {
                    line: 3,
                    column: 15
                },
                end: {
                    line: 3,
                    column: 16
                }
            },
            concreteValue: null,
            isGeneric: false,
            label: null,
            optional: false,
            name: 'C',
            builtin: false,
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 3,
            loc: {
                start: {
                    line: 3,
                    column: 19
                },
                end: {
                    line: 3,
                    column: 20
                }
            },
            concreteValue: null,
            isGeneric: false,
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
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 17
                    },
                    end: {
                        line: 1,
                        column: 23
                    }
                },
                concreteValue: null,
                isGeneric: false,
                name: 'Number',
                builtin: true,
                label: null,
                optional: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 26
                    },
                    end: {
                        line: 1,
                        column: 32
                    }
                },
                concreteValue: null,
                isGeneric: false,
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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 37
                },
                end: {
                    line: 1,
                    column: 41
                }
            },
            concreteValue: null,
            isGeneric: false,
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
