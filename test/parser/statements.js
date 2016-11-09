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
        genericIdentifierUUID: null,
        builtin: true,
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
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 6
            },
            end: {
                line: 1,
                column: 11
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        builtin: false,
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
        genericIdentifierUUID: null,
        name: 'RegExp',
        builtin: true,
        _raw: null
    });

    assert.end();
});

test('foo : Symbol', function t(assert) {
    var content = 'foo : Symbol';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
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
        genericIdentifierUUID: null,
        name: 'Symbol',
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
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 6
            },
            end: {
                line: 1,
                column: 11
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        name: 'Array',
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
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 10
            },
            end: {
                line: 1,
                column: 16
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        builtin: true,
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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 12
                },
                end: {
                    line: 1,
                    column: 18
                }
            },
            concreteValue: null,
            isGeneric: false,
            genericIdentifierUUID: null,
            builtin: true,
            name: 'Number',
            _raw: null
        },
        brand: 'Object',
        specialKind: null,
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
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 12
                    },
                    end: {
                        line: 1,
                        column: 18
                    }
                },
                concreteValue: null,
                isGeneric: false,
                genericIdentifierUUID: null,
                builtin: true,
                name: 'Number',
                _raw: null
            },
            brand: 'Object',
            specialKind: null,
            _raw: null
        },
        _raw: null
    });
    assert.deepEqual(result.statements[1], {
        type: 'assignment',
        identifier: 'bar',
        typeExpression: {
            type: 'typeLiteral',
            line: 2,
            loc: {
                start: {
                    line: 2,
                    column: 6
                },
                end: {
                    line: 2,
                    column: 12
                }
            },
            concreteValue: null,
            isGeneric: false,
            genericIdentifierUUID: null,
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
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 18
                },
                end: {
                    line: 1,
                    column: 24
                }
            },
            concreteValue: null,
            isGeneric: false,
            genericIdentifierUUID: null,
            builtin: true,
            name: 'Number',
            _raw: null
        },
        _raw: null
    });

    assert.end();
});

test('foo : false', function t(assert) {
    var content = 'foo : false';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'boolean',
        value: 'false',
        _raw: null
    });

    assert.end();
});

test('foo : true', function t(assert) {
    var content = 'foo : true';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'boolean',
        value: 'true',
        _raw: null
    });

    assert.end();
});

test('foo : "false"', function t(assert) {
    var content = 'foo : "false"';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'string',
        value: '"false"',
        _raw: null
    });

    assert.end();
});

test('foo : 6', function t(assert) {
    var content = 'foo : 6';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'valueLiteral',
        name: 'number',
        value: '6',
        _raw: null
    });

    assert.end();
});
