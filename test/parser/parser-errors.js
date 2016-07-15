'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('bad identifier', function t(assert) {
    var content = 'foo-baz~bar-boz : Number';

    assert.throws(function throwIt() {
        parse(content);
    }, /expected ':' at line 1 column 8, got '...~bar-boz/);

    assert.end();
});

test('bad identifier with cb', function t(assert) {
    var content = 'foo-baz~bar-boz : Number';

    parse(content, onError);

    function onError(err) {
        assert.ok(err);
        assert.equal(err.message,
            'expected \':\' at line 1 column 8, ' +
            'got \'...~bar-boz : N...\''
        );

        assert.end();
    }
});

test('good identifier callbak', function t(assert) {
    var content = 'foo : String';
    parse(content, onResult);

    function onResult(err, tree) {
        assert.ifError(err);

        var result = tree.statements[0];

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
            builtin: true,
            label: null,
            optional: false,
            name: 'String',
            _raw: null
        });

        assert.end();
    }
});
