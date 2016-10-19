'use strict';

/* eslint complexity: [2, 25] */

var assert = require('assert');

var getUnionWithoutBool = require('./lib/get-union-without-bool.js');
var updateObject = require('./lib/update-object.js');
var isSameType = require('./lib/is-same-type.js');
var JsigAST = require('../ast/');

module.exports = NarrowType;

function NarrowType(meta) {
    this.meta = meta;
}

NarrowType.prototype.narrowType =
function narrowType(node, ifBranch, elseBranch) {
    if (node.type === 'UnaryExpression') {
        return this.narrowUnaryExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'Identifier') {
        return this.narrowIdentifier(node, ifBranch, elseBranch);
    } else if (node.type === 'BinaryExpression') {
        return this.narrowBinaryExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'LogicalExpression') {
        return this.narrowLogicalExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'MemberExpression') {
        return this.narrowMemberExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'Literal') {
        return this.narrowLiteral(node, ifBranch, elseBranch);
    } else if (node.type === 'ObjectExpression') {
        return this.narrowObjectExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'CallExpression') {
        return this.narrowCallExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'AssignmentExpression') {
        return this.narrowAssignmentExpression(node, ifBranch, elseBranch);
    } else {
        throw new Error('!! skipping narrowType: ' + node.type);
    }
};

NarrowType.prototype.narrowUnaryExpression =
function narrowUnaryExpression(node, ifBranch, elseBranch) {
    if (node.operator === '!') {
        return this.narrowType(node.argument, elseBranch, ifBranch);
    } else {
        throw new Error('Unsupported operator: ' + node.operator);
    }
};

NarrowType.prototype.narrowIdentifier =
function narrowIdentifier(node, ifBranch, elseBranch) {
    var type = this.meta.verifyNode(node, null);
    if (!type) {
        return null;
    }

    if (ifBranch) {
        var ifType = getUnionWithoutBool(type, true);
        if (ifType) {
            ifBranch.narrowType(node.name, ifType);
        }
    }
    if (elseBranch) {
        var elseType = getUnionWithoutBool(type, false);
        if (elseType) {
            elseBranch.narrowType(node.name, elseType);
        }
    }
};

NarrowType.prototype.narrowBinaryExpression =
function narrowBinaryExpression(node, ifBranch, elseBranch) {
    if (node.left.type === 'UnaryExpression' &&
        node.left.operator === 'typeof'
    ) {
        return this.narrowTypeofExpression(node, ifBranch, elseBranch);
    }

    // TODO: support `x === null`
};

NarrowType.prototype.narrowTypeofExpression =
function narrowTypeofExpression(node, ifBranch, elseBranch) {
    var identifier = node.left.argument;
    if (identifier.type !== 'Identifier') {
        // TODO: support non trivial expressions
        return null;
    }

    if (node.operator !== '===' && node.operator !== '!==') {
        // TODO: support !==, and others... ?
        return null;
    }

    if (node.operator === '!==') {
        var tempBranch = ifBranch;
        ifBranch = elseBranch;
        elseBranch = tempBranch;
    }

    var type = this.meta.verifyNode(identifier, null);
    if (!type) {
        return null;
    }

    if (node.right.type !== 'Literal') {
        // Right hand side of equal operator
        return null;
    }

    return this._narrowByTypeofTag(node, type, ifBranch, elseBranch);
};

