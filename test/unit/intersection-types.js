'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('allow intersection of function and object', {
    snippet: function m() {/*
        function Foo(x) {
            this.x = x;
        }

        Foo.STATIC_TYPE = 'Foo';

        module.exports = Foo;
    */},
    header: function h() {/*
        type Foo : {
            x: String
        }

        Foo : {
            STATIC_TYPE: String
        } & (this: Foo, x: String) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported,
        '{ STATIC_TYPE: String } & ' +
        '(this: Foo, x: String) => void');

    assert.end();
});

JSIGSnippet.test('allow intersection of function and object', {
    snippet: function m() {/*
        function Foo(x) {
            this.x = x;
        }

        Foo.STATIC_TYPE = 'Foo';

        module.exports = Foo;
    */},
    header: function h() {/*
        type Foo : {
            x: String
        }

        Foo : {
            STATIC_TYPE: String
        } & {
            STATIC_TYPE2: String
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported,
        '{ STATIC_TYPE: String } & { STATIC_TYPE2: String }');
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.found-unexpected-function');
    assert.equal(err.expected, '{ STATIC_TYPE2: String }');
    assert.equal(err.actual, 'Function');
    assert.equal(err.funcName, 'Foo');
    assert.equal(err.line, 1);

    assert.end();
});

// TEST: Assingning a function to Object & Object
// TEST: Object & Object intersection
