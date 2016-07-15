'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : { text: String }', function t(assert) {
    var content = 'foo : { text: String }';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            key: 'text',
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 14
                    },
                    end: {
                        line: 1,
                        column: 20
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'String',
                _raw: null
            },
            optional: false,
            _raw: null
        }],
        open: false,
        brand: 'Object',
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : { text: String, type: "DOMTextNode" }', function t(assert) {
    var content = 'foo : {\n' +
        '    text: String,\n' +
        '    type: "DOMTextNode"\n' +
        '}';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            key: 'text',
            value: {
                type: 'typeLiteral',
                line: 2,
                loc: {
                    start: {
                        line: 2,
                        column: 10
                    },
                    end: {
                        line: 2,
                        column: 16
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'String',
                _raw: null
            },
            optional: false,
            _raw: null
        }, {
            type: 'keyValue',
            key: 'type',
            value: {
                type: 'valueLiteral',
                name: 'string',
                value: '"DOMTextNode"',
                label: null,
                optional: false,
                _raw: null
            },
            optional: false,
            _raw: null
        }],
        brand: 'Object',
        open: false,
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : { nested: { nodeType: 3 } }', function t(assert) {
    var content = 'foo : {\n' +
        '    nested: {\n' +
        '        nodeType: 3\n' +
        '    }\n' +
        '}';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            key: 'nested',
            value: {
                type: 'object',
                keyValues: [{
                    type: 'keyValue',
                    key: 'nodeType',
                    value: {
                        type: 'valueLiteral',
                        name: 'number',
                        value: '3',
                        label: null,
                        optional: false,
                        _raw: null
                    },
                    optional: false,
                    _raw: null
                }],
                brand: 'Object',
                open: false,
                label: null,
                optional: false,
                _raw: null
            },
            optional: false,
            _raw: null
        }],
        brand: 'Object',
        open: false,
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : { bar?: Baz }', function t(assert) {
    var content = 'foo : { bar?: Baz }';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            key: 'bar',
            value: {
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
                builtin: false,
                optional: false,
                label: null,
                name: 'Baz',
                _raw: null
            },
            optional: true,
            _raw: null
        }],
        brand: 'Object',
        open: false,
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : { bar: Baz, ..R }', function t(assert) {
    var content = 'foo : { bar: Baz, ..R }';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        keyValues: [{
            type: 'keyValue',
            key: 'bar',
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 13
                    },
                    end: {
                        line: 1,
                        column: 16
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: false,
                optional: false,
                label: null,
                name: 'Baz',
                _raw: null
            },
            optional: false,
            _raw: null
        }],
        brand: 'Object',
        open: true,
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