NarrowType.prototype._narrowByTypeofTag =
function _narrowByTypeofTag(node, type, ifBranch, elseBranch) {
    var identifier = node.left.argument;
    var typeTagNode = node.right;

    var typeTagValue = typeTagNode.value;
    var elseType;
    if (typeTagValue === 'number' &&
        containsLiteral(type, 'Number')
    ) {
        if (ifBranch) {
            ifBranch.narrowType(
                identifier.name, JsigAST.literal('Number')
            );
        }
        if (elseBranch) {
            // TODO: elseBranch
            elseType = getUnionWithoutLiteral(type, 'Number');
            if (elseType) {
                elseBranch.narrowType(identifier.name, elseType);
            }
        }
    } else if (typeTagValue === 'string' &&
        containsLiteral(type, 'String')
    ) {
        if (ifBranch) {
            ifBranch.narrowType(
                identifier.name, JsigAST.literal('String')
            );
        }
        if (elseBranch) {
            // TODO: elseBranch
            elseType = getUnionWithoutLiteral(type, 'String');
            if (elseType) {
                elseBranch.narrowType(identifier.name, elseType);
            }
        }
    } else {
        // TODO: support other tags
        return null;
    }
};

function getUnionWithoutLiteral(type, literalName) {
    if (type.type !== 'unionType') {
        if (containsLiteral(type, literalName)) {
            return null;
        } else {
            return type;
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (!containsLiteral(t, literalName)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return null;
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function getUnionWithLiteral(type, literalName) {
    if (type.type !== 'unionType') {
        if (containsLiteral(type, literalName)) {
            return type;
        } else {
            return null;
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (containsLiteral(t, literalName)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return null;
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function containsLiteral(type, literalName) {
    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === '%Boolean%%Mixed'
    ) {
        return true;
    }

    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === literalName
    ) {
        return true;
    }

    if (type.type === 'genericLiteral' && type.value.builtin &&
        type.value.name === literalName
    ) {
        return true;
    }

    if (type.type === 'unionType') {
        for (var i = 0; i < type.unions.length; i++) {
            var possibleType = type.unions[i];

            if (containsLiteral(possibleType, literalName)) {
                return true;
            }
        }
    }

    return false;
}

NarrowType.prototype.narrowLiteral =
function narrowLiteral(node, ifBranch, elseBranch) {
    // TODO: support if ("") {
};

NarrowType.prototype.narrowObjectExpression =
function narrowObjectExpression(node, ifBranch, elseBranch) {
    // TODO: ...
};

NarrowType.prototype.narrowCallExpression =
function narrowCallExpression(node, ifBranch, elseBranch) {
    var fnType = this.meta.verifyNode(node.callee, null);
    if (!fnType) {
        return null;
    }

    if (fnType.specialKind === 'isArray') {
        // TODO: Support Array.isArray()
        return this.narrowIsArrayExpression(node, ifBranch, elseBranch);
    }

    // TODO: Support hasOwnProperty()
};

NarrowType.prototype.narrowIsArrayExpression =
function narrowIsArrayExpression(node, ifBranch, elseBranch) {
    var identifier = node.arguments[0];
    if (!identifier || identifier.type !== 'Identifier') {
        // TODO: support non trivial expressions
        return null;
    }

    var type = this.meta.verifyNode(identifier, null);
    if (!type) {
        return null;
    }

    if (containsLiteral(type, 'Array')) {
        if (ifBranch) {
            var ifType = getUnionWithLiteral(type, 'Array');
            ifBranch.narrowType(identifier.name, ifType);
        }
        if (elseBranch) {
            var elseType = getUnionWithoutLiteral(type, 'Array');
            if (elseType) {
                elseBranch.narrowType(identifier.name, elseType);
            }
        }
    }
};

NarrowType.prototype.narrowAssignmentExpression =
function narrowAssignmentExpression(node, ifBranch, elseBranch) {
    // TODO: like identifier, but also side-effect
};

NarrowType.prototype.narrowLogicalExpression =
function narrowLogicalExpression(node, ifBranch, elseBranch) {
    if (node.operator === '||') {
        // TODO: support ||

        this.narrowType(node.left, null, elseBranch);

        if (elseBranch) {
            this.meta.enterBranchScope(elseBranch);
            this.narrowType(node.right, null, elseBranch);
            this.meta.exitBranchScope();
        }

        // Inside IF then
        //      node.left TRUE AND node.right FALSE
        //      node.left TRUE AND node.right TRUE
        //      node.left FALSE AND node.right TRUE
        // Inside ELSE then :
        //      node.left FALSE AND node.right FALSE
    } else if (node.operator === '&&') {
        // TODO: support &&

        this.narrowType(node.left, ifBranch, null);

        if (ifBranch) {
            this.meta.enterBranchScope(ifBranch);
            this.narrowType(node.right, ifBranch, null);
            this.meta.exitBranchScope();
        }

        // Inside IF then
        //      node.left TRUE and node.right TRUE
        // Inside ELSE then :
        //      node.left FALSE and node.right FALSE
        //      node.left TRUE and node.right FALSE
        //      node.left TRUE or node.right FALSE
    } else {
        assert(false, 'unknown logical operator');
    }
};

function isTuple(jsigType) {
    if (!jsigType) {
        return false;
    }

    if (jsigType.type === 'tuple') {
        return true;
    }

    if (jsigType.type !== 'unionType') {
        return false;
    }

    for (var i = 0; i < jsigType.unions.length; i++) {
        if (jsigType.unions[i].type !== 'tuple') {
            return false;
        }
    }

    return true;
}

NarrowType.prototype.narrowMemberExpression =
function narrowMemberExpression(node, ifBranch, elseBranch) {
    // Type of field itself
    var fieldType = this.meta.verifyNode(node, null);
    if (!fieldType) {
        return null;
    }

    // Cannot narrow based on object index operator
    if (node.computed) {
        var objType = this.meta.verifyNode(node.object, null);

        if (isTuple(objType)) {
            return this._narrowTupleMemberExpression(
                node, ifBranch, elseBranch, fieldType, objType
            );
        }

        return null;
    }

    var ifType = getUnionWithoutBool(fieldType, true);
    var elseType = getUnionWithoutBool(fieldType, false);

    assert(node.property.type === 'Identifier', 'property must be field');
    var keyPath = [node.property.name];

    var parent = node.object;
    while (parent.type === 'MemberExpression') {
        assert(parent.property.type === 'Identifier', 'property must be field');
        keyPath.unshift(parent.property.name);

        parent = parent.object;
    }
    if (parent.type === 'Identifier') {
        keyPath.unshift(parent.name);
    } else if (parent.type === 'ThisExpression') {
        keyPath.unshift('this');
    } else {
        assert(false, 'object must be ref');
    }

    // targetType that needs mutation
    var targetType = this.meta.verifyNode(parent, null);

    if (ifBranch && ifType) {
        this._updateObjectAndRestrict(
            ifBranch, targetType, keyPath, ifType
        );
    }
    if (elseBranch && elseType) {
        this._updateObjectAndRestrict(
            elseBranch, targetType, keyPath, elseType
        );
    }
    // TODO: support nullable field check
};

NarrowType.prototype._narrowTupleMemberExpression =
function _narrowTupleMemberExpression(
    node, ifBranch, elseBranch, fieldType, objType
) {
    var ifType = getUnionWithoutBool(fieldType, true);
    var elseType = getUnionWithoutBool(fieldType, false);

    // only support direct checks
    if (node.object.type !== 'Identifier' ||
        node.property.type !== 'Literal'
    ) {
        return null;
    }

    var name = node.object.name;
    var numeralLiteral = node.property.value;

    var keyPath = [name, numeralLiteral];

    if (ifBranch && ifType) {
        this._updateObjectAndRestrict(ifBranch, objType, keyPath, ifType);
    }
    if (elseBranch && elseType) {
        this._updateObjectAndRestrict(elseBranch, objType, keyPath, elseType);
    }

    return null;
};

NarrowType.prototype._updateObjectAndRestrict =
function updateObjectAndRestrict(branch, objType, keyPath, valueType) {
    var newType = updateObject(
        objType, keyPath.slice(1), valueType
    );

    if (!isSameType(newType, objType)) {
        branch.narrowType(keyPath[0], newType);
    }
};

