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
