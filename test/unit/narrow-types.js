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

JSIGSnippet.test('narrowing with isArray()', {
    snippet: function m() {/*
        if (Array.isArray(foo)) {
            foo = 5;
        }

        foo + 4;
    */},
    header: function h() {/*
        foo : Number | Array<String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('narrowing with isArray() cases 1', {
    snippet: function m() {/*
        if (typeof foo === 'number') {
            typeof foo;
        } else if (foo) {
            typeof foo;
        } else {
            lulz();
        }
    */},
    header: function h() {/*
        foo : Number | Array<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, 'Number');
    assert.equal(meta.typeofErrors[1].valueType, 'Array<String>');

    assert.end();
});

JSIGSnippet.test('narrowing with isArray() cases 2', {
    snippet: function m() {/*
        if (Array.isArray(foo)) {
            typeof foo;
        } else if (typeof foo === 'string') {
            lulz();
        } else {
            typeof foo;
        }
    */},
    header: function h() {/*
        foo : Number | Array<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, 'Array<String>');
    assert.equal(meta.typeofErrors[1].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing with isArray() cases 3', {
    snippet: function m() {/*
        if (Array.isArray(foo)) {
            typeof foo;
        } else {
            typeof foo;
        }
    */},
    header: function h() {/*
        foo : Number | Array<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, 'Array<String>');
    assert.equal(meta.typeofErrors[1].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing with isArray() cases 4', {
    snippet: function m() {/*
        if (!Array.isArray(foo)) {
            typeof foo;
        } else {
            typeof foo;
        }
    */},
    header: function h() {/*
        foo : Number | Array<String>
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, 'Number');
    assert.equal(meta.typeofErrors[1].valueType, 'Array<String>');

    assert.end();
});

JSIGSnippet.test('narrowing with === null cases 1', {
    snippet: function m() {/*
        var bar = null;

        if (foo === null) {
            typeof foo;
            bar = 4;
            foo = 4;
        } else {
            typeof foo;
            bar = foo;
        }

        typeof bar;
        typeof foo;
    */},
    header: function h() {/*
        foo : Number | null
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 4);

    assert.equal(meta.typeofErrors[0].valueType, 'null');
    assert.equal(meta.typeofErrors[1].valueType, 'Number');
    assert.equal(meta.typeofErrors[2].valueType, 'Number');
    assert.equal(meta.typeofErrors[3].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing with === null cases 2', {
    snippet: function m() {/*
        var bar = null;

        if (foo !== null) {
            typeof foo;
            bar = foo;
        } else {
            typeof foo;
            bar = 4;
            foo = 4;
        }

        typeof bar;
        typeof foo;
    */},
    header: function h() {/*
        foo : Number | null
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 4);

    assert.equal(meta.typeofErrors[0].valueType, 'Number');
    assert.equal(meta.typeofErrors[1].valueType, 'null');
    assert.equal(meta.typeofErrors[2].valueType, 'Number');
    assert.equal(meta.typeofErrors[3].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing with === undefined cases 1', {
    snippet: function m() {/*
        var bar = null;

        if (foo === undefined) {
            typeof foo;
            bar = 4;
            foo = 4;
        } else {
            typeof foo;
            bar = foo;
        }

        typeof bar;
        typeof foo;
    */},
    header: function h() {/*
        foo : Number | undefined
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 4);

    assert.equal(meta.typeofErrors[0].valueType, 'undefined');
    assert.equal(meta.typeofErrors[1].valueType, 'Number');
    assert.equal(meta.typeofErrors[2].valueType, 'Number');
    assert.equal(meta.typeofErrors[3].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing with === undefined cases 2', {
    snippet: function m() {/*
        var bar = null;

        if (foo !== undefined) {
            typeof foo;
            bar = foo;
        } else {
            typeof foo;
            bar = 4;
            foo = 4;
        }

        typeof bar;
        typeof foo;
    */},
    header: function h() {/*
        foo : Number | undefined
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 4);

    assert.equal(meta.typeofErrors[0].valueType, 'Number');
    assert.equal(meta.typeofErrors[1].valueType, 'undefined');
    assert.equal(meta.typeofErrors[2].valueType, 'Number');
    assert.equal(meta.typeofErrors[3].valueType, 'Number');

    assert.end();
});

JSIGSnippet.test('narrowing based on string literals', {
    snippet: function m() {/*
        if (foo === "foo") {
            typeof foo;
        } else {
            typeof foo;
        }
    */},
    header: function h() {/*
        foo : "foo" | "bar"
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, '"foo"');
    assert.equal(meta.typeofErrors[1].valueType, '"bar"');

    assert.end();
});

JSIGSnippet.test('narrowing based on string literals fields', {
    snippet: function m() {/*
        if (obj.foo === "foo") {
            typeof obj;
        } else {
            typeof obj;
        }
    */},
    header: function h() {/*
        obj : { foo: "foo" } | { foo: "bar" }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, '{ foo: "foo" }');
    assert.equal(meta.typeofErrors[1].valueType, '{ foo: "bar" }');

    assert.end();
});

JSIGSnippet.test('narrowing based on nested string literals fields', {
    snippet: function m() {/*
        if (obj.obj.foo === "foo") {
            typeof obj;
        } else {
            typeof obj;
        }
    */},
    header: function h() {/*
        obj : { obj: { foo: "foo" } } | { obj: { foo: "bar" } }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.typeofErrors.length, 2);

    assert.equal(meta.typeofErrors[0].valueType, '{ obj: { foo: "foo" } }');
    assert.equal(meta.typeofErrors[1].valueType, '{ obj: { foo: "bar" } }');

    assert.end();
});
