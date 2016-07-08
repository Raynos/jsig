'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('export default String', function t(assert) {
    var content = 'export default String';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'defaultExport');
    assert.deepEqual(result.typeExpression, {
        type: 'typeLiteral',
        concreteValue: null,
        isGeneric: false,
        name: 'String',
        builtin: true,
        optional: false,
        label: null,
        _raw: null
    });

    assert.end();
});

test('export default { a: String }', function t(assert) {
    var content = 'export default { a: String }';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'defaultExport');
    assert.deepEqual(result.typeExpression, {
        type: 'object',
        brand: 'Object',
        keyValues: [{
            type: 'keyValue',
            _raw: null,
            key: 'a',
            optional: false,
            value: {
                type: 'typeLiteral',
                concreteValue: null,
                isGeneric: false,
                name: 'String',
                builtin: true,
                optional: false,
                label: null,
                _raw: null
            }
        }],
        label: null,
        open: false,
        optional: false,
        _raw: null
    });

    assert.end();
});
