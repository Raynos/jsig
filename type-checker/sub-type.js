'use strict';

var assert = require('assert');

var JsigAST = require('../ast/');
var Errors = require('./errors.js');
var serialize = require('../serialize.js');
var isSameType = require('./lib/is-same-type.js');

module.exports = SubTypeChecker;

function SubTypeChecker(meta, node) {
    assert(node && node.type, 'ast node must have type');

    this.meta = meta;
    this.node = node;

    this.stack = [];

    this.leftSeen = [];
    this.rightSeen = [];
}

// TODO: pretty sure this function is needed...
// function getUnionWithoutOptional(unionType) {
//     var newType = null;

//     var newUnions = [];
//     for (var i = 0; i < unionType.unions.length; i++) {
//         var innerType = unionType.unions[i];
//         if (innerType.type === 'valueLiteral' &&
//             innerType.name === 'undefined'
//         ) {
//             continue;
//         }

//         newUnions.push(innerType);
//     }

//     if (newUnions.length === 1) {
//         newType = newUnions[0];
//     } else {
//         newType = cloneJSIG(unionType);
//         newType.unions = newUnions;
//     }

//     return newType;
// }

SubTypeChecker.prototype.checkSubType =
function checkSubType(parent, child, labelName) {
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');
    assert(labelName, 'labelName is mandatory');

    var result;
    this.stack.push(labelName);

    if (parent.type === 'typeLiteral' && !parent.builtin &&
        !parent.isGeneric
    ) {
        assert(false,
            'parent cannot be non-builtin type literal: ' + parent.name);
    }
    if (child.type === 'typeLiteral' && !child.builtin &&
        !child.isGeneric
    ) {
        assert(false,
            'child cannot be non-builtin type literal: ' + child.name);
    }

    // Avoid cycles
    var pIndex = this.leftSeen.indexOf(parent);
    if (pIndex !== -1) {
        var cIndex = this.rightSeen.indexOf(child);
        if (pIndex === cIndex) {
            this.stack.pop();
            return null;
        }
    }

    this.leftSeen.push(parent);
    this.rightSeen.push(child);

    // console.log('checkSubType(' + parent.type + ',' + child.type + ')');
    // console.log('parent: ' + this.meta.serializeType(parent));
    // console.log('child: ' + this.meta.serializeType(child));

    result = this._checkSubType(parent, child);
    assert(typeof result !== 'boolean', 'must return error or null');
    this.stack.pop();
    return result;
};

SubTypeChecker.prototype._checkSubType =
function _checkSubType(parent, child) {
    var result;

    if (parent.type !== 'unionType' && child.type === 'unionType') {
        /* handle assigning union into parent */

        // TODO: better error message?
        for (var i = 0; i < child.unions.length; i++) {
            result = this._checkSubType(parent, child.unions[i]);
            if (result) {
                return result;
            }
        }

        return null;
    }

    if (parent === child) {
        result = null;
    } else if (parent.type === 'typeLiteral') {
        result = this.checkTypeLiteralSubType(parent, child);
    } else if (parent.type === 'genericLiteral') {
        result = this.checkGenericLiteralSubType(parent, child);
    } else if (parent.type === 'function') {
        result = this.checkFunctionSubType(parent, child);
    } else if (parent.type === 'object') {
        result = this.checkObjectSubType(parent, child);
    } else if (parent.type === 'valueLiteral') {
        result = this.checkValueLiteralSubType(parent, child);
    } else if (parent.type === 'unionType') {
        result = this.checkUnionSubType(parent, child);
    } else if (parent.type === 'freeLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    } else if (parent.type === 'intersectionType') {
        return this.checkIntersectionSubType(parent, child);
    } else if (parent.type === 'tuple') {
        return this.checkTupleSubType(parent, child);
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }

    return result;
};

