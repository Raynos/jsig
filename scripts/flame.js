'use strict';

var process = global.process;
var assert = require('assert');
var console = require('console');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

/*eslint no-console: 0, no-process-exit: 0, no-process-env: 0*/

// examples:
// sudo time node scripts/flame.js 1.5 -- $(which tape) test/unit/*.js
// sudo time node scripts/flame.js 1.5 -- $(which node) test/index.js
function main(argv) {
    var duration = argv[2];
    var seperator = argv[3];
    var args = argv.slice(4);

    var durationSec = parseFloat(duration, 10);
    assert(typeof durationSec === 'number' &&
        durationSec > 0 && durationSec < 30,
        'duration must be a number');

    assert(seperator === '--',
        'seperator must literally be --');

    assert(process.env.USER === 'root',
        'flame.js must be run as root user');

    var testProc = spawn(args[0], args.slice(1));

    testProc.stdout.pipe(process.stdout);
    testProc.stderr.pipe(process.stderr);

    testProc.on('error', function onError(err) {
        console.error('could not spawn runnable process');
        console.error(args[0], args.slice(1));
        console.error(err);
        process.exit(-1);
    });

    testProc.on('close', function onClose(code) {
        if (code !== 0) {
            process.exit(code);
        }
    });

    var flameProc = spawn('sudo', [
        'node-flame', testProc.pid, 'fullraw', String(durationSec)
    ]);

    flameProc.on('error', function onError(err) {
        console.error('could not spawn flame process');
        console.error(err);
        process.exit(-1);
    });

    flameProc.stderr.pipe(process.stderr);
    flameProc.stdout.pipe(
        fs.createWriteStream(path.join(process.cwd(), 'flame.raw'))
    );

    console.log('pid?: ', testProc.pid);
}

if (require.main === module) {
    main(process.argv);
}
