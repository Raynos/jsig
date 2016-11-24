'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('NestedArray generic alias', {
    snippet: function m() {/*
        typeof a;
    */},
    header: function h() {/*
        type GenericArray<T> : Array<Array<T>>

        a : GenericArray<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType, 'Array<Array<String>>');

    assert.end();
});

JSIGSnippet.test('Callback generic alias', {
    snippet: function m() {/*
        typeof a;
    */},
    header: function h() {/*
        type Callback<T> :
            ((err: Error, value?: T) => void) &
            ((err: null, value: T) => void)

        a : Callback<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType,
        '(err: Error, value?: String) => void &\n' +
        '    (err: null, value: String) => void'
    );

    assert.end();
});

JSIGSnippet.test('Dictionary generic alias', {
    snippet: function m() {/*
        typeof a;
    */},
    header: function h() {/*
        type Dictonary<T> : Object<String, T>

        a : Dictonary<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType, 'Object<String, String>');

    assert.end();
});

JSIGSnippet.test('Dictionary generic alias with interface', {
    snippet: function m() {/*
        typeof a;
    */},
    header: function h() {/*
        type Dictonary<T> : Object<String, T>

        interface Foo {
            uuid: String
        }

        a : Dictonary<Foo>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType, 'Object<String, { uuid: String }>');

    assert.end();
});

JSIGSnippet.test('AsyncResultObjectCallback generic alias', {
    snippet: function m() {/*
        typeof a;
    */},
    header: function h() {/*
        type Dictonary<T> : Object<String, T>
        type AsyncResultObjectCallback<T> :
            (err: Error, results: Dictonary<T>) => void

        a : AsyncResultObjectCallback<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType,
        '(err: Error, results: Object<String, String>) => void');

    assert.end();
});
