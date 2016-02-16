'use strict';

module.exports = BatchClient;

function BatchClient(channel, hosts) {
    this.channel = channel;
    this.hosts = hosts;
}
