'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('optin should skip checking', {
    snippet: function m() {/*
        var foo = 4;

        4 + '';
    */},
    optin: true
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.optin, true);

    assert.end();
});

JSIGSnippet.test('optin should check with @jsig comment', {
    snippet: [
        '/* @jsig */',
        'var foo = 4;',
        '',
        '4 + "";'
    ].join('\n'),
    optin: true
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.optin, true);
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type,
        'jsig.sub-type.intersection-operator-call-mismatch');
    assert.equal(err.originalErrors.length, 2);
    assert.equal(err.expected,
        '(String, String) => String & (Number, Number) => Number');
    assert.equal(err.actual, '[Number, String]');
    assert.equal(err.operator, '+');
    assert.equal(err.line, 4);

    assert.end();
});
