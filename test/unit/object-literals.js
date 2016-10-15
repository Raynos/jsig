'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('assigning with concrete string fields', {
    snippet: function m() {/*
        a = {
            foo: "bar",
            baz: "something"
        };
    */},
    header: function h() {/*
        a : { foo: "bar", baz: String }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
