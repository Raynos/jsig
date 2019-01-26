'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('good working simple constructor', {
    snippet: function m() {/*
        module.exports = BatchClient;

        function BatchClient(channel, hosts) {
            this.channel = channel;
            this.hosts = hosts;
        }
    */},
    header: function h() {/*
        type Channel : Object
        type IBatchClient : {
            channel: Channel,
            hosts: Array<String>
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
