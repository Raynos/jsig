'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('can export a string', {
    snippet: function m() {/*
        var foo = '';

        module.exports = foo;
    */},
    header: function h() {/*
        foo : String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'String');

    assert.end();
});

JSIGSnippet.test('can export an object', {
    snippet: function m() {/*
        var foo = { a: '' };

        module.exports = foo;
    */},
    header: function h() {/*
        foo : { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');

    assert.end();
});

JSIGSnippet.test('can export an anonymous string', {
    snippet: function m() {/*
        var foo = '';

        module.exports = foo;
    */},
    header: function h() {/*
        export default String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'String');

    assert.end();
});

JSIGSnippet.test('catches mis-export error', {
    snippet: function m() {/*
        var foo = '';

        module.exports = foo;
    */},
    header: function h() {/*
        export default Number
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'Number');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'String');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('can export an anonymous string literal', {
    snippet: function m() {/*
        module.exports = '';
    */},
    header: function h() {/*
        export default String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'String');

    assert.end();
});

JSIGSnippet.test('catches mis-export error for literal', {
    snippet: function m() {/*
        module.exports = '';
    */},
    header: function h() {/*
        export default Number
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'Number');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, 'String');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('Export must exist', {
    snippet: function m() {/*
        var foo = 4;
    */},
    header: function h() {/*
        export default Number
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'Number');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-exports');
    assert.equal(err.expected, 'Number');
    assert.equal(err.actual, '<MissingType>');
    assert.equal(err.fileName, 'snippet.js');

    assert.end();
});

JSIGSnippet.test('can export an anonymous object', {
    snippet: function m() {/*
        module.exports = { a: '' };
    */},
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');

    assert.end();
});

JSIGSnippet.test('can use exports.foo', {
    snippet: function m() {/*
        exports.a = '';
    */},
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');

    assert.end();
});

JSIGSnippet.test('assigning exports field to non-object', {
    snippet: function m() {/*
        exports.a = '';
    */},
    header: function h() {/*
        export default Number
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, 'Number');
    assert.equal(meta.errors.length, 2, 'found two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err1.fieldName, 'a');
    assert.equal(err1.nonObjectType, 'Number');
    assert.equal(err1.line, 1);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-exports');
    assert.equal(err2.expected, 'Number');
    assert.equal(err2.actual, '<MissingType>');

    assert.end();
});

JSIGSnippet.test('not exporting anything at all', {
    snippet: function m() {/*
        var a = '';
    */},
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');
    assert.equal(meta.errors.length, 1, 'found two errors');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-exports');
    assert.equal(err.expected, '{ a: String }');
    assert.equal(err.actual, '<MissingType>');

    assert.end();
});

JSIGSnippet.test('adding the wrong field to exports', {
    snippet: function m() {/*
        exports.b = '';
    */},
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');
    assert.equal(meta.errors.length, 2, 'found two errors');

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.non-existant-field');
    assert.equal(err1.fieldName, 'b');
    assert.equal(err1.objName, 'exports');
    assert.equal(err1.line, 1);
    assert.equal(err1.expected, '{ b: T }');
    assert.equal(err1.actual, '{ a: String }');

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.missing-exports');
    assert.equal(err2.expected, '{ a: String }');
    assert.equal(err2.actual, '<MissingType>');

    assert.end();
});

JSIGSnippet.test('assigning a subset of exports fields', {
    snippet: function m() {/*
        exports.b = '';
    */},
    header: function h() {/*
        export default { a: String, b: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported,
        '{\n    a: String,\n    b: String\n}');
    assert.equal(meta.errors.length, 1, 'expected one error');

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-exports');
    assert.equal(err.expected, '{\n    a: String,\n    b: String\n}');
    assert.equal(err.actual, '{ b: String }');
    assert.equal(err.fileName, 'snippet.js');

    assert.end();
});

JSIGSnippet.test('cannot export a field when no exports', {
    snippet: function m() {/*
        exports.a = '';
    */},
    header: function h() {/*
        a : String
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.moduleExportsType, null);
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'a');
    assert.equal(err.nonObjectType, '%Export%%ExportsObject');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('exporting extra fields is error', {
    snippet: function m() {/*
        exports.a = '';
        exports.b = '';
    */},
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.non-existant-field');
    assert.equal(err.fieldName, 'b');
    assert.equal(err.objName, 'exports');
    assert.equal(err.line, 2);
    assert.equal(err.expected, '{ b: T }');
    assert.equal(err.actual, '{ a: String }');

    assert.end();
});

JSIGSnippet.test('partialExport mode allows exporting extras', {
    snippet: [
        '/* @jsig partialExport: true */',
        'exports.a = "";',
        'exports.b = "";'
    ].join('\n'),
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('partialExport mode allows exporting extra funcs', {
    snippet: [
        '/* @jsig partialExport: true, allowUnusedFunction: true */',
        'function a(x) { return x; }',
        'function b(x) { return x; }',
        'module.exports = { a: a, b: b }'
    ].join('\n'),
    header: function h() {/*
        export default { a: (String) => String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: (String) => String }');
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('partialExport mode allows extra methods on class', {
    snippet: [
        '/* @jsig partialExport: true, allowUnusedFunction: true */',
        'function JobFoo() {}',
        'JobFoo.prototype.bar = function bar() {};',
        'JobFoo.prototype.foo = function foo() {};',
        'module.exports = JobFoo;'
    ].join('\n'),
    header: function h() {/*
        type JobFoo : {
            bar: () => void
        }

        JobFoo : (this: JobFoo) => void
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '(this: JobFoo) => void');
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('exporting a large object literal', {
    snippet: function m() {/*
        module.exports = {
            'name': 'jsig',
            'version': '0.1.4',
            'bin': {
                'jsig': './bin/jsig.js'
            }
        };
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported,
        '{\n    name: String,\n' +
        '    version: String,\n' +
        '    bin: { jsig: String }\n}'
    );

    assert.end();
});

JSIGSnippet.test('exporting an untyped function is error', {
    snippet: function m() {/*
        function FooBar(x) {
            return x;
        }

        module.exports = FooBar
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.moduleExportsType, null);
    assert.equal(meta.errors.length, 3);

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.verify.untyped-function-found');
    assert.equal(err1.funcName, 'FooBar');
    assert.equal(err1.line, 1);

    var err2 = meta.errors[1];
    assert.equal(err2.type, 'jsig.verify.unknown-identifier');
    assert.equal(err2.tokenName, 'FooBar');
    assert.equal(err2.line, 5);

    var err3 = meta.errors[2];
    assert.equal(err3.type, 'jsig.verify.unknown-module-exports');
    assert.equal(err3.funcName, 'FooBar');
    assert.equal(err3.line, 5);

    assert.end();
});

JSIGSnippet.test('exporting a function expr is error', {
    snippet: function m() {/*
        module.exports = function FooBar(x) {
            return x;
        };
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.moduleExportsType, null);
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.untyped-function-expr-found');
    assert.equal(err.funcName, '(expression @ 1 : 25) FooBar');
    assert.equal(err.line, 1);

    assert.end();
});
