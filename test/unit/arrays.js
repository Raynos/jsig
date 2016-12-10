'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('arrays can only push same type', function m() {/*
    var foo = ["foo"];

    foo.push("bar");
    foo.push(42);
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 2);
    var err = meta.errors[0];

    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 4);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.cannot-call-generic-function');
    assert.equal(err2.funcName, 'foo.push');
    assert.equal(err2.actual, '[this: Array<String>, Number]');
    assert.equal(err2.expected, '(this: Array<T>, value: T) => Number');
    assert.equal(err2.line, 4);

    assert.end();
});

JSIGSnippet.test('array methods have required arguments', function m() {/*
    var foo = ["foo"];

    foo.push();
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.cannot-call-generic-function');
    assert.equal(err.funcName, 'foo.push');
    assert.equal(err.actual, '[this: Array<String>]');
    assert.equal(err.expected, '(this: Array<T>, value: T) => Number');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('Array lazy-bound on method usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            arr.push({ foo: 'bar' });
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on return usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on assignment usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            arr[0] = { foo: 'bar' };
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on call usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            filterFoo(arr);
            return arr;
        }
    */},
    header: function h() {/*
        filterFoo : (Array<{ foo: String }>) => void

        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on call usage from union', {
    snippet: function m() {/*
        function foo() {
            var arr = bar || [];

            filterFoo(arr);
            return arr;
        }
    */},
    header: function h() {/*
        bar : Array<{ foo: String }> | null

        filterFoo : (Array<{ foo: String }>) => void

        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('filtering an array', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.filter(function alwaysTrue(a) {
            return true;
        });
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test.skip('filtering an array badly', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.filter(function alwaysTrue(a) {
            a.foo;
        });
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
