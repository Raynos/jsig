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
