'use strict';

var MemoryDB = require('./2-memory-db.js');

function main() {
    var db1 = new MemoryDB();
    var db2 = new MemoryDB();

    db1.set('key', 'value');
    db2.set('other', 'wat');

    replicate(db1, db2);
    replicate(db2, db1);
}

function replicate(db1, db2) {
    var keys = db1.keys();
    for (var i = 0; i < keys.length; i++) {
        db2.set(keys[i], db1.get(keys[i]));
    }
}

main();
