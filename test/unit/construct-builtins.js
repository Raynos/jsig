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
