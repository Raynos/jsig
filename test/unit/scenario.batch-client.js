'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('good working simple constructor', {
    fullInference: true,
    snippet: function m() {/*
        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});

JSIGSnippet.test('good calling string x in constructor', {
    fullInference: true,
    snippet: function m() {/*
        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = String(10);
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    value: String\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});

JSIGSnippet.test('good working new call', {
    fullInference: true,
    snippet: function m() {/*
        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.key = new Buffer('KEY_VALUE');
        }

        function Buffer(str) {
            this.str = str;
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    key: { str: String }\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});

JSIGSnippet.test('cannot mutate inferred constructor object', {
    fullInference: true,
    snippet: function m() {/*
        var x = new Buffer('foo');
        x.foo = 'bar';

        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.key = new Buffer('KEY_VALUE');
        }

        function Buffer(str) {
            this.str = str;
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compile(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    key: { str: String }\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.equal(meta.errors.length, 1);

    var error1 = meta.errors[0];
    assert.equal(error1.type, 'jsig.verify.non-existant-field');
    assert.equal(error1.fieldName, 'foo');
    assert.equal(error1.objName, 'x');
    assert.equal(error1.expected, '{ foo: T }');
    assert.equal(error1.actual, '{ str: String }');
    assert.equal(error1.line, 2);

    assert.end();
});

JSIGSnippet.test('good assign method as func expression', {
    fullInference: true,
    snippet: function m() {/*
        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = '';
        }

        BatchClient.prototype._sendRequest =
        function _sendRequest(foo) {
            this.value = foo;
        };

        module.exports = BatchClient;
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    value: String,\n' +
        '    _sendRequest: <T0, T1>(this: [Cyclic], foo: String) => void\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});

JSIGSnippet.test('good declare export after assignment to prototype', {
    fullInference: true,
    snippet: function m() {/*
        'use strict';

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = '';
        }

        BatchClient.prototype._sendRequest = _sendRequest;
        function _sendRequest(foo) {
            this.value = foo;
        }

        module.exports = BatchClient;
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    value: String,\n' +
        '    _sendRequest: <T0, T1>(this: [Cyclic], foo: String) => void\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});

JSIGSnippet.test('good working prototype method definition', {
    fullInference: true,
    snippet: function m() {/*
        BatchClient.prototype._sendRequest = _sendRequest;

        module.exports = BatchClient;

        function _sendRequest(foo) {
            this.value = foo;
        }

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = '';
        }
    */}
}, function t(snippet, assert) {
    var meta = snippet.compileAndCheck(assert);
    var exported = meta.serializeType(meta.moduleExportsType);

    assert.equal(exported, '<T0, T1>(this: {\n' +
        '    channel: T0,\n' +
        '    hosts: T1,\n' +
        '    value: String,\n' +
        '    _sendRequest: <T0, T1>(this: [Cyclic], foo: String) => void\n' +
        '}, channel: T0, hosts: T1) => void'
    );

    assert.end();
});
