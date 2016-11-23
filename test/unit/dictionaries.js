'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('looking up dictionary field with static key', {
    snippet: function m() {/*
        var firstValue = o["foo"];
        var secondValue = o.foo;

        firstValue + secondValue;
    */},
    header: function h() {/*
        o : Object<String, String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('typed dictionary variable', {
    snippet: [
        'var dict/*:Object<String,String>*/ = Object.create(null);',
        '',
        'dict["foo"] + "bar"',
        'typeof dict["foo"]'
    ].join('\n')
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    assert.equal(meta.errors[0].expr, 'dict["foo"]');
    assert.equal(meta.errors[0].valueType, 'String');

    assert.end();
});

JSIGSnippet.test('typed dictionary variable with aliases', {
    snippet: [
        'var dict/*:Dictionary<Foo>*/ = Object.create(null);',
        '',
        'dict["foo"].a + "bar"',
        'typeof dict["foo"]'
    ].join('\n'),
    header: function h() {/*
        type Dictionary<T> : Object<String, T>

        interface Foo {
            a: String
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    assert.equal(meta.errors[0].expr, 'dict["foo"]');
    assert.equal(meta.errors[0].valueType, '{ a: String }');

    assert.end();
});
