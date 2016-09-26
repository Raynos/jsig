'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow optional function fields', {
    snippet: function m() {/*
        function Foo() {
            this.y = null;
        }

        var f = new Foo();
        f.y = function noop() {};
        f.y = noop;

        function noop() {}
    */},
    header: function h() {/*
        type Foo : {
            y: null | (String) => String
        }

        Foo : (this: Foo) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    // TODO: fix error
    assert.equal(meta.errors.length, 3);

    assert.end();
});
