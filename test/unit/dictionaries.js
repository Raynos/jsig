'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('looking up dictionary field with static key', {
    snippet: function m() {/*
        var firstValue = o["foo"];
        var secondValue = o.foo;

        firstValue + secondValue;
    */},
    header: function h() {/*
        o : Object<String, String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
