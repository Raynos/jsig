'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow untyped arrays', function m() {/*
    var foo = ["foo"];
    foo.push("bar");

    var isStr = "";
    isStr = foo[0];
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('generics disallow multiple types', function m() {/*
    var foo = [];

    foo.push("bar");
    foo.push(4)
*/}, function t(snippet, assert) {
    var meta = snippet.compile();
    assert.equal(meta.errors.length, 2, 'expected two error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 4);
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.cannot-call-generic-function');
    assert.equal(err2.funcName, 'foo.push');
    assert.equal(err2.actual, '[this: Array<String>, Number]');
    assert.equal(err2.expected, '<T>(this: Array<T>, value: T) => Number');
    assert.equal(err2.line, 4);

    assert.end();
});

JSIGSnippet.test('generics support unions on read', function m() {/*
    var foo = [];

    foo.push("" || null);

    foo[0].split(',');
*/}, function t(snippet, assert) {
    var meta = snippet.compile();
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.line, 5);
    assert.equal(err.fieldName, 'split');
    assert.equal(err.nonObjectType, 'null');

    assert.end();
});

JSIGSnippet.test('generics support unions on write', function m() {/*
    var foo = ["" || null];

    foo.push("bar");
    foo.push(null);
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('disallow writing supertypes into generics', function m() {/*
    var foo = [""];

    foo.push("" || null);
*/}, function t(snippet, assert) {
    var meta = snippet.compile();
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 3);
    assert.equal(err.expected, 'Array<String | null>');
    assert.equal(err.actual, 'Array<String>');

    assert.end();
});

JSIGSnippet.test.skip('alias an empty array and mutate it twice', {
    snippet: function m() {/*
        var foo = [];
        var bar = foo;

        foo.push("");
        bar.push(null);

        foo[1].toString();
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    assert.end();
});

JSIGSnippet.test('identity generic function', {
    snippet: function m() {/*
        var s = id('s');
        s + 'bar';

        var o = id({ foo: 'bar' });
        o.foo + 'bar';
    */},
    header: function h() {/*
        id : <T>(T) => T
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0, 'expected no errors');

    assert.end();
});

JSIGSnippet.test('union generic function', {
    snippet: function m() {/*
        var s = union('s', 2);
        typeof s;

        var o = union({ foo: 'bar' }, { baz: 'wat' });
        typeof o;
    */},
    header: function h() {/*
        union : <S, T>(S, T) => S | T
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2, 'expected two errors');

    assert.equal(meta.typeofErrors[0].valueType, 'String | Number');
    assert.equal(meta.typeofErrors[1].valueType,
        '{ foo: String } | { baz: String }');

    assert.end();
});

JSIGSnippet.test('intersection generic function', {
    snippet: function m() {/*
        var o = intersect({ foo: 'bar' }, { baz: 'wat' });
        typeof o;

        o.foo + 'wat';
        o.baz + 'wat';
    */},
    header: function h() {/*
        intersect : <S, T>(S, T) => S & T
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 1, 'expected two errors');

    assert.equal(meta.typeofErrors[0].valueType,
        '{ foo: String } & { baz: String }');

    assert.end();
});

JSIGSnippet.test('generic constructors', {
    snippet: function m() {/*
        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;
        }

        var b = new BatchClient("foo", 42);
        b.channel + "x";
        b.hosts + 50;
    */},
    header: function h() {/*
        type IBatchClient<T1, S1> : {
            channel: T1,
            hosts: S1
        }

        BatchClient : <T2, S2>(
            this: IBatchClient<T2, S2>, T2, S2
        ) => void
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('generic constructors with a string', {
    snippet: function m() {/*
        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = String(10);
        }

        var b = new BatchClient("foo", 42);
        b.channel + "x";
        b.hosts + 50;
    */},
    header: function h() {/*
        type IBatchClient<T1, S1> : {
            channel: T1,
            hosts: S1,
            value: String
        }

        BatchClient : <T2, S2>(
            this: IBatchClient<T2, S2>, T2, S2
        ) => void
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});
