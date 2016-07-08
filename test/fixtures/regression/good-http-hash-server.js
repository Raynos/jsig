'use strict';

var assert = require('assert');
var http = require('http');

var DEFAULT_HOSTNAME = '127.0.0.1';

var T_STATE_BEFORE_LISTENING = 0;
var T_STATE_BEGIN_LISTENING = 1;
var T_STATE_LISTENING = 2;
var T_STATE_DESTROYING = 3;
var T_STATE_DESTROYED = 4;

module.exports = HttpHashServer;

function HttpHashServer(opts) {
    assert(opts, 'Expected opts in HttpHashServer constructor');

    var hostname = opts.hostname === undefined ?
        DEFAULT_HOSTNAME :
        opts.hostname;

    assert(
        typeof hostname === 'string',
        'Expected hostname to be a string in HttpHashServer constructor'
    );

    var port = opts.port;
    assert(
        typeof port === 'number' && (port | 0) === port && port >= 0,
        'Expected opts.port to be an integer >= 0 in HttpHashServer constructor'
    );

    var router = opts.router;
    assert(router, 'Expected opts.router in HttpHashServer constructor');

    this._state = T_STATE_BEFORE_LISTENING;

    this._httpServer = http.createServer();
    this._router = router;
    this._initcb = null;

    this.family = '';
    this.globalRequestOptions = opts.globalRequestOptions || {};
    this.hostname = hostname;
    this.port = port;

    var self = this;
    this._httpServer.on('request', bindHttpHashHandleRequest);
    this._httpServer.on('connection', bindHttpHashHandleConnection);
    this._httpServer.on('error', bindHttpHashHandleError);

    function bindHttpHashHandleRequest(req, res) {
        self._handleRequest(req, res);
    }

    function bindHttpHashHandleConnection(socket) {
        self._handleConnection(socket);
    }

    function bindHttpHashHandleError(err) {
        self._handleError(err);
    }
}

HttpHashServer.prototype._handleRequest = serverHandleRequest;
function serverHandleRequest(req, res) {
    this._router.handleRequest(req, res, this.globalRequestOptions);
}

HttpHashServer.prototype._handleConnection = serverHandleConnection;
function serverHandleConnection(socket) {
    socket.setNoDelay(true);
    // TODO add custom timeout mechanism
}

HttpHashServer.prototype._handleError = serverHandleError;
function serverHandleError(err) {
    if (this._initcb) {
        var initcb = this._initcb;
        this._initcb = null;
        initcb(err);
    } else {
        throw err;
    }
}

HttpHashServer.prototype.listen = serverListen;
function serverListen(callback) {
    var self = this;

    assert(
        self._state === T_STATE_BEFORE_LISTENING,
        'Expected one call to server.listen'
    );

    self._initcb = callback;
    self._state = T_STATE_BEGIN_LISTENING;
    self._httpServer.listen(this.port, this.hostname, bindOnServerListening);

    function bindOnServerListening() {
        self._onServerListening();
    }
}

HttpHashServer.prototype.destroy = serverDestroy;
function serverDestroy(callback) {
    var self = this;

    if (self._state !== T_STATE_LISTENING) {
        return;
    }

    self._state = T_STATE_DESTROYING;

    self._httpServer.close(function bindOnServerDestroyed() {
        self._onServerDestroyed(callback);
    });
}

HttpHashServer.prototype._onServerListening = onServerListening;
function onServerListening() {
    var self = this;
    var callback = self._initcb;
    self._initcb = null;

    self._state = T_STATE_LISTENING;

    var address = self._httpServer.address();
    self.hostname = address.address;
    self.family = address.family;
    self.port = address.port;

    if (callback) {
        callback(null);
        return;
    }
}

HttpHashServer.prototype._onServerDestroyed = onServerDestroyed;
function onServerDestroyed(callback) {
    this._state = T_STATE_DESTROYED;

    if (callback) {
        callback(null);
        return;
    }
}
