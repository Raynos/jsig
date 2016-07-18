'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('can inherit from another constructor', {
    snippet: function m() {/*
        function Base() {
            this.a = '';
            this.b = 0;
        }

        function Child() {
            Base.call(this)

            this.c = true;
        }

        var c = new Child();
        c.a.split('');
        c.b + 4;
        c.c = false;
    */},
    header: function h() {/*
        type Base : {
            a: String,
            b: Number
        }

        type Child : Base & {
            c: Boolean
        }

        Base : (this: Base) => void

        Child : (this: Child) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.errors.length, 0);
    assert.end();
});
