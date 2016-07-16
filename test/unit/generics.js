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
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.line, 4);
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'String');

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
    assert.equal(err.type, 'jsig.verify.accessing-field-on-union');
    assert.equal(err.line, 5);
    assert.equal(err.fieldName, 'split');
    assert.equal(err.unionType, 'String | null');

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
