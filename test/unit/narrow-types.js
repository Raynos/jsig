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

JSIGSnippet.test('early return on this type', {
    snippet: function m() {/*
        function Foo() {
            this.value = null;
        }

        Foo.prototype.get = function get() {
            if (!this.value) {
                return '';
            }

            return this.value;
        };

        Foo.prototype.set = function set(x) {
            this.value = x;
        };

        var f = new Foo();
        f.get() + '5';
    */},
    header: function h() {/*
        interface Foo {
            value: String | null,

            set(String) => void,
            get() => String
        }

        Foo : (this: Foo) => void
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('for loop type restrictions are copied', {
    snippet: function m() {/*
        var foo;

        for (var i = 0; i < 5; i++) {
            foo = 'bar';
        }

        if (foo) {
            foo + '5';
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('early continue if null logic', {
    snippet: function m() {/*
        function wat() {
            for (var i = 0; i < 2; i++) {
                if (typeof foo !== 'string') {
                    continue;
                }

                foo.split('baz');
            }
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

JSIGSnippet.test('typeof checks against number/string', {
    snippet: function m() {/*
        if (typeof foo === 'string') {
            foo + '5';
        } else if (typeof foo === 'number') {
            foo + 5;
        }
    */},
    header: function h() {/*
        foo : String | Number
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('normalizing variables with typeof', {
    snippet: function m() {/*
        if (typeof foo === 'string') {
            foo = 5;
        }

        foo + 4;
    */},
    header: function h() {/*
        foo : String | Number
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
