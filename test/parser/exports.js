'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('export default String', function t(assert) {
    var content = 'export default String';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'defaultExport');
    assert.deepEqual(result.typeExpression, {
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
        name: 'String',
        builtin: true,
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
            isMethod: false,
            _raw: null,
            key: 'a',
            optional: false,
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 20
                    },
                    end: {
                        line: 1,
                        column: 26
                    }
                },
                concreteValue: null,
                isGeneric: false,
                name: 'String',
                builtin: true,
                _raw: null
            }
        }],
        open: false,
        _raw: null
    });

    assert.end();
});
