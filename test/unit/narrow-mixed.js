'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('narrowing mixed into a number', {
    snippet: function m() {/*
        function parseJSONNumber(str) {
            var x = JSON.parse(str);

            if (typeof x === 'number') {
                return x;
            }

            return null;
        }
    */},
    header: function h() {/*
        parseJSONNumber : (String) => Number | null
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
