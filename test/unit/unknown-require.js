'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('unknown require is an error', {
    snippet: function m() {/*
        var _ = require('lodash')
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.missing-definition');
    assert.equal(err.moduleName, 'lodash');
    assert.equal(err.line, 1);

    assert.end();
});

JSIGSnippet.test('allowUnknownRequire silences require errors', {
    snippet: [
        '/* @jsig allowUnknownRequire: true */',
        'var _ = require("lodash");'
    ].join('\n')
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    assert.equal(meta.errors.length, 0);
    assert.end();
});

JSIGSnippet.test('using an unknown require is not valid', {
    snippet: [
        '/* @jsig allowUnknownRequire: true */',
        'var _ = require("lodash");',
        '_.map([], function () {});'
    ].join('\n')
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);

    assert.equal(meta.errors.length, 1);

    var err = meta.errors[0];
    assert.equal(err.type, 'jsig.verify.accessing-field-on-non-object');
    assert.equal(err.fieldName, 'map');
    assert.equal(err.nonObjectType, '%Mixed%%UnknownRequire');
    assert.equal(err.line, 3);

    assert.end();
});
