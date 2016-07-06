'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('function overloading works', {
    snippet: function m() {/*
        foo('').split('');
        foo(2).split('');
        foo(2) + 4;
        foo('') + 4;
        foo({}) + 4;

        function foo(x) {
            return x;
        }
    */},
    header: function h() {/*
        foo : ((String) => String) &
            ((Number) => Number)
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.non-existant-field');
    assert.equal(err1.fieldName, 'split');
    assert.equal(err1.objName, 'foo(2)');
    assert.equal(err1.expected, '{ split: T }');
    assert.equal(err1.actual, 'Number');
    assert.equal(err1.line, 2);

    var err2 = meta.errors[1];
    assert.equal(err2.type,
        'jsig.sub-type.intersection-operator-call-mismatch');
    assert.equal(err2.expected,
        '(String, String) => String & (Number, Number) => Number');
    assert.equal(err2.actual, '[String, Number]');
    assert.equal(err2.operator, '+');
    assert.equal(err2.line, 4);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.function-overload-call-mismatch');
    assert.equal(err3.expected, '(String) => String & (Number) => Number');
    assert.equal(err3.actual, '[{}]');
    assert.equal(err3.funcName, 'foo');
    assert.equal(err3.line, 5);

    assert.end();
});
