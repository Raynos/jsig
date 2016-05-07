'use strict';

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
