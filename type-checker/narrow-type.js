'use strict';

var assert = require('assert');

var getUnionWithoutBool = require('./lib/get-union-without-bool.js');
var JsigAST = require('../ast.js');

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
    var type = this.meta.verifyNode(node);

    var ifType = getUnionWithoutBool(type, true);
    var elseType = getUnionWithoutBool(type, false);

    ifBranch.restrictType(node.name, ifType);
    elseBranch.restrictType(node.name, elseType);
};

NarrowType.prototype.narrowBinaryExpression =
function narrowBinaryExpression(node, ifBranch, elseBranch) {
    // TODO: support `x === null`
    // TODO: support `typeof y === "{{tag}}"`
};

NarrowType.prototype.narrowLogicalExpression =
function narrowLogicalExpression(node, ifBranch, elseBranch) {
    // TODO: support ||
    // TODO: support &&
};

NarrowType.prototype.narrowMemberExpression =
function narrowMemberExpression(node, ifBranch, elseBranch) {
    // targetType that needs mutation
    var targetType = this.meta.verifyNode(node.object);

    var objectName;
    if (node.object.type === 'Identifier') {
        objectName = node.object.name;
    } else if (node.object.type === 'ThisExpression') {
        objectName = 'this';
    } else {
        assert(false, 'object must be ref');
    }

    // Type of field itself
    var fieldType = this.meta.verifyNode(node);

    assert(node.property.type === 'Identifier', 'property must be field');
    var fieldName = node.property.name;

    var ifType = getUnionWithoutBool(fieldType, true);
    var elseType = getUnionWithoutBool(fieldType, false);

    var ifPairs = [];
    var elsePairs = [];

    assert(targetType.type === 'object');
    for (var i = 0; i < targetType.keyValues.length; i++) {
        var pair = targetType.keyValues[i];
        if (pair.key !== fieldName) {
            ifPairs.push(JsigAST.keyValue(pair.key, pair.value));
            elsePairs.push(JsigAST.keyValue(pair.key, pair.value));
            continue;
        }

        ifPairs.push(JsigAST.keyValue(pair.key, ifType));
        elsePairs.push(JsigAST.keyValue(pair.key, elseType));
    }

    var ifObjectType = JsigAST.object(ifPairs);
    var elseObjectType = JsigAST.object(elsePairs);

    ifBranch.restrictType(objectName, ifObjectType);
    elseBranch.restrictType(objectName, elseObjectType);

    // TODO: support nullable field check
};
