'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    var Buffer = makeBuffer;
    this.key = new Buffer('KEY_VALUE');
}

function makeBuffer(str) {
    return str;
}
