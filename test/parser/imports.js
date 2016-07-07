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
        concreteValue: null,
        isGeneric: false,
        name: 'Foo',
        builtin: false,
        optional: false,
        label: null,
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
        concreteValue: null,
        isGeneric: false,
        name: 'Foo',
        builtin: false,
        optional: false,
        label: null,
        _raw: null
    }, {
        type: 'typeLiteral',
        concreteValue: null,
        isGeneric: false,
        name: 'Bar',
        builtin: false,
        optional: false,
        label: null,
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
        optional: false,
        original: {
            type: 'typeLiteral',
            concreteValue: null,
            isGeneric: false,
            name: 'Foo',
            builtin: false,
            optional: false,
            label: null,
            _raw: null
        },
        label: null,
        _raw: null
    }]);

    assert.end();
});
