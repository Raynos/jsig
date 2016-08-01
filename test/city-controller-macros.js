'use strict';

// Error.stackTraceLimit = Infinity;

var test = require('tape');
var path = require('path');

var compile = require('../type-checker/').compile;

var cityControllerDir = path.join(
    __dirname, 'fixtures', 'city-controller-macros'
);
var definitionsDir = path.join(
    __dirname, 'fixtures', 'city-controller-macros', 'definitions'
);

test('working macro import', function t(assert) {
    var file = getFile('good-city-controller-macro.js');

    var meta = compile(file, {
        definitions: definitionsDir
    });
    assert.ok(meta, 'expected meta to exist');
    assert.equal(meta.errors.length, 0, 'expected one error');
    assert.ok(meta.moduleExportsType, 'expected export to exist');

    assert.end();
});

function getFile(fileName) {
    return path.join(cityControllerDir, fileName);
}
