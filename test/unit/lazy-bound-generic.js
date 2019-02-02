'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('lazy bound can update scope', {
    fullInference: true,
    snippet: function m() {/*
        var foo = [];
        foo.push("a string");
        typeof foo;

        var foo2 = { foo: [] };
        foo2.foo.push("a string");
        typeof foo2;

        var foo3 = { foo2: { foo: [] } };
        foo3.foo2.foo.push("a string");
        typeof foo3;

        function Foo() {
            this.foo = [];
            this.foo.push("a string");
            typeof this;

            this.foo2 = { foo: [] };
            this.foo2.foo.push("a string");
            typeof this;
        }

        typeof Foo;
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);

    assert.equal(meta.typeofErrors[0].valueType, 'Array<String>');
    assert.equal(meta.typeofErrors[1].valueType, '{ foo: Array<String> }');
    assert.equal(meta.typeofErrors[2].valueType,
        '{ foo2: { foo: Array<String> } }');
    assert.equal(meta.typeofErrors[3].valueType, '{ foo: Array<String> }');
    assert.equal(meta.typeofErrors[4].valueType, '{\n' +
        '    foo: Array<String>,\n' +
        '    foo2: { foo: Array<String> }\n' +
        '}');
    assert.equal(meta.typeofErrors[5].valueType, '(this: {\n' +
        '    foo: Array<String>,\n' +
        '    foo2: { foo: Array<String> }\n' +
        '}) => void');

    assert.end();
});
