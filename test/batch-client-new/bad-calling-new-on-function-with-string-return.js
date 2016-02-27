'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.key = new Buffer('KEY_VALUE');
}

function Buffer(str) {
    this.str = str;
    return this.str;
}
