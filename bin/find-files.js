'use strict';

var path = require('path');
var fs = require('fs');
var assert = require('assert');

module.exports = findFiles;

/*
    stat(fileName), if a file then yield.

    if a folder then recurse.
*/
function findFiles(fileName, opts) {
    if (!fs.existsSync(fileName)) {
        return [fileName];
    }

    var stat = fs.statSync(fileName);
    if (stat.isFile()) {
        return [fileName];
    } else if (stat.isDirectory()) {
        var files = [];
        return crawlFolder(files, fileName, opts);
    } else {
        assert(false, 'does not support non file/folder');
    }
}

function crawlFolder(list, folderName, opts) {
    // Do not crawl ignored folders
    if (opts.ignore.indexOf(folderName) !== -1) {
        return list;
    }

    var files = fs.readdirSync(folderName);

    for (var i = 0; i < files.length; i++) {
        var segmentName = files[i];

        // Skip dot files
        if (segmentName[0] === '.') {
            continue;
        } else if (segmentName === 'node_modules') {
            continue;
        }

        var fileName = path.join(folderName, segmentName);

        // Dead symlinks exist in readdir() but not in stat()
        if (!fs.existsSync(fileName)) {
            continue;
        }

        var stat = fs.statSync(fileName);

        if (stat.isFile()) {
            if (path.extname(fileName) === '.js') {
                list.push(fileName);
            }
        } else if (stat.isDirectory()) {
            crawlFolder(list, fileName, opts);
        } else {
            assert(false, 'does not support non file/folder');
        }
    }

    return list;
}