SubTypeChecker.prototype._checkSpecialTypeLiteralSubType =
function _checkSpecialTypeLiteralSubType(parent, child) {
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
function checkTypeLiteralSubType(parent, child) {
    if (!parent.builtin && !parent.isGeneric) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.isGeneric) {
        if (!child.isGeneric) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        if (parent.name !== child.name) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        if (parent.genericIdentifierUUID !==
            child.genericIdentifierUUID
        ) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        return null;
    }

    if (this._checkSpecialTypeLiteralSubType(parent, child) === null) {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var name = parent.name;
    if (name === 'Object') {
        // TODO: model that Error inherits from Object
        if (child.name !== name && child.name !== 'Error') {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }
    } else if (child.name !== name) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    } else if (child.name === name) {
        return null;
    } else {
        throw new Error('NotImplemented: ' + parent.name);
    }
};

SubTypeChecker.prototype._maybeConvertToValueLiteral =
function _maybeConvertToValueLiteral(childType) {
    if (childType.type === 'typeLiteral' &&
        childType.builtin && childType.name === 'String' &&
        typeof childType.concreteValue === 'string'
    ) {
        return JsigAST.value(
            '"' + childType.concreteValue + '"', 'string'
        );
    }
    return childType;
};

SubTypeChecker.prototype.checkValueLiteralSubType =
function checkValueLiteralSubType(parent, child) {
    if (parent.name === 'null' && child.type === 'typeLiteral' &&
        child.builtin && child.name === '%Null%%Default'
    ) {
        return null;
    }

    if (child.type === 'typeLiteral') {
        child = this._maybeConvertToValueLiteral(child);
    }

    if (child.type !== 'valueLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
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

        var childValue = child.value.replace(/\'/g, '"');
        var parentValue = parent.value.replace(/\'/g, '"');

        if (childValue !== parentValue) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
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
function checkGenericLiteralSubType(parent, child) {
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

    var err;
    if (parent.value.name === 'Object' &&
        parent.value.builtin &&
        child.type === 'object' &&
        parent.generics[0].name === 'String' &&
        parent.generics[0].builtin
    ) {
        var valueType = parent.generics[1];

        for (var i = 0; i < child.keyValues.length; i++) {
            var pair = child.keyValues[i];

            err = this.checkSubType(
                valueType, pair.value, 'keyValue.' + pair.key
            );
            if (err) {
                return err;
            }
        }

        return null;
    }

    if (child.type !== 'genericLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var isSame = isSameType(parent.value, child.value);
    if (!isSame) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.generics.length !== child.generics.length) {
        throw new Error('generics mismatch');
    }

    var parentName = parent.value.name;

    for (i = 0; i < parent.generics.length; i++) {
        var len = parent.generics.length;
        var err1 = this.checkSubType(
            parent.generics[i], child.generics[i],
            'generics.' + parentName + '.' + i + ',' + len
        );

        if (err1) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        var err2 = this.checkSubType(
            child.generics[i], parent.generics[i],
            'generics.' + parentName + '.' + i + ',' + len
        );

        if (err2) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }
    }

    return null;
};

SubTypeChecker.prototype.checkFunctionSubType =
function checkFunctionSubType(parent, child) {
    if (child.type !== 'function') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var err = this.checkSubType(
        parent.result, child.result, 'function.result'
    );
    if (err) {
        return err;
    }

    if (parent.thisArg) {
        if (!child.thisArg) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        assert(!parent.thisArg.optional, 'do not support optional thisArg');
        assert(!child.thisArg.optional, 'do not support optional thisArg');

        err = this.checkSubType(
            parent.thisArg.value, child.thisArg.value, 'function.thisArg'
        );
        if (err) {
            return err;
        }
    }

    if (parent.args.length !== child.args.length) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var len = parent.args.length;
    for (var i = 0; i < parent.args.length; i++) {
        /* function args must be the same type, aka invariant */
        var isSame = isSameType(parent.args[i].value, child.args[i].value) &&
            parent.args[i].optional === child.args[i].optional;

        if (!isSame) {
            return this._reportTypeMisMatch(
                parent.args[i], child.args[i],
                'function.args.' + i + ',' + len
            );
        }
    }

    return null;
};

SubTypeChecker.prototype.checkTupleSubType =
function checkTupleSubType(parent, child) {
    if (child.type !== 'tuple') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.values.length !== child.values.length) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var len = parent.values.length;
    for (var i = 0; i < parent.values.length; i++) {
        var isSame = isSameType(parent.values[i], child.values[i]);

        if (!isSame) {
            return this._reportTypeMisMatch(
                parent.values[i], child.values[i],
                'tuple.values.' + i + ',' + len
            );
        }
    }

    return null;
};

SubTypeChecker.prototype.checkObjectSubType =
function checkObjectSubType(parent, child) {
    if (child.type !== 'object' && child.type !== 'intersectionType') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var minimumFields = 0;
    for (var i = 0; i < parent.keyValues.length; i++) {
        if (!parent.keyValues[i].optional) {
            minimumFields++;
        }
    }

    var childFieldCount = null;
    if (child.type === 'object') {
        childFieldCount = child.keyValues.length;
    } else if (child.type === 'intersectionType') {
        childFieldCount = 0;
        for (i = 0; i < child.intersections.length; i++) {
            var maybeObj = child.intersections[i];
            if (maybeObj.type === 'object') {
                childFieldCount += maybeObj.keyValues.length;
            }
        }
    }

    // If parent has optional keys, then child must have
    // somewhere between "required keys" and "all keys"
    // TODO: extra safety for objects with extra fields
    if (childFieldCount < minimumFields) {
        return Errors.IncorrectFieldCount({
            expected: serialize(parent._raw || parent),
            expectedFields: parent.keyValues.length,
            actual: serialize(child._raw || child),
            actualFields: childFieldCount,
            loc: this.node.loc,
            line: this.node.loc.start.line
        });
    }

    var err;
    var childIndex = child.buildObjectIndex();
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
                loc: this.node.loc,
                line: this.node.loc.start.line
            });
        }

        err = this.checkSubType(pair.value, childType, 'keyValue.' + pair.key);
        if (err) {
            return err;
        }
    }

    if (child.inferred) {
        var parentIndex = parent.buildObjectIndex();
        for (i = 0; i < child.keyValues.length; i++) {
            pair = child.keyValues[i];

            var fieldName = pair.key;

            if (!parentIndex[fieldName]) {
                return Errors.UnexpectedExtraField({
                    expected: serialize(parent._raw || parent),
                    actual: serialize(child._raw || child),
                    fieldName: fieldName,
                    loc: this.node.loc,
                    line: this.node.loc.start.line
                });
            }
        }
    }

    // For all extra keys, they are allowed...
    return null;
};

