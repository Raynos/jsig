'use strict';

var ProgramNode = require('./program.js');
var TypeDeclarationNode = require('./type-declaration.js');
var AssignmentNode = require('./assignment.js');
var ImportStatementNode = require('./import-statement.js');
var ObjectNode = require('./object.js');
var UnionTypeNode = require('./union.js');
var IntersectionTypeNode = require('./intersection.js');
var LiteralTypeNode = require('./literal.js');
var FreeLiteralNode = require('./free-literal.js');
var LocationLiteralNode = require('./location-literal.js');
var KeyValueNode = require('./key-value.js');
var ValueLiteralNode = require('./value.js');
var FunctionNode = require('./function.js');
var GenericLiteralNode = require('./generic.js');
var TupleNode = require('./tuple.js');
var RenamedLiteralNode = require('./renamed-literal.js');
var CommentNode = require('./comment.js');

module.exports = {
    program: function program(statements) {
        return new ProgramNode(statements);
    },
    typeDeclaration: function typeDeclaration(id, expr, generics) {
        return new TypeDeclarationNode(id, expr, generics);
    },
    assignment: function assigment(id, expr) {
        return new AssignmentNode(id, expr);
    },
    importStatement: function importStatement(dependency, types) {
        return new ImportStatementNode(dependency, types);
    },
    object: function object(pairs, label, opts) {
        return new ObjectNode(pairs, label, opts);
    },
    union: function union(unions, label, opts) {
        return new UnionTypeNode(unions, label, opts);
    },
    intersection: function intersection(pairs, label, opts) {
        return new IntersectionTypeNode(pairs, label, opts);
    },
    literal: function literal(name, builtin, opts) {
        return new LiteralTypeNode(name, builtin, opts);
    },
    locationLiteral: function locationLiteral(name, loc) {
        return new LocationLiteralNode(name, loc);
    },
    freeLiteral: function freeLiteral(name) {
        return new FreeLiteralNode(name);
    },
    keyValue: function keyValue(key, value, opts) {
        return new KeyValueNode(key, value, opts);
    },
    value: function value($value, name, label) {
        return new ValueLiteralNode($value, name, label);
    },
    functionType: function functionType(opts) {
        return new FunctionNode(opts);
    },
    generic: function generic(value, generics, label) {
        return new GenericLiteralNode(value, generics, label);
    },
    tuple: function tuple(values, label, opts) {
        return new TupleNode(values, label, opts);
    },
    renamedLiteral: function renamedLiteral(token, original, opts) {
        return new RenamedLiteralNode(token, original, opts);
    },
    comment: function comment(text) {
        return new CommentNode(text);
    }
};
