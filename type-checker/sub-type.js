'use strict';

var assert = require('assert');

var Errors = require('./errors.js');
var serialize = require('../serialize.js');
var cloneJSIG = require('./lib/clone-ast.js');
var isSameType = require('./lib/is-same-type.js');

/* TODO:

    Need to add more context for non trivial assignments

    objA = objB

    gives a Number != String type error without fieldname context

*/

module.exports = SubTypeChecker;

function SubTypeChecker(meta) {
    this.meta = meta;
}

function getUnionWithoutOptional(unionType) {
    var newType = null;

    var newUnions = [];
    for (var i = 0; i < unionType.unions.length; i++) {
        var innerType = unionType.unions[i];
        if (innerType.type === 'valueLiteral' &&
            innerType.name === 'undefined'
        ) {
            continue;
        }

        newUnions.push(innerType);
    }

    if (newUnions.length === 1) {
        newType = newUnions[0];
    } else {
        newType = cloneJSIG(unionType);
        newType.unions = newUnions;
    }

    return newType;
}

SubTypeChecker.prototype.checkSubType =
function checkSubType(node, parent, child) {
    assert(node && node.type, 'ast node must have type');
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');

    var result;

    if (parent.optional && child.type === 'unionType') {
        child = getUnionWithoutOptional(child);
    }

    // console.log('checkSubType(' + parent.type + ',' + child.type + ')');
    // console.log('parent: ' + this.meta.serializeType(parent));
    // console.log('child: ' + this.meta.serializeType(child));

    if (parent === child) {
        result = null;
    } else if (parent.type === 'typeLiteral') {
        result = this.checkTypeLiteralSubType(node, parent, child);
    } else if (parent.type === 'genericLiteral') {
        result = this.checkGenericLiteralSubType(node, parent, child);
    } else if (parent.type === 'function') {
        result = this.checkFunctionSubType(node, parent, child);
    } else if (parent.type === 'object') {
        result = this.checkObjectSubType(node, parent, child);
    } else if (parent.type === 'valueLiteral') {
        result = this.checkValueLiteralSubType(node, parent, child);
    } else if (parent.type === 'unionType') {
        result = this.checkUnionSubType(node, parent, child);
    } else if (parent.type === 'freeLiteral') {
        return reportTypeMisMatch(node, parent, child);
    } else if (parent.type === 'intersectionType') {
        return this.checkIntersectionSubType(node, parent, child);
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }

    assert(typeof result !== 'boolean', 'must return error or null');
    return result;
};

SubTypeChecker.prototype._checkSpecialTypeLiteralSubType =
function _checkSpecialTypeLiteralSubType(node, parent, child) {
    if (parent.name === '%Export%%ModuleExports') {
        return null;
    } else if (parent.name === '%Boolean%%Mixed') {
        return null;
    } else if (parent.name === '%Mixed%%UnknownExportsField') {
        return null;
    } else if (parent.name === '%Void%%UnknownReturn') {
        return null;
    } else if (parent.name === 'Function' && child.type === 'function') {
        return null;
    } else if (parent.name === 'Object' && child.type === 'object') {
        return null;
    }

    if (parent.name === 'Function' && child.type === 'intersectionType') {
        var types = child.intersections;
        for (var i = 0; i < types.length; i++) {
            if (types[i].type === 'function') {
                return null;
            }
        }
    }
};

