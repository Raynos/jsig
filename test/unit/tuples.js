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

JSIGSnippet.test('function inference for tuple', {
    snippet: function m() {/*
        function makeTuple(str, num) {
            return [str, num];
        }

        var tuple = makeTuple('foo', 42);
        tuple[0] + 'bar';
        tuple[1] + 5;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('passing a tuple to a function', {
    snippet: function m() {/*
        function makeTuple(str, num) {
            return [str, num];
        }

        function getFirst(tuple) {
            return tuple[0];
        }

        var tuple = makeTuple('foo', 42);
        getFirst(tuple) + 'bar';
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('Explicit tuple functions', {
    snippet: function m() {/*
        function makeTuple1(str, num) {
            return [str, num];
        }
        function makeTuple2(num, str) {
            return [num, str];
        }

        function getFirst(tuple) {
            return tuple[0];
        }

        var tuple1 = makeTuple1('foo', 42);
        var tuple2 = makeTuple2(42, 'foo');

        getFirst(tuple1) + 'bar';
        getFirst(tuple2) + 10;
    */},
    header: function h() {/*
        getFirst : <T, S>(tuple: [T, S]) => T
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('Explicit tuple functions 2', {
    snippet: function m() {/*
        function makeTuple1(str, num) {
            return [str, num];
        }
        function makeTuple2(num, str) {
            return [num, str];
        }

        function getSecond(tuple) {
            return tuple[1];
        }

        var tuple1 = makeTuple1('foo', 42);
        var tuple2 = makeTuple2(42, 'foo');

        getSecond(tuple1) + 10;
        getSecond(tuple2) + 'bar';
    */},
    header: function h() {/*
        getSecond : <T, S>(tuple: [T, S]) => S
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('delayed function inference for tuple', {
    snippet: function m() {/*
        function makeTuple(str, num) {
            var tuple = [null, null];
            tuple[0] = str;
            tuple[1] = num;
            return tuple;
        }

        var tuple = makeTuple('foo', 42);
        tuple[0] + 'bar';
        tuple[1] + 5;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});
