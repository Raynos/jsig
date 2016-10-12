'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('narrowing a type based on if check', {
    snippet: function m() {/*
        if (foo) {
            foo.a + '5'
        } else {
            bar = foo;
        }
    */},
    header: function h() {/*
        foo : { a: String } | null
        bar : null
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('null or default logic (object)', {
    snippet: function m() {/*
        if (!foo) {
            foo = { a: '' };
        }

        foo.a.split('baz');
    */},
    header: function h() {/*
        foo : { a: String } | null
        bar : null
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('null or default logic (string)', {
    snippet: function m() {/*
        if (typeof foo !== 'string') {
            foo = '';
        }

        foo.split('baz');
    */},
    header: function h() {/*
        foo : String | null
        bar : null
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('early return if null logic', {
    snippet: function m() {/*
        function wat() {
            if (typeof foo !== 'string') {
                return;
            }

            foo.split('baz');
        }

        wat();
    */},
    header: function h() {/*
        foo : String | null
        bar : null
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
