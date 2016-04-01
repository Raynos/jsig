'use strict';

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
