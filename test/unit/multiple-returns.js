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

    assert.equal(meta.errors.length, 2);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'String');
    assert.equal(err.actual, 'Number');
    assert.equal(err.line, 3);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err2.expected, 'String');
    assert.equal(err2.actual, 'Number');
    assert.equal(err2.line, 3);

    assert.end();
});
