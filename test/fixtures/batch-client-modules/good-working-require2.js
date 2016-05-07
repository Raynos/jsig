'use strict';

module.exports = Channel;

function Channel() {
    this.hostPort = null;
}

Channel.prototype.listen = listen;
function listen(port, host, onListen) {
    this.hostPort = host + ':' + String(port);
}
