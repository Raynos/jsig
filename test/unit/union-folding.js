'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('folding union removes duplicates', {
    snippet: function m() {/*
        var o = {}
        var b = '' || o || '';

        b.split();
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();
    var errors = meta.errors;

    assert.equal(errors.length, 1);

    assert.equal(errors[0].type, 'jsig.verify.accessing-field-on-union');
    assert.equal(errors[0].fieldName, 'split');
    assert.equal(errors[0].unionType, 'String | {}');
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

        b.foo();
    */},
    header: function h() {/*
        opts : {
            requestOptions?: {
                fieldOne?: String
            }
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile();
    var errors = meta.errors;

    assert.equal(errors.length, 1);

    assert.equal(errors[0].type, 'jsig.verify.non-existant-field');
    assert.equal(errors[0].fieldName, 'foo');
    assert.equal(errors[0].objName, 'b');
    assert.equal(errors[0].line, 9);
    assert.equal(errors[0].actual, '{ fieldOne?: String }');

    assert.end();
});
