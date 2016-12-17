'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('NestedArray generic alias', {
    snippet: function m() {/*
        typeof a;

        typeof a[0][0];
    */},
    header: function h() {/*
        type GenericArray<T> : Array<Array<T>>

        a : GenericArray<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 2);
    assert.equal(meta.errors[0].valueType, 'GenericArray<String>');
    assert.equal(meta.errors[1].valueType, 'String');

    assert.end();
});

JSIGSnippet.test('Callback generic alias', {
    snippet: function m() {/*
        a(null, 'bar');
        a(new Error('foo'));

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
    assert.equal(meta.errors[0].valueType, 'Callback<String>');

    assert.end();
});

JSIGSnippet.test('Dictionary generic alias', {
    snippet: function m() {/*
        typeof a;

        typeof a['foo'];
    */},
    header: function h() {/*
        type Dictonary<T> : Object<String, T>

        a : Dictonary<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 2);
    assert.equal(meta.errors[0].valueType, 'Dictonary<String>');
    assert.equal(meta.errors[1].valueType, 'String');

    assert.end();
});

JSIGSnippet.test('Dictionary generic alias with interface', {
    snippet: function m() {/*
        typeof a;
        typeof a['foo'];
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

    assert.equal(meta.errors.length, 2);
    assert.equal(meta.errors[0].valueType, 'Dictonary<{ uuid: String }>');
    assert.equal(meta.errors[1].valueType, '{ uuid: String }');

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
        'AsyncResultObjectCallback<String>');

    assert.end();
});

JSIGSnippet.test('Twin generic alias', {
    snippet: function m() {/*
        a[0]['foo'] + '5';
        a[1]['bar'] + '4';

        typeof a;
    */},
    header: function h() {/*
        type Dictionary<T> : Object<String, T>
        type Twin<T> : [Dictionary<T>, Dictionary<T>]

        a : Twin<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType,
        'Twin<String>');

    assert.end();
});

JSIGSnippet.test('Double generic alias', {
    snippet: function m() {/*
        a[0]['foo'] + '5';
        a[1]['bar'] + 4;

        typeof a;
    */},
    header: function h() {/*
        type Dictionary<T> : Object<String, T>
        type Double<T, S> : [Dictionary<T>, Dictionary<S>]

        a : Double<String, Number>
        b : Double<Number, String>
        c : Double<Boolean, Boolean>
        d : Dictionary<{ foo: String }>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType,
        'Double<String, Number>');

    assert.end();
});

JSIGSnippet.test('AsyncResultIterator generic alias', {
    snippet: function m() {/*
        a('foo', function iWantsIt(e, v) {
            e.message;

            v.a + '4';
            v.b + 5;
        });

        typeof a;
    */},
    header: function h() {/*
        type AsyncResultCallback<T, E> : (err: E, item: T) => void
        type AsyncResultIterator<T, R, E> :
            (item: T, callback: AsyncResultCallback<R, E>) => void

        type Foo : {
            a: String,
            b: Number
        }

        a : AsyncResultIterator<String, Foo, Error>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);
    assert.equal(meta.errors[0].valueType,
        'AsyncResultIterator<String, {\n' +
        '    a: String,\n' +
        '    b: Number\n' +
        '}, {\n' +
        '    message: String,\n' +
        '    stack: String,\n' +
        '    name: String\n' +
        '}>');

    assert.end();
});

JSIGSnippet.test('LinkedList<T> generic alias', {
    snippet: function m() {/*
        typeof a.next;
        typeof a.value;

        var next = a.next;
        if (next) {
            typeof next.value;

            if (next.next) {
                typeof next.next.value;
            }
        }
    */},
    header: function h() {/*
        type LinkedList<T> : {
            value: T,
            next: LinkedList<T> | null
        }

        a : LinkedList<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 4);
    assert.equal(meta.errors[0].valueType, 'LinkedList<T> | null');
    assert.equal(meta.errors[1].valueType, 'String');
    assert.equal(meta.errors[2].valueType, 'String');
    assert.equal(meta.errors[3].valueType, 'String');

    assert.end();
});
