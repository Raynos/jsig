'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.key = new makeBuffer('KEY_VALUE');
}

function makeBuffer(str) {
    this.str = str;
}
