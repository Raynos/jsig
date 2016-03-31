'use strict';

// var assert = require('assert');

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

function getUnionWithoutBool(type, truthy) {
    if (type.type !== 'unionType') {
        return type;
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (
            (truthy && !isAlwaysFalsey(t)) ||
            (!truthy && !isAlwaysTruthy(t))
        ) {
            unions.push(t);
        }
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions, type.label);
}

// handle more literals like 0 or "" or false
function isAlwaysTruthy(t) {
    return !(
        (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'typeLiteral' && t.name === 'String') ||
        (t.type === 'typeLiteral' && t.name === 'Boolean') ||
        (t.type === 'typeLiteral' && t.name === 'Number')
    );
}

function isAlwaysFalsey(t) {
    return (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null');
}
