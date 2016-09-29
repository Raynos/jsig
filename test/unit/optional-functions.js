'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow optional function fields', {
    snippet: function m() {/*
        function Foo() {
            this.y = null;
        }

        var f = new Foo();
        f.y = function stringer() {
            return '';
        };
        f.y = stringer;

        function stringer() {
            return '';
        }
    */},
    header: function h() {/*
        type Foo : {
            y: null | () => String
        }

        Foo : (this: Foo) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);
    assert.end();
});

JSIGSnippet.test('cannot assign function expr ', {
    snippet: function m() {/*
        function Foo() {
            this.y = null;
        }

        var f = new Foo();
        f.y = function stringer() {
            return '';
        };
        f.y = stringer;

        function stringer() {
            return '';
        }
    */},
    header: function h() {/*
        type Foo : {
            y: null | () => String
        }

        Foo : (this: Foo) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);
    assert.end();
});
