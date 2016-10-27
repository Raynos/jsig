'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('floating function declaration is untyped', {
    snippet: function m() {/*
        function b() {}
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.untyped-function-found');
    assert.equal(err.funcName, 'b');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('allowUnusedFunction allows unused func decl', {
    snippet: [
        '/* @jsig, allowUnusedFunction: true */',
        'function b() {}'
    ].join('\n')
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);

    assert.end();
});

JSIGSnippet.test('unused function expr are invalid', {
    snippet: [
        '/* @jsig partialExport: true */',
        'exports.a = "";',
        'exports.b = function b() {};'
    ].join('\n'),
    header: function h() {/*
        export default { a: String }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '{ a: String }');
    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.untyped-function-expr-found');
    assert.equal(err.funcName, 'b');
    assert.equal(err.line, 3);

    assert.end();
});

JSIGSnippet.test('allowUnusedFunction allows unused function expr', {
    snippet: [
        '/* @jsig partialExport: true, allowUnusedFunction: true */',
        'exports.a = "";',
        'exports.b = function b() {};'
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
