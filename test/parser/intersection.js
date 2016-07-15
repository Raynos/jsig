'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : Bar & Baz', function t(assert) {
    var content = 'foo : Bar & Baz';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'intersectionType',
        intersections: [{
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 6
                },
                end: {
                    line: 1,
                    column: 9
                }
            },
            concreteValue: null,
            isGeneric: false,
            name: 'Bar',
            builtin: false,
            optional: false,
            label: null,
            _raw: null
        }, {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 12
                },
                end: {
                    line: 1,
                    column: 15
                }
            },
            concreteValue: null,
            isGeneric: false,
            name: 'Baz',
            builtin: false,
            optional: false,
            label: null,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
