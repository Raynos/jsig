'use strict';

var process = global.process;
var console = require('console');

for (var i = 0; i < process.argv.length; i++) {
    console.log(process.argv[i]);
}
