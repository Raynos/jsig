'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('accessing fields in tuple', {
    snippet: function m() {/*
        var tuple = [12, 'foo'];

        tuple[0] + 5;
        tuple[1] + 'bar';
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('accessing out of bounds tuple', {
    snippet: function m() {/*
        var tuple = [12, 'foo'];

        tuple[2];
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.actual, '[Number, String]');
    assert.equal(err1.index, 2);
    assert.equal(err1.actualLength, 2);
    assert.equal(err1.line, 3);

    assert.end();
});

JSIGSnippet.test('accessing out of bounds tuple (negative)', {
    snippet: function m() {/*
        var tuple = [12, 'foo'];

        tuple[-1];
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.actual, '[Number, String]');
    assert.equal(err1.index, -1);
    assert.equal(err1.actualLength, 2);
    assert.equal(err1.line, 3);

    assert.end();
});

JSIGSnippet.test('dynamic access of tuple field', {
    snippet: function m() {/*
        var tuple = [12, 'foo'];

        var i = 0;
        tuple[i];
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.actual, '[Number, String]');
    assert.equal(err1.identifier, 'i');
    assert.equal(err1.line, 4);

    assert.end();
});

JSIGSnippet.test('accessing without numeric index', {
    snippet: function m() {/*
        var tuple = [12, 'foo'];

        tuple["foo"];
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.actual, 'String');
    assert.equal(err1.expected, 'Number');
    assert.equal(err1.tupleValue, '[Number, String]');
    assert.equal(err1.line, 3);

    assert.end();
});

