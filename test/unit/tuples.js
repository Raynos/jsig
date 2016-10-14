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
            var val1 = str;
            var val2 = num;
            return [val1, val2];
        }

        var tuple = makeTuple('foo', 42);
        tuple[0] + 'bar';
        tuple[1] + 5;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('convert tuple to array', function m() {/*
    var foo = ["foo"];
    foo.push("bar");

    var isStr = "";
    isStr = foo[1];
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('cannot convert aliased tuple', function m() {/*
    var foo = ["foo"];
    var bar = foo;

    foo.pop();

    bar[0] + '5';
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 4);

    assert.end();
});

JSIGSnippet.test('cannot convert object-aliased tuple', function m() {/*
    var foo = ["foo"];
    var bar = {
        foo: ["bar"]
    };

    bar.foo = foo;

    foo.pop();

    bar.foo[0] + '5';
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 8);

    assert.end();
});

JSIGSnippet.test('cannot convert object-literal-aliased tuple', {
    snippet: function m() {/*
        var foo = ["foo"];
        var bar = {
            foo: foo
        };

        foo.pop();

        bar.foo[0] + '5';
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 6);

    assert.end();
});

JSIGSnippet.test('cannot convert tuple-literal-aliased tuple', {
    snippet: function m() {/*
        var foo = ["foo"];
        var bar = [foo];

        foo.pop();

        bar[0][0] + '5';
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 4);

    assert.end();
});

JSIGSnippet.test('cannot convert array-literal-aliased tuple', {
    snippet: function m() {/*
        var foo = ["foo"];
        var bar = [foo];

        foo.pop();

        bar[0][0] + '5';
    */},
    header: function h() {/*
        bar : Array<[String]>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 4);

    assert.end();
});

JSIGSnippet.test('cannot convert explicit-tuple-literal-aliased tuple', {
    snippet: function m() {/*
        var foo = ["foo"];
        var bar = [foo];

        foo.pop();

        bar[0][0] + '5';
    */},
    header: function h() {/*
        bar : [[String]]
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 4);

    assert.end();
});

JSIGSnippet.test('cannot convert object-field tuple', {
    snippet: function m() {/*
        var foo = {
            bar: ['baz']
        };

        foo.bar.pop();

        foo.bar[0] + '5';
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 5);

    assert.end();
});

JSIGSnippet.test('cannot convert function-call-aliased tuple', {
    snippet: function m() {/*
        var foo = ['bar'];

        doSomething(foo);

        foo.pop();
    */},
    header: function h() {/*
        doSomething : ([String]) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 5);

    assert.end();
});

JSIGSnippet.test('cannot convert explicitely typed tuple', {
    snippet: function m() {/*
        var foo = ['bar'];

        foo.pop();
    */},
    header: function h() {/*
        foo: [String]
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('cannot convert function return typed tuple', {
    snippet: function m() {/*
        var bar = foo();

        bar.pop();
    */},
    header: function h() {/*
        foo: () => [String]
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('can convert return inferred tuple', {
    snippet: function m() {/*
        function foo() {
            return ["bar"];
        }

        var bar = foo();

        bar.pop();
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('can assign tuple to array', {
    snippet: function m() {/*
        var bar = ['foo'];
    */},
    header: function h() {/*
        bar : Array<String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('can assign tuple to array union', {
    snippet: function m() {/*
        var bar = ['foo'];
    */},
    header: function h() {/*
        bar : Array<String> | Number
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('cannot convert re-typed var tuple', {
    snippet: function m() {/*
        var bar = ['foo'];
        bar = foo();

        bar.pop();
    */},
    header: function h() {/*
        foo: () => [String]
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'pop');
    assert.equal(err.nonObjectType, '[String]');
    assert.equal(err.line, 4);

    assert.end();
});

JSIGSnippet.test('conditional tuples', {
    snippet: function m() {/*
        function makeTuple(source) {
            var tuple = null;

            if (source) {
                var json = JSON.parse(source);
                tuple = [null, json];
            } else {
                tuple = [new Error('no source'), null];
            }

            return tuple;
        }

        var tuple = makeTuple('foo');
        if (tuple[1]) {
            var maybeJson = tuple[1];
            if (typeof maybeJson === 'string') {
                maybeJson + 'foo';
            }
        }

        if (tuple[0]) {
            tuple[0].message;
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);
    // console.log('first', meta.errors[0]);

    assert.end();
});
