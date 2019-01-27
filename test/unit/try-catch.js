'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('try catch statement', {
    snippet: function m() {/*
        var foo;
        try {
            foo = 42;
        } catch (error) {
            foo = '50';
        }
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});

JSIGSnippet.test('type error in try case', {
    snippet: function m() {/*
        var foo = 'foo';
        try {
            foo = 42;
        } catch (error) {
            foo = '50';
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err1.expected, 'String');
    assert.equal(err1.actual, 'Number');
    assert.equal(err1.line, 3);

    assert.end();
});

JSIGSnippet.test('type error in catch case', {
    snippet: function m() {/*
        var foo = 40;
        try {
            foo = 42;
        } catch (error) {
            foo = '50';
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    assert.equal(meta.errors.length, 1);

    var err1 = meta.errors[0];
    assert.equal(err1.type, 'jsig.sub-type.type-class-mismatch');
    assert.equal(err1.expected, 'Number');
    assert.equal(err1.actual, 'String');
    assert.equal(err1.line, 5);

    assert.end();
});
