'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('error message for nested fields', {
    snippet: function m() {/*
        var resp = {
            statusCode: 200,
            body: {
                messageType: 'OK',
                timestamp: undefined
            }
        }

        fn(resp);
    */},
    header: function h() {/*
        fn : (resp: {
            statusCode: Number,
            body: {
                messageType: String,
                timestamp?: Number
            }
        }) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, '{ body: { timestamp: Number } }');
    assert.equal(err.actual, '{ body: { timestamp: undefined } }');
    assert.equal(err.line, 9);

    assert.end();
});
