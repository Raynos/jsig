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
