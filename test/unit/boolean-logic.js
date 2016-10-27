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
