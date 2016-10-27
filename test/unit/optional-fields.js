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
    assert.equal(err.type, 'jsig.sub-type.unexpected-extra-field');
    assert.equal(err.actual, '{\n    bar: String,\n    baz: String\n}');
    assert.equal(err.expected, '{ bar: String }');
    assert.equal(err.fieldName, 'baz');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('cannot pass extra fields to object via alias', {
    snippet: function m() {/*
        var opts = { bar: '', baz: '' };
        foo(opts);

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
    assert.equal(err.type, 'jsig.sub-type.unexpected-extra-field');
    assert.equal(err.actual, '{\n    bar: String,\n    baz: String\n}');
    assert.equal(err.expected, '{ bar: String }');
    assert.equal(err.fieldName, 'baz');
    assert.equal(err.line, 2);

    assert.end();
});

JSIGSnippet.test('can pass extra fields if well-typed', {
    snippet: function m() {/*
        var opts = { bar: '', baz: '' };
        foo(opts);

        function foo(opts) {
            return opts.bar;
        }
    */},
    header: function h() {/*
        opts : { bar: String, baz: String }

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

JSIGSnippet.test('options or default pattern', {
    snippet: function m() {/*
        function Foo(opts) {
            opts = opts || {};

            this.bar = opts.bar || '';
        }

        new Foo();
        new Foo({});
        new Foo({
            bar: 'baz'
        });
    */},
    header: function h() {/*
        type Foo : {
            bar: String
        }

        Foo : (this: Foo, opts?: { bar?: String }) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('cannot pass extra properties for empty object', {
    snippet: function m() {/*
        foo({
            "foo": "bar"
        });
    */},
    header: function h() {/*
        foo : ({}) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.unexpected-extra-field');
    assert.equal(err.actual, '{ foo: String }');
    assert.equal(err.expected, '{}');
    assert.equal(err.fieldName, 'foo');

    assert.end();
});

JSIGSnippet.test('cannot pass extra func properties for empty object', {
    snippet: [
        '/*',
        '    @jsig',
        '    allowUnusedFunction: true',
        '*/',
        '',
        'foo({',
        '    foo: function foo() {}',
        '})'
    ].join('\n'),
    header: function h() {/*
        foo : ({}) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.untyped-function-expr-found');
    assert.equal(err.funcName, 'foo');
    assert.equal(err.line, 7);

    assert.end();
});
