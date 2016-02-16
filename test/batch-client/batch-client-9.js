'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.value = '';
}

BatchClient.prototype._sendRequest = _sendRequest;
function _sendRequest(foo, extra) {
    this.value = foo;
}
