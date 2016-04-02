'use strict';

var globalFs = require('fs');
var path = require('path');
var setTimeout = require('timers').setTimeout;
var clearTimeout = require('timers').clearTimeout;
var uuid = require('uuid');

var PROBE_INTERVAL = 25;
var CPU_TICK_MS = 10;
var IS_NULL_CHAR_REGEX = /\u0000/g;

module.exports = ProcWatcher;

function ProcWatcher(flamer, pid, options) {
    var self = this;

    this.type = 'proc-watcher';
    this.flamer = flamer;
    this.pid = pid;
    this.cmdline = (options && options.cmdline) || '';
    this.fs = (options && options.fs) || globalFs;
    this.probeInterval = PROBE_INTERVAL;

    this.minCyclesDuration = flamer.minCyclesDuration || 250;
    this.minTimeSlices = Math.floor(
        this.minCyclesDuration / PROBE_INTERVAL
    ) + 2;

    this.filePath = path.join(
        '/proc', String(this.pid), 'stat'
    );
    this.nextProbe = 0;
    this.timer = null;
    this.seenFirstRunning = false;

    this.timeSlices = [];
    this.windowReported = false;
    this.destroyed = false;
    this.paused = false;

    this.boundOnProbe = boundOnProbe;
    this.boundOnFile = boundOnFile;

    function boundOnProbe() {
        self.onProbe();
    }

    function boundOnFile(err, str) {
        self.onFile(err, str);
    }
}

ProcWatcher.prototype.watch = function watch() {
    var now = Date.now();
    this.nextProbe = now + this.probeInterval;

    this.timer = setTimeout(this.boundOnProbe, this.probeInterval);
};

ProcWatcher.prototype.destroy = function destroy() {
    this.destroyed = true;
    this.reset();

    if (this.timer) {
        clearTimeout(this.timer);
    }
};

ProcWatcher.prototype.pause = function pause() {
    this.paused = true;

    if (this.timer) {
        clearTimeout(this.timer);
    }
};

ProcWatcher.prototype.resume = function resume() {
    this.paused = false;
    this.watch();
};

ProcWatcher.prototype.onProbe = function onProbe() {
    this.timer = null;
    this.nextProbe = this.nextProbe + this.probeInterval;

    globalFs.readFile(this.filePath, 'utf8', this.boundOnFile);
};

ProcWatcher.prototype.onFile = function onFile(err, text) {
    if (err) {
        this.flamer.handleError(err, this);
        this.reset();
        this.scheduleNextProbe();
        return;
    }

    var segments = text.split(' ');

    var procInfo = new ProcInfo(
        this.pid,
        segments[2], // state %c
        segments[13], // utime %lu
        segments[14], // stime %lu
        segments[38], // processor %d
        segments[42] // guest_time %lu
    );

    this.handleProcInfo(procInfo);
    this.scheduleNextProbe();
};

ProcWatcher.prototype.handleProcInfo = function handleProcInfo(procInfo) {
    if (procInfo.state !== 'R') {
        this.reset();
        return;
    }

    this.timeSlices.push(procInfo);

    if (!this.windowReported && this.timeSlices.length > this.minTimeSlices) {
        var windowInfo = this.getTimeWindowInfo();
        if (windowInfo.cpuPercentage >= 95) {
            this.windowReported = true;
            if (!this.paused) {
                this.flamer.onCPUHot(windowInfo);
            }
        }
    }
};

ProcWatcher.prototype.getTimeWindowInfo = function getTimeWindowInfo() {
    // Remove first & last slice as they are "partial data";
    var slices = this.timeSlices;

    var elapsedTime = slices[slices.length - 2].timestamp - slices[1].timestamp;
    var cpuTicks = slices[slices.length - 2].ttime - slices[1].ttime;

    return new TimeWindowInfo(
        slices[0].pid, elapsedTime, cpuTicks, this.cmdline
    );
};

ProcWatcher.prototype.reset = function reset() {
    this.timeSlices.length = 0;
    this.windowReported = false;
};

ProcWatcher.prototype.scheduleNextProbe = function scheduleNextProbe() {
    if (this.destroyed || this.paused || this.timer) {
        return;
    }

    var now = Date.now();
    this.timer = setTimeout(this.boundOnProbe, this.nextProbe - now);
};

function ProcInfo(pid, state, utime, stime, processor, guestTime) {
    this.timestamp = Date.now();
    this.pid = pid;
    this.state = state;
    this.utime = parseInt(utime, 10);
    this.stime = parseInt(stime, 10);
    this.ttime = this.utime + this.stime;
    this.processor = parseInt(processor, 10);
    this.guestTime = parseInt(guestTime, 10);
}

function TimeWindowInfo(pid, elapsedTime, cpuTicks, cmdline) {
    this.timestamp = Date.now();
    this.pid = pid;
    this.elapsedTime = elapsedTime;
    this.cpuTicks = cpuTicks;
    this.cmdline = cmdline.replace(IS_NULL_CHAR_REGEX, '');
    this.uuid = uuid();
    this.filePath = null;

    this.cpuPercentage = Math.floor(
        100 * (cpuTicks * CPU_TICK_MS) / elapsedTime
    );
}
