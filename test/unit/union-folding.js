'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('folding union removes duplicates', {
    snippet: function m() {/*
        var o = {}
        var b = '' || o || '';

        b();
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();
    var errors = meta.errors;

    assert.equal(errors.length, 1);

    assert.equal(errors[0].type, 'jsig.verify.calling-non-function-object');
    assert.equal(errors[0].callExpression, 'b');
    assert.equal(errors[0].objType, 'String | {}');
    assert.equal(errors[0].line, 4);

    assert.end();
});

JSIGSnippet.test('fold empty object into optional object', {
    snippet: function m() {/*
        var opts = {
            requestOptions: {
                fieldOne: ''
            }
        };

        var b = opts.requestOptions || {};

        b();
    */},
    header: function h() {/*
        opts : {
            requestOptions?: {
                fieldOne?: String
            }
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var errors = meta.errors;

    assert.equal(errors.length, 1);

    assert.equal(errors[0].type, 'jsig.verify.calling-non-function-object');
    assert.equal(errors[0].callExpression, 'b');
    assert.equal(errors[0].objType, '{ fieldOne?: String } | {}');
    assert.equal(errors[0].line, 9);

    assert.end();
});

JSIGSnippet.test('fold empty object into optional object reverse', {
    snippet: function m() {/*
        var opts = {
            requestOptions: {
                fieldOne: ''
            }
        };

        var b = {} || opts.requestOptions;

        b();
    */},
    header: function h() {/*
        opts : {
            requestOptions?: {
                fieldOne?: String
            }
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var errors = meta.errors;

    assert.equal(errors.length, 1);

    assert.equal(errors[0].type, 'jsig.verify.calling-non-function-object');
    assert.equal(errors[0].callExpression, 'b');
    assert.equal(errors[0].objType, '{} | { fieldOne?: String }');
    assert.equal(errors[0].line, 9);

    assert.end();
});
