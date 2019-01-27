'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('arrays can only push same type', function m() {/*
    var foo = ["foo"];

    foo.push("bar");
    foo.push(42);
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 2);
    var err = meta.errors[0];

    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 4);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.cannot-call-generic-function');
    assert.equal(err2.funcName, 'foo.push');
    assert.equal(err2.actual, '[this: Array<String>, Number]');
    assert.equal(err2.expected, '<T>(this: Array<T>, value: T) => Number');
    assert.equal(err2.line, 4);

    assert.end();
});

JSIGSnippet.test('array methods have required arguments', function m() {/*
    var foo = ["foo"];

    foo.push();
*/}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.too-few-args-in-call');
    assert.equal(err.funcName, 'foo.push');
    assert.equal(err.actualArgs, 0);
    assert.equal(err.expectedArgs, 1);
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('Array lazy-bound on method usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            arr.push({ foo: 'bar' });
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on return usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on assignment usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            arr[0] = { foo: 'bar' };
            return arr;
        }
    */},
    header: function h() {/*
        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on call usage', {
    snippet: function m() {/*
        function foo() {
            var arr = [];

            filterFoo(arr);
            return arr;
        }
    */},
    header: function h() {/*
        filterFoo : (Array<{ foo: String }>) => void

        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('Array lazy-bound on call usage from union', {
    snippet: function m() {/*
        function foo() {
            var arr = bar || [];

            filterFoo(arr);
            return arr;
        }
    */},
    header: function h() {/*
        bar : Array<{ foo: String }> | null

        filterFoo : (Array<{ foo: String }>) => void

        foo : () => Array<{ foo: String }>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('filtering an array', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.filter(function alwaysTrue(a) {
            return true;
        });
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('filtering an array badly', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.filter(function doStuff(a) {
            a.foo;
        });
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 2);

    assert.equal(meta.errors[0].type, 'jsig.verify.non-existant-field');
    assert.equal(meta.errors[0].fieldName, 'foo');
    assert.equal(meta.errors[0].objName, 'a');
    assert.equal(meta.errors[0].line, 4);
    assert.equal(meta.errors[0].expected, '{ foo: T }');

    assert.equal(meta.errors[1].type, 'jsig.verify.missing-return-statement');
    assert.equal(meta.errors[1].expected, 'Boolean');
    assert.equal(meta.errors[1].actual, 'void');
    assert.equal(meta.errors[1].funcName, '(expression @ 3 : 27) doStuff');
    assert.equal(meta.errors[1].line, 3);

    assert.end();
});

JSIGSnippet.test('checking an array', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.every(function alwaysTrue(a) {
            return true;
        });

        z = false;
        z = true;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('use array.some()', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var z = arr.some(function alwaysTrue(a) {
            return true;
        });

        z = false;
        z = true;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('use array.forEach()', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        arr.forEach(function doStuff(a) {
            a + '';
        });
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('use array.map()', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var other = arr.map(function returnNum(a) {
            return 4;
        });

        other[0] + 6;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('use array.reduce()', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var other = arr.reduce(function add(a, b) {
            return a + b;
        }, '');

        other + '';
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('use array.reduceRight()', {
    snippet: function m() {/*
        var arr = ['foo', 'bar'];

        var other = arr.reduceRight(function add(a, b) {
            return a + b;
        }, '');

        other + '';
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
