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
    snippet: function m() {/*
        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;

            this.value = String(10);
        }
    */},
    header: function h() {/*
        type Channel : Object
        type IBatchClient : {
            channel: Channel,
            hosts: Array<String>,
            value: String
        }

        BatchClient : (
            this: IBatchClient,
            channel: Channel,
            hosts: Array<String>
        ) => void
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);

    assert.end();
});
