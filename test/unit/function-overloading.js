'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('function overloading works', {
    snippet: function m() {/*
        foo('').split('');
        foo(2).split('');
        foo(2) + 4;
        foo('') + 4;
        foo({}) + 4;

        function foo(x) {
            return x;
        }
    */},
    header: function h() {/*
        foo : ((String) => String) &
            ((Number) => Number)
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();
    assert.equal(meta.errors.length, 3, 'expected three errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.non-existant-field');
    assert.equal(err1.fieldName, 'split');
    assert.equal(err1.objName, 'foo(2)');
    assert.equal(err1.expected, '{ split: T }');
    assert.equal(err1.actual,
        '{\n' +
        '    toFixed: (this: Number, digits?: Number) => String,\n' +
        '    toExponential: (this: Number, digits?: Number) => String,\n' +
        '    toPrecision: (this: Number, precision?: Number) => String,\n' +
        '    toString: (this: Number) => String\n' +
        '}'
    );
    assert.equal(err1.line, 2);

    var err2 = meta.errors[1];
    assert.equal(err2.type,
        'jsig.sub-type.intersection-operator-call-mismatch');
    assert.equal(err2.expected,
        '(String, String) => String & (Number, Number) => Number');
    assert.equal(err2.actual, '[String, Number]');
    assert.equal(err2.operator, '+');
    assert.equal(err2.line, 4);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.function-overload-call-mismatch');
    assert.equal(err3.expected, '(String) => String & (Number) => Number');
    assert.equal(err3.actual, '[{}]');
    assert.equal(err3.funcName, 'foo');
    assert.equal(err3.line, 5);

    assert.end();
});

JSIGSnippet.test('overloading based on string argument', {
    snippet: function m() {/*
        on("str", x);
        on("num", y);

        function x(a) {
            a.split("");
        }
        function y(b) {
            b + 4;
        }

        function on(str, listener) {
        }
    */},
    header: function h() {/*
        on: ((str: "str", (String) => void) => void) &
            ((str: "num", (Number) => void) => void)
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('string argument disallows mutations', {
    snippet: function m() {/*
        var foo = "str";
        foo = "bar"
        on(foo, x);

        function x(a) {
            a.split("");
        }

        function on(str, listener) {
        }
    */},
    header: function h() {/*
        on: (str: "str", (String) => void) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, '"str"');
    assert.equal(err.actual, '"bar"');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('overloading a getter-style interface', {
    snippet: function m() {/*
        config.get("key1").split('a');

        config.get("key2") + 5;

        config.get("key3").a.split('b');
    */},
    header: function h() {/*
        type Config : {
            get: (
                ((this: Config, str: "key1") => String) &
                ((this: Config, str: "key2") => Number) &
                ((this: Config, str: "key3") => { a: String })
            )
        }

        config: Config
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloading a getter-style interface (sugar)', {
    snippet: function m() {/*
        config.get("key1").split('a');

        config.get("key2") + 5;

        config.get("key3").a.split('b');
    */},
    header: function h() {/*
        interface Config {
            get(str: "key1") => String,
            get(str: "key2") => Number,
            get(str: "key3") => { a: String }
        }

        config: Config
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloading an event emitter object', {
    snippet: function m() {/*
        events.on("key1", function f(x) {
            x.split('a');
        });

        events.on("key2", function f(x) {
            x + 5;
        });

        events.on("key3", function f(x) {
            x.a.split('b');
        });
    */},
    header: function h() {/*
        type MyEvents : {
            on: (
                ((this: MyEvents, str: "key1", cb: (String) => void) => void) &
                ((this: MyEvents, str: "key2", cb: (Number) => void) => void) &
                ((
                    this: MyEvents,
                    str: "key3",
                    cb: ({ a: String }) => void
                ) => void)
            )
        }

        events: MyEvents
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloading an event emitter object (sugar)', {
    snippet: function m() {/*
        events.on("key1", function f(x) {
            x.split('a');
        });

        events.on("key2", function f(x) {
            x + 5;
        });

        events.on("key3", function f(x) {
            x.a.split('b');
        });
    */},
    header: function h() {/*
        interface MyEvents {
            on(str: "key1", cb: (String) => void) => void,
            on(str: "key2", cb: (Number) => void) => void,
            on(str: "key3", cb: ({ a: String}) => void) => void
        }

        events: MyEvents
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloaded callbacks as func decl 1', {
    snippet: function m() {/*
        db.load('key', onObj);

        function onObj(err, obj) {
        }
    */},
    header: function h() {/*
        interface Obj {
            key: String,
            value: String
        }

        db : {
            load: (key: String, cb : (
                ((err: Error, obj?: Obj) => void) &
                ((err: null, obj: Obj) => void)
            )) => void
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloaded callbacks as func decl 2', {
    snippet: function m() {/*
        db.load('key', onObj);

        function onObj(err, obj) {
            if (err) {
                err.message + 'foo';
            }
        }
    */},
    header: function h() {/*
        interface Obj {
            key: String,
            value: String
        }

        db : {
            load: (key: String, cb : (
                ((err: Error, obj?: Obj) => void) &
                ((err: null, obj: Obj) => void)
            )) => void
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloaded callbacks as func decl 3', {
    snippet: function m() {/*
        db.load('key', onObj);

        function onObj(err, obj) {
            if (err) {
                err.message + 'foo';
            } else {
                obj.key + 'wat';
            }
        }
    */},
    header: function h() {/*
        interface Obj {
            key: String,
            value: String
        }

        db : {
            load: (key: String, cb : (
                ((err: Error, obj?: Obj) => void) &
                ((err: null, obj: Obj) => void)
            )) => void
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('overloaded callbacks as func decl 4', {
    snippet: function m() {/*
        db.load('key', onObj);

        function onObj(err, obj) {
            if (err) {
                err.message + 'foo';
                return;
            }

            obj.key + 'wat';
        }
    */},
    header: function h() {/*
        interface Obj {
            key: String,
            value: String
        }

        db : {
            load: (key: String, cb : (
                ((err: Error, obj?: Obj) => void) &
                ((err: null, obj: Obj) => void)
            )) => void
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
