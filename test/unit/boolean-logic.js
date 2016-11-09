'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('boolean-logic: && + ||', {
    snippet: function m() {/*

        var o = {
            latitude: 5
        };

        var defaultLatitude = 6;

        var latitude = (o && o.latitude) || defaultLatitude;
        latitude + 5;
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

JSIGSnippet.test('boolean-logic: specific booleans (&&)', {
    snippet: function m() {/*
        // false | String
        var foo = obj.hasOwnProperty('foo') &&
            obj['foo'];

        // String
        foo = foo || '';

        foo.split('');
    */},
    header: function h() {/*
        obj : Object<String, String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});
