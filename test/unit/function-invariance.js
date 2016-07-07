'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('function invariant for optional params', {
    snippet: function m() {/*
        var foo;

        foo = watwat;
        foo(undefined);

        function watwat(baz) {
            return baz.toString();
        }
    */},
    header: function h() {/*
        foo : (baz?: String) => String

        watwat : (baz: String) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'baz?: String');
    assert.equal(err.actual, 'baz: String');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('function invariant for union params', {
    snippet: function m() {/*
        var foo;

        foo = watwat;
        foo(null);

        function watwat(baz) {
            return baz.toString();
        }
    */},
    header: function h() {/*
        foo : (baz: String | null) => String

        watwat : (baz: String) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'baz: String | null');
    assert.equal(err.actual, 'baz: String');
    assert.equal(err.line, 3);

    assert.end();
});
