'use strict';

var TypedError = require('error/typed');
var assert = require('assert');

var serialize = require('../serialize.js');

var TypeClassMismatch = TypedError({
    type: 'jsig.sub-type.type-class-mismatch',
    message: '@{line}: Got unexpected type class. ' +
        'Expected {expected} but got {actual}',
    expected: null,
    actual: null,
    loc: null,
    line: null
});

module.exports = SubTypeChecker;

function SubTypeChecker(meta) {
    this.meta = meta;
}

SubTypeChecker.prototype.checkSubType =
function checkSubType(node, parent, child) {
    assert(node && node.type, 'ast node must have type');
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');

    var result;

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
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }

    assert(typeof result !== 'boolean', 'must return error or null');
    return result;
};

/*eslint complexity: [2, 30]*/
SubTypeChecker.prototype.checkTypeLiteralSubType =
function checkTypeLiteralSubType(node, parent, child) {
    if (!parent.builtin) {
        throw new Error('not implemented, sub type for non-builtin');
    }

    if (parent.name === 'Any:ModuleExports') {
        return null;
    } else if (parent.name === '%Boolean%%Any') {
        return null;
    } else if (parent.name === '%void%%Any') {
        return null;
    } else if (parent.name === 'Function' && child.type === 'function') {
        return null;
    } else if (parent.name === 'Object' && child.type === 'object') {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        return reportTypeMisMatch(node, parent, child);
        // return new Error('[Internal] expected type literal');
    }

    var name = parent.name;
    if (name === 'Object') {
        // TODO: model that Error inherits from Object
        if (child.name !== name && child.name !== 'Error') {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (name === 'Array') {
        if (child.name !== name) {
            return new Error('[Internal] Not an array');
        }
    } else if (name === 'String') {
        if (child.name !== name) {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (name === 'void') {
        if (child.name !== name) {
            return new Error('[Internal] Not a void');
        }
    } else if (name === 'RegExp') {
        if (child.name !== name) {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (name === 'Number') {
        if (child.name !== name) {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (name === 'Boolean') {
        if (child.name !== name) {
            return reportTypeMisMatch(node, parent, child);
        }
    } else if (name === 'Error') {
        if (child.name !== name) {
            return reportTypeMisMatch(node, parent, child);
        }
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
        child.name === '%%Array%Empty'
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

    if (child.type !== 'genericLiteral') {
        return reportTypeMisMatch(node, parent, child);
    }

    var err = this.checkSubType(node, parent.value, child.value);
    if (err) {
        return err;
    }

    if (parent.generics.length !== child.generics.length) {
        throw new Error('generics mismatch');
    }

    for (var i = 0; i < parent.generics.length; i++) {
        err = this.checkSubType(
            node, parent.generics[i], child.generics[i]
        );
        if (err) {
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
        throw new Error('[Internal] function args mismatch');
    }

    for (var i = 0; i < parent.args.length; i++) {
        err = this.checkSubType(node, parent.args[i], child.args[i]);
        if (err) {
            return err;
        }
    }

    return null;
};

SubTypeChecker.prototype.checkObjectSubType =
function checkObjectSubType(node, parent, child) {
    if (child.type !== 'object') {
        return reportTypeMisMatch(node, parent, child);
    }

    if (parent.keyValues.length !== child.keyValues.length) {
        throw new Error('[Internal] object key pairs mismatch');
    }

    var err;
    for (var i = 0; i < parent.keyValues.length; i++) {
        err = this.checkSubType(
            node, parent.keyValues[i].value, child.keyValues[i].value
        );
        if (err) {
            return err;
        }
    }

    return null;
};

SubTypeChecker.prototype.checkUnionSubType =
function checkUnionSubType(node, parent, child) {
    // Check to see that child matches ONE of parent.

    // console.log('check?', {
    //     p: this.meta.serializeType(parent),
    //     c: this.meta.serializeType(child)
    // });

    var childUnions = child.type === 'unionType' ? child.unions : [child];

    var err;
    for (var j = 0; j < childUnions.length; j++) {
        var isBad = true;

        for (var i = 0; i < parent.unions.length; i++) {
            err = this.checkSubType(
                node, parent.unions[i], childUnions[j]
            );
            if (!err) {
                isBad = false;
            }
        }
    }

    // Find all errors?
    return isBad ? err : null;
};

function reportTypeMisMatch(node, parent, child) {
    return TypeClassMismatch({
        expected: serialize(parent._raw || parent),
        actual: serialize(child._raw || child),
        loc: node.loc,
        line: node.loc.start.line
    });
}
