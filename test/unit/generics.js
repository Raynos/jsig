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
    // var meta = snippet.compile();
    // console.log('e', meta.errors);
    assert.end();
});