SubTypeChecker.prototype.checkUnionSubType =
function checkUnionSubType(parent, child) {
    // Check to see that child matches ONE of parent.

    var childUnions = child.type === 'unionType' ? child.unions : [child];

    var err;
    var possibleErrors = [];
    var errors = [];
    for (var j = 0; j < childUnions.length; j++) {
        var isBad = true;

        for (var i = 0; i < parent.unions.length; i++) {
            var len = parent.unions.length;
            err = this.checkSubType(
                parent.unions[i], childUnions[j],
                'unionType.' + i + ',' + len
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
        loc: this.node.loc,
        line: this.node.loc.start.line
    });

    finalErr.originalErrors = errors;
    return finalErr;
};

SubTypeChecker.prototype.checkIntersectionSubType =
function checkIntersectionSubType(parent, child) {
    /* TODO: pretty errors & branchType */

    var isObject = true;
    for (var i = 0; i < parent.intersections.length; i++) {
        if (parent.intersections[i].type !== 'object') {
            isObject = false;
        }
    }

    // If all intersections are objects then treat as object.
    if (isObject) {
        var keyValues = [];
        for (i = 0; i < parent.intersections.length; i++) {
            var currObj = parent.intersections[i];
            for (var j = 0; j < currObj.keyValues.length; j++) {
                keyValues.push(currObj.keyValues[j]);
            }
        }

        var parentObj = JsigAST.object(keyValues, null);
        return this.checkSubType(parentObj, child, 'skip');
    }

    // TODO: what if child is intersectionType
    var childTypes = child.type === 'intersectionType' ?
        child.intersections : [child];

    var allTypes = parent.intersections;
    for (i = 0; i < allTypes.length; i++) {
        var currType = allTypes[i];
        var err = null;
        var isGood = false;

        var len = allTypes.length;
        for (j = 0; j < childTypes.length; j++) {
            var error = this.checkSubType(
                currType, childTypes[j],
                'intersectionType.' + i + ',' + len
            );
            if (!error) {
                isGood = true;
            } else {
                err = error;
            }
        }

        if (!isGood) {
            return err;
        }

        // var err = this.checkSubType(currType, child);
        // if (err) {
        //     return err;
        // }
    }

    return null;
};

SubTypeChecker.prototype._reportTypeMisMatch =
function _reportTypeMisMatch(parent, child, labelName) {
    assert(labelName, 'labelName is mandatory');

    this.stack.push(labelName);
    var err = this._buildTypeClassError(parent, child);
    this.stack.pop();

    return err;
};

SubTypeChecker.prototype._buildKeyPathType =
function _buildKeyPathType(finalValue) {
    var stack = this.stack;
    var currentType = finalValue;

    for (var i = stack.length - 1; i >= 0; i--) {
        var item = stack[i];
        var range;
        var list;

        // intersectionType

        if (item === 'root' || item === 'terminal' || item === 'skip') {
            continue;
        } else if (item.indexOf('keyValue') === 0) {
            var keyName = item.slice(9);

            currentType = JsigAST.object([
                JsigAST.keyValue(keyName, currentType)
            ]);
        } else if (item.indexOf('unionType') === 0) {
            range = item.slice(10);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.union(list);
        } else if (item.indexOf('intersectionType') === 0) {
            range = item.slice(17);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.intersection(list);
        } else if (item.indexOf('generics') === 0) {
            var segments = item.split('.');
            assert(segments.length === 3, 'expected three parts: ' + item);
            var parentName = segments[1];
            range = segments[2];
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.generic(
                JsigAST.literal(parentName), list
            );
        } else if (item.indexOf('function.args') === 0) {
            range = item.slice(14);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.functionType({
                args: list,
                result: JsigAST.literal('_', true)
            });
        } else if (item.indexOf('tuple.values') === 0) {
            range = item.slice(13);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.tuple(list);
        } else if (item === 'function.result') {
            currentType = JsigAST.functionType({
                args: [JsigAST.literal('...', true)],
                result: currentType
            });
        } else if (item === 'function.thisArg') {
            currentType = JsigAST.functionType({
                args: [JsigAST.literal('...', true)],
                thisArg: JsigAST.keyValue('this', currentType),
                result: JsigAST.literal('_', true)
            });
        } else {
            assert(false, 'unexpected item in keyPath stack: ' + item);
        }
    }

    return currentType;
};

SubTypeChecker.prototype._buildListFromRange =
function _buildListFromRange(range, valueType) {
    var arr = [];

    var parts = range.split(',');
    assert(parts.length === 2, 'expected two parts for: ' + range);

    var index = parseInt(parts[0], 10);
    var length = parseInt(parts[1], 10);

    for (var i = 0; i < length; i++) {
        if (i === index) {
            arr[i] = valueType;
        } else {
            arr[i] = JsigAST.literal('_', true);
        }
    }

    return arr;
};

SubTypeChecker.prototype._buildTypeClassError =
function _buildTypeClassError(parent, child) {
    var expected = serialize(
        this._buildKeyPathType(parent._raw || parent)
    );
    var actual = serialize(
        this._buildKeyPathType(child._raw || child)
    );

    // console.log('stack', this.stack);

    var err = Errors.TypeClassMismatch({
        expected: expected,
        actual: actual,
        _parent: parent,
        _child: child,
        loc: this.node.loc,
        line: this.node.loc.start.line
    });

    return err;
};
