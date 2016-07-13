'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow empty object for optional fields', {
    snippet: function m() {/*
        foo({});

        function foo(opts) {
            return opts.bar || '';
        }
    */},
    header: function h() {/*
        foo : ({ bar?: String }) => String
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('can pass extra fields to object', {
    snippet: function m() {/*
        foo({ bar: '', baz: '' });

        function foo(opts) {
            return opts.bar;
        }
    */},
    header: function h() {/*
        foo : ({ bar: String }) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);
    assert.end();
});

JSIGSnippet.test('can pass object with optional fields', {
    snippet: function m() {/*
        foo({ bar: '', baz: '' });

        function foo(opts) {
            return opts.bar;
        }
    */},
    header: function h() {/*
        foo : ({ bar: String, baz?: String }) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('can pass object without optional fields', {
    snippet: function m() {/*
        foo({ bar: '' });

        function foo(opts) {
            return opts.bar;
        }
    */},
    header: function h() {/*
        foo : ({ bar: String, baz?: String }) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('can pass extra fields outside signature', {
    snippet: function m() {/*
        foo({ bar: '', foo: '' });

        function foo(opts) {
            return opts.bar;
        }
    */},
    header: function h() {/*
        foo : ({ bar: String, baz?: String }) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 0);
    assert.end();
});