/*eslint complexity: [2, 30]*/
SubTypeChecker.prototype.checkTypeLiteralSubType =
function checkTypeLiteralSubType(node, parent, child) {
    if (!parent.builtin && !parent.isGeneric) {
        return reportTypeMisMatch(node, parent, child);
    }

    if (parent.isGeneric) {
        if (!child.isGeneric) {
            return reportTypeMisMatch(node, parent, child);
        }

        if (parent.name !== child.name) {
            return reportTypeMisMatch(node, parent, child);
        }

        return null;
    }

    if (this._checkSpecialTypeLiteralSubType(node, parent, child) === null) {
        return null;
    }

    if (parent.optional && child.type === 'valueLiteral' &&
        child.name === 'undefined'
    ) {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        return reportTypeMisMatch(node, parent, child);
    }

    /* optional vs strict must match */
    if (!parent.optional && child.optional) {
        return reportTypeMisMatch(node, parent, child);
    }

    var name = parent.name;
    if (name === 'Object') {
        // TODO: model that Error inherits from Object
        if (child.name !== name && child.name !== 'Error') {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (child.name !== name) {
        return reportTypeMisMatch(node, parent, child);
    } else if (child.name === name) {
        return null;
    } else {
        throw new Error('NotImplemented: ' + parent.name);
    }
};

SubTypeChecker.prototype.checkValueLiteralSubType =
function checkValueLiteralSubType(node, parent, child) {
    if (parent.name === 'null' && child.type === 'typeLiteral' &&
        child.builtin && child.name === '%Null%%Default'
    ) {
        return null;
    }

    if (child.type !== 'valueLiteral') {
        return reportTypeMisMatch(node, parent, child);
    }

    var name = parent.name;
    if (name === 'null') {
        if (child.name !== name) {
            return new Error('[Internal] Not null');
        }
    } else if (name === 'undefined') {
        if (child.name !== name) {
            return new Error('[Internal] Not undefined');
        }
    } else if (name === 'string') {
        if (child.name !== 'string') {
            return new Error('[Internal] Not a string');
        }

        if (child.value !== parent.value) {
            return reportTypeMisMatch(node, parent, child);
        }
    } else {
        // console.log('valueLiteral?', {
        //     p: parent,
        //     c: child
        // });
        throw new Error('NotImplemented: ' + parent.type);
    }
};

SubTypeChecker.prototype.checkGenericLiteralSubType =
function checkGenericLiteralSubType(node, parent, child) {
    if (parent.value.name === 'Array' &&
        parent.value.builtin &&
        child.type === 'typeLiteral' &&
        child.name === '%Array%%Empty'
    ) {
        return null;
    }

    if (parent.value.name === 'Object' &&
        parent.value.builtin &&
        child.type === 'typeLiteral' &&
        child.name === '%Object%%Empty'
    ) {
        return null;
    }

    if (parent.value.name === 'Object' &&
        parent.value.builtin &&
        child.type === 'object' &&
        parent.generics[0].name === 'String' &&
        parent.generics[0].builtin
    ) {
        var valueType = parent.generics[1];

        for (var i = 0; i < child.keyValues.length; i++) {
            var pair = child.keyValues[i];

            var err = this.checkSubType(node, valueType, pair.value);
            if (err) {
                return err;
            }
        }

        return null;
    }

    if (child.type !== 'genericLiteral') {
        return reportTypeMisMatch(node, parent, child);
    }

    var isSame = isSameType(parent.value, child.value);
    if (!isSame) {
        return reportTypeMisMatch(node, parent, child);
    }

    if (parent.generics.length !== child.generics.length) {
        throw new Error('generics mismatch');
    }

    for (i = 0; i < parent.generics.length; i++) {
        isSame = isSameType(parent.generics[i], child.generics[i]);

        if (!isSame) {
            return reportTypeMisMatch(node, parent, child);
        }
    }

    return null;
};

SubTypeChecker.prototype.checkFunctionSubType =
function checkFunctionSubType(node, parent, child) {
    if (child.type !== 'function') {
        return reportTypeMisMatch(node, parent, child);
    }

    var err = this.checkSubType(node, parent.result, child.result);
    if (err) {
        return err;
    }

    if (parent.thisArg) {
        err = this.checkSubType(node, parent.thisArg, child.thisArg);
        if (err) {
            return err;
        }
    }

    if (parent.args.length !== child.args.length) {
        return reportTypeMisMatch(node, parent, child);
    }

    for (var i = 0; i < parent.args.length; i++) {
        /* function args must be the same type, aka invariant */
        var isSame = isSameType(parent.args[i], child.args[i]);

        if (!isSame) {
            return reportTypeMisMatch(node, parent.args[i], child.args[i]);
        }
    }

    return null;
};

SubTypeChecker.prototype.checkObjectSubType =
function checkObjectSubType(node, parent, child) {
    if (child.type !== 'object') {
        return reportTypeMisMatch(node, parent, child);
    }

    var minimumFields = 0;
    for (var i = 0; i < parent.keyValues.length; i++) {
        if (!parent.keyValues[i].optional) {
            minimumFields++;
        }
    }

    // If parent has optional keys, then child must have
    // somewhere between "required keys" and "all keys"
    if (child.keyValues.length < minimumFields) {
        return Errors.IncorrectFieldCount({
            expected: serialize(parent._raw || parent),
            expectedFields: parent.keyValues.length,
            actual: serialize(child._raw || child),
            actualFields: child.keyValues.length,
            loc: node.loc,
            line: node.loc.start.line
        });
    }

    var err;
    var childIndex = buildIndex(child.keyValues);
    for (i = 0; i < parent.keyValues.length; i++) {
        // TODO: check key names...
        var pair = parent.keyValues[i];

        var childType = childIndex[pair.key];
        if (!childType && pair.optional) {
            continue;
        }

        if (!childType) {
            return Errors.MissingExpectedField({
                expected: serialize(parent._raw || parent),
                actual: serialize(child._raw || child),
                expectedName: pair.key,
                loc: node.loc,
                line: node.loc.start.line
            });
        }

        err = this.checkSubType(node, pair.value, childType);
        if (err) {
            return err;
        }
    }

    // For all extra keys, they are allowed...
    return null;
};

function buildIndex(list) {
    var index = {};
    for (var i = 0; i < list.length; i++) {
        index[list[i].key] = list[i].value;
    }

    return index;
}

SubTypeChecker.prototype.checkUnionSubType =
function checkUnionSubType(node, parent, child) {
    // Check to see that child matches ONE of parent.

    var childUnions = child.type === 'unionType' ? child.unions : [child];

    var err;
    var possibleErrors = [];
    var errors = [];
    for (var j = 0; j < childUnions.length; j++) {
        var isBad = true;

        for (var i = 0; i < parent.unions.length; i++) {
            err = this.checkSubType(
                node, parent.unions[i], childUnions[j]
            );
            if (!err) {
                isBad = false;
            } else {
                possibleErrors.push(err);
            }
        }

        if (isBad) {
            for (var k = 0; k < possibleErrors.length; k++) {
                errors.push(possibleErrors[k]);
            }
        }
    }

    if (!isBad) {
        return null;
    }

    var finalErr = Errors.UnionTypeClassMismatch({
        expected: serialize(parent._raw || parent),
        actual: serialize(child._raw || child),
        loc: node.loc,
        line: node.loc.start.line
    });

    finalErr.originalErrors = errors;
    return finalErr;
};

SubTypeChecker.prototype.checkIntersectionSubType =
function checkIntersectionSubType(node, parent, child) {
    /* TODO: pretty errors & branchType */

    // TODO: what if child is intersectionType
    var childTypes = child.type === 'intersectionType' ?
        child.intersections : [child];

    var allTypes = parent.intersections;
    for (var i = 0; i < allTypes.length; i++) {
        var currType = allTypes[i];
        var err = null;
        var isGood = false;

        for (var j = 0; j < childTypes.length; j++) {
            var error = this.checkSubType(node, currType, childTypes[j]);
            if (!err) {
                isGood = true;
            } else {
                err = error;
            }
        }

        if (!isGood) {
            return err;
        }

        // var err = this.checkSubType(node, currType, child);
        // if (err) {
        //     return err;
        // }
    }

    return null;
};

function reportTypeMisMatch(node, parent, child) {
    return Errors.TypeClassMismatch({
        expected: serialize(parent._raw || parent),
        actual: serialize(child._raw || child),
        loc: node.loc,
        line: node.loc.start.line
    });
}
