'use strict';

module.exports = TypeDeclarationNode;

function TypeDeclarationNode(identifier, expr, generics) {
    generics = generics || [];

    this.type = 'typeDeclaration';
    this.identifier = identifier;
    this.typeExpression = expr;
    this.generics = generics;
    this._raw = null;
}
