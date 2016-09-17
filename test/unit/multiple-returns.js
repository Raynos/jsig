'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('function with multiple returns', {
    snippet: function m() {/*
        function foo(x) {
            if (x) {
                return 42;
            }

            return "42";
        }
    */},
    header: function h() {/*
        foo : (String) => String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 3);

    assert.end();
});
