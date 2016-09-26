'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow optional function fields', {
    snippet: function m() {/*
        function Foo() {
            this.x = null;
            this.y = null;
        }

        var f = new Foo();
        f.x = function noop() {};
    */},
    header: function h() {/*
        type Foo : {
            x: null | Function,
            y: null | (String) => String
        }

        Foo : (this: Foo) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    // TODO: fix error
    assert.equal(meta.errors.length, 1);

    assert.end();
});
