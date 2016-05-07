'use strict';

module.exports = BatchClient;

// BatchClient.prototype._sendRequest = _sendRequest;

/*eslint no-unused-vars: 0*/
function _sendRequest(foo) {
    this.value = foo;
}

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.value = '';
}
