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

JSIGSnippet.test('cannot pass extra fields to object', {
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
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.unexpected-field-count');
    assert.equal(err.actual, '{\n    bar: String,\n    baz: String\n}');
    assert.equal(err.expected, '{ bar: String }');
    assert.equal(err.actualFields, 2);
    assert.equal(err.expectedFields, 1);
    assert.equal(err.line, 1);

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

JSIGSnippet.test('cannot pass extra fields outside signature', {
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
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.unexpected-extra-field');
    assert.equal(err.actual, '{\n    bar: String,\n    foo: String\n}');
    assert.equal(err.expected, '{\n    bar: String,\n    baz?: String\n}');
    assert.equal(err.fieldName, 'foo');
    assert.equal(err.line, 1);

    assert.end();
});
