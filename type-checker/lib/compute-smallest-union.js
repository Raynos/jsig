'use strict';

var isSameType = require('./is-same-type.js');
var JsigAST = require('../../ast/');

module.exports = computeSmallestUnion;

function computeSmallestUnion(node, t1, t2) {
    var parts = [];
    addPossibleType(parts, t1);
    addPossibleType(parts, t2);

    if (parts.length === 0) {
        return null;
    }

    if (parts.length === 1) {
        return parts[0];
    }

    var minimal = _computeSmallestCommonTypes(node, parts);

    // Again, find smallest common type in reverse ??
    // var reverseMinimal = parts.slice();
    // reverseMinimal.reverse();
    // reverseMinimal = this._computeSmallestCommonTypes(node, reverseMinimal);

    // // Only use reverse minimal if smaller.
    // if (reverseMinimal.length < minimal.length) {
    //     minimal = reverseMinimal;
    // }

    if (minimal.length === 1) {
        return minimal[0];
    }

    return JsigAST.union(minimal);
}

function _computeSmallestCommonTypes(node, list) {
    var minimal = [];

    for (var i = 0; i < list.length; i++) {
        var sample = list[i];
        var toAdd = sample;

        for (var j = 0; j < minimal.length; j++) {
            var possible = minimal[j];

            if (isSameType(sample, possible)) {
                toAdd = null;
                break;
            }

            /* if a super type of the other then remove from union */
            // TODO: this seems so naive...
            // var isSuper = this.meta.isSubType(node, possible, sample);
            // if (isSuper) {
            //     toAdd = null;
            //     break;
            // }
        }

        if (toAdd) {
            minimal.push(toAdd);
        }
    }

    return minimal;
}

function addPossibleType(list, maybeType) {
    if (!maybeType) {
        return;
    }

    if (maybeType.type !== 'unionType') {
        list.push(maybeType);
        return;
    }

    for (var i = 0; i < maybeType.unions.length; i++) {
        addPossibleType(list, maybeType.unions[i]);
    }
}
