'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('creating a new array instance', {
    snippet: function m() {/*
        var arr = new Array(5);

        arr.push('hi');
        arr[0].split(',');
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('assigning a new array instance', {
    snippet: function m() {/*
        var arr = new Array(5);

        arr.push('hi');
        arr[0].split(',');
    */},
    header: function h() {/*
        arr: Array<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('creating a new date instance', {
    snippet: function m() {/*
        var date = new Date();

        date.getTime().toFixed();
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('assigning string literal types', {
    snippet: function m() {/*
        t.t = 'foo';
        t.t = 'bar';
    */},
    header: function h() {/*
        t : { t: "foo" }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    var error = meta.errors[0];

    assert.equal(error.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(error.expected, '"foo"');
    assert.equal(error.actual, '"bar"');
    assert.equal(error.line, 2);

    assert.end();
});

JSIGSnippet.test('assigning string literal union types', {
    snippet: function m() {/*
        t = 'foo';
        t = 'bar';
        t = 'baz';
    */},
    header: function h() {/*
        t : "foo" | "bar"
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    var error = meta.errors[0];

    assert.equal(error.type, 'jsig.sub-type.union-type-class-mismatch');
    assert.equal(error.expected, '"foo" | "bar"');
    assert.equal(error.actual, 'String');
    assert.equal(error.line, 3);

    assert.end();
});

JSIGSnippet.test('Assign string literal to string', {
    snippet: function m() {/*
        var s = '';
        s = o.type;
    */},
    header: function h() {/*
        o : { type: "foo" }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});
