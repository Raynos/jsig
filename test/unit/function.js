'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('untyped function declaration', {
    snippet: function m() {/*
        function foo(a) {
            return a + 2;
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.untyped-function-found');
    assert.equal(err1.funcName, 'foo');
    assert.equal(err1.line, 1);

    assert.end();
});

JSIGSnippet.test('function declaration when object expected', {
    snippet: function m() {/*
        function foo(a) {
            return a + 2;
        }
    */},
    header: function h() {/*
        foo : { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.found-unexpected-function');
    assert.equal(err1.funcName, 'foo');
    assert.equal(err1.expected, '{ a: String }');
    assert.equal(err1.actual, 'Function');
    assert.equal(err1.line, 1);

    assert.end();
});
