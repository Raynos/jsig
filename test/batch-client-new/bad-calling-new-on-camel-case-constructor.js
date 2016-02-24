'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.key = new Baffer('KEY_VALUE');
}

function Baffer(str) {
    this.str = str;
}
