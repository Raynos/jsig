'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow empty object for optional fields', {
    snippet: function m() {/*
        foo({});

        function foo(opts) {
            return opts.bar || '';
        }
    */},
    header: function h() {/*
        foo : ({ bar?: String }) => String
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
