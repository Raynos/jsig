'use strict';

var CheatChannel = require('./good-working-require2.js');

var SIZE = 1000;

module.exports = BatchClient;

function BatchClient(hosts) {
    this.channel = new CheatChannel();
    this.hosts = hosts;
    this.key = 'KEY_VALUE';
    this.body = allocBody(SIZE);
    this.batchSize = 5;
}

BatchClient.prototype.sendRequests = sendRequests;
function sendRequests(cb) {
    var loop = new BatchClientLoop({
        start: Date.now(),
        batchClient: this,
        onFinish: cb
    });
    loop.runNext();
}

/*eslint perf-standard/no-self-in-constructor: 0*/
function BatchClientLoop(options) {
    var self = this;

    this.batchClient = options.batchClient;
    this.startTime = options.start;
    this.onFinish = options.onFinish;

    this.requestCounter = 0;
    this.responseCounter = 0;
    this.currentRun = 0;
    this.results = new BatchClientResults();
    this.boundRunAgain = boundRunAgain;

    function boundRunAgain() {
        self.runNext();
    }
}

BatchClientLoop.prototype.runNext = runNext;
function runNext() {
    this.currentRun++;

    this.requestCounter += this.batchClient.batchSize;
}

function BatchClientResults() {
    this.errors = [];
    this.results = [];
}

function allocBody(len) {
    var body = '';

    for (var i = 0; i < len; i++) {
        body += 'A';
    }
    return body;
}
