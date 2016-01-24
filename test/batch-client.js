'use strict';

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/');

var batchClientDir = path.join(__dirname, 'batch-client');

test('batch-client-1', function t(assert) {
    var file = path.join(batchClientDir, 'batch-client-1.js');

    var meta = compile(file);

    console.log('?', meta.errors);

    assert.end();
});
