'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('error message for nested fields', {
    snippet: function m() {/*
        var resp = {
            statusCode: 200,
            body: {
                messageType: 'OK',
                timestamp: 'wat'
            }
        }

        fn(resp);
    */},
    header: function h() {/*
        fn : (resp: {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: Number
            }
        }) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, '{ body: { timestamp: Number } }');
    assert.equal(err.actual, '{ body: { timestamp: String } }');
    assert.equal(err.line, 9);

    assert.end();
});

JSIGSnippet.test('error message for nested function return', {
    snippet: function m() {/*
        fn1 = fn2;
    */},
    header: function h() {/*
        fn1 : () => {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: Number
            }
        }

        fn2 : () => {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: String
            }
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, '(...) => { body: { timestamp: Number } }');
    assert.equal(err.actual, '(...) => { body: { timestamp: String } }');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('error message for nested function this type', {
    snippet: function m() {/*
        fn1 = fn2;
    */},
    header: function h() {/*
        fn1 : (this: {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: Number
            }
        }) => void

        fn2 : (this: {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: String
            }
        }) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected,
        '(this: { body: { timestamp: Number } }, ...) => _');
    assert.equal(err.actual,
        '(this: { body: { timestamp: String } }, ...) => _');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('error message for nested intersections', {
    snippet: function m() {/*
        x = y;
    */},
    header: function h() {/*
        x : (() => void) & {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: Number
            }
        }

        y : (() => void) & {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp: String
            }
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, '_ & { body: { timestamp: Number } }');
    assert.equal(err.actual, '_ & { body: { timestamp: String } }');
    assert.equal(err.line, 1);

    assert.end();
});
