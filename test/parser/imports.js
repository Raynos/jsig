'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('import { Foo } from "bar"', function t(assert) {
    var content = 'import { Foo } from "bar"';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'import');
    assert.equal(result.dependency, 'bar');
    assert.deepEqual(result.types, [{
        type: 'typeLiteral',
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 9
            },
            end: {
                line: 1,
                column: 12
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        name: 'Foo',
        builtin: false,
        _raw: null
    }]);

    assert.end();
});

test('import { Foo, Bar } from "bar"', function t(assert) {
    var content = 'import { Foo, Bar } from "bar"';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'import');
    assert.equal(result.dependency, 'bar');
    assert.deepEqual(result.types, [{
        type: 'typeLiteral',
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 9
            },
            end: {
                line: 1,
                column: 12
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        name: 'Foo',
        builtin: false,
        _raw: null
    }, {
        type: 'typeLiteral',
        line: 1,
        loc: {
            start: {
                line: 1,
                column: 14
            },
            end: {
                line: 1,
                column: 17
            }
        },
        concreteValue: null,
        isGeneric: false,
        genericIdentifierUUID: null,
        name: 'Bar',
        builtin: false,
        _raw: null
    }]);

    assert.end();
});

test('import { Foo as Bar } from "bar"', function t(assert) {
    var content = 'import { Foo as Bar } from "bar"';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'import');
    assert.equal(result.dependency, 'bar');
    assert.deepEqual(result.types, [{
        type: 'renamedLiteral',
        name: 'Bar',
        builtin: false,
        original: {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 9
                },
                end: {
                    line: 1,
                    column: 12
                }
            },
            concreteValue: null,
            isGeneric: false,
            genericIdentifierUUID: null,
            name: 'Foo',
            builtin: false,
            _raw: null
        },
        _raw: null
    }]);

    assert.end();
});
