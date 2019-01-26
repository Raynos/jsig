'use strict';

var isSameType = require('./is-same-type.js');

module.exports = getUniqueTypes;

function getUniqueTypes(types) {
    var newTypes = [];

    for (var i = 0; i < types.length; i++) {
        var found = false;
        for (var j = 0; j < newTypes.length; j++) {
            if (isSameType(newTypes[j], types[i])) {
                found = true;
                break;
            }
        }

        if (!found) {
            newTypes.push(types[i]);
        }
    }

    return newTypes;
}
