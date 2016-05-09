'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('correctly infer function type', function m() {/*
    var foo = "";

    foo = bar("");

    function bar(x) {
        return x;
    }
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('infer function type error', function m() {/*
    var foo = "";

    foo = bar(4);

    function bar(x) {
        return x;
    }
*/}, function t(snippet, assert) {
    var meta = snippet.compile();
    var errors = meta.errors;

    assert.equal(errors.length, 3);

    assert.equal(errors[0].type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(errors[0].expected, 'String');
    assert.equal(errors[0].actual, 'Number');
    assert.equal(errors[0].line, 6);

    assert.equal(errors[1].type, 'jsig.verify.untyped-function-call');
    assert.equal(errors[1].funcName, 'bar');
    assert.equal(errors[1].callExpression, 'bar');
    assert.equal(errors[1].line, 3);

    assert.equal(errors[2].type, 'jsig.verify.untyped-function-found');
    assert.equal(errors[2].funcName, 'bar');
    assert.equal(errors[2].line, 5);

    assert.end();
});

JSIGSnippet.test('infer func type through assignment', function m() {/*
    var foo = "";

    foo = toFixed(genNum());

    function genNum() {
        return 5;
    }

    function toFixed(n) {
        return n.toFixed(2);
    }
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('infer func type through return', function m() {/*
    var foo = "";

    foo = f();

    function f() {
        return toFixed(genNum());
    }

    function genNum() {
        return 5;
    }

    function toFixed(n) {
        return n.toFixed(2);
    }
*/}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
