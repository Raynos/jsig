'use strict';

module.exports = isModuleExportsStatement;

function isModuleExportsStatement(node) {
    if (node.type !== 'ExpressionStatement') {
        return false;
    }

    var expression = node.expression;

    if (expression.type !== 'AssignmentExpression') {
        return false;
    }

    if (expression.operator !== '=') {
        return false;
    }

    var left = expression.left;

    if (left.type !== 'MemberExpression') {
        return false;
    }

    if ((left && !left.object) ||
        (left && left.object && left.object.name !== 'module')
    ) {
        return false;
    }

    if ((left && !left.property) ||
        (left && left.property &&
            left.property.name !== 'exports')
    ) {
        return false;
    }

    return true;
}
