'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;

    this.key = new Buffer('KEY_VALUE', 'SECOND_ARG');
}

function Buffer(str) {
    this.str = str;
}
