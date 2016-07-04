'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test.skip('correctly infer function type', {
    snippet: function m() {/*
        foo('').split();
        foo(2) + 4;

        function foo(x) {
            return x;
        }
    */},
    header: function h() {/*
        foo : ((String) => String) &
            ((Number) => Number)
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
