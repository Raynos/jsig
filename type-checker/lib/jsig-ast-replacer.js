'use strict';

var assert = require('assert');

module.exports = JsigASTReplacer;

function JsigASTReplacer(replacer, neverRaw) {
    this.replacer = replacer;
    this.neverRaw = Boolean(neverRaw);
}

/*eslint complexity: [2, 80], max-statements: [2, 120]*/
JsigASTReplacer.prototype.inlineReferences =
function inlineReferences(ast, rawAst, stack) {
    assert(Array.isArray(stack), 'must pass in a stack');
    var i;

    if (ast.type === 'program') {
        var newStatements = [];
        stack.push('statements');
        for (i = 0; i < ast.statements.length; i++) {
            stack.push(i);
            var t = this.inlineReferences(
                ast.statements[i], rawAst.statements[i], stack
            );
            stack.pop();
            if (t) {
                newStatements.push(t);
            }
        }
        stack.pop();
        ast.statements = newStatements;
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeDeclaration') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return null;
    } else if (ast.type === 'assignment') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'defaultExport') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'function') {
        stack.push('args');
        for (i = 0; i < ast.args.length; i++) {
            stack.push(i);
            ast.args[i] = this.inlineReferences(
                ast.args[i], rawAst.args[i], stack
            );
            stack.pop();
        }
        stack.pop();

        if (ast.thisArg) {
            stack.push('thisArg');
            ast.thisArg = this.inlineReferences(
                ast.thisArg, rawAst.thisArg, stack
            );
            stack.pop();
        }
        if (ast.result) {
            stack.push('result');
            ast.result = this.inlineReferences(
                ast.result, rawAst.result, stack
            );
            stack.pop();
        }

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeLiteral') {
        if (ast.builtin || ast.isGeneric) {
            ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        return this.replacer.replace(ast, rawAst, stack);
    } else if (ast.type === 'genericLiteral') {
        if (ast.value.builtin) {
            stack.push('value');
            ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
            stack.pop();

            stack.push('generics');
            for (i = 0; i < ast.generics.length; i++) {
                stack.push(i);
                ast.generics[i] = this.inlineReferences(
                    ast.generics[i], rawAst.generics[i], stack
                );
                stack.pop();
            }
            stack.pop();

            ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        return this.replacer.replace(ast, rawAst, stack);
        // console.log('ast.value', ast.value);
        // throw new Error('git rekt');
    } else if (ast.type === 'object') {
        stack.push('keyValues');
        for (i = 0; i < ast.keyValues.length; i++) {
            stack.push(i);
            ast.keyValues[i] = this.inlineReferences(
                ast.keyValues[i], rawAst.keyValues[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'tuple') {
        stack.push('values');
        for (i = 0; i < ast.values.length; i++) {
            stack.push(i);
            ast.values[i] = this.inlineReferences(
                ast.values[i], rawAst.values[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw | rawAst);
        return ast;
    } else if (ast.type === 'keyValue') {
        stack.push('value');
        ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'param') {
        stack.push('value');
        ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'unionType') {
        stack.push('unions');
        for (i = 0; i < ast.unions.length; i++) {
            stack.push(i);
            ast.unions[i] = this.inlineReferences(
                ast.unions[i], rawAst.unions[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'intersectionType') {
        stack.push('intersections');
        for (i = 0; i < ast.intersections.length; i++) {
            stack.push(i);
            ast.intersections[i] = this.inlineReferences(
                ast.intersections[i], rawAst.intersections[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'valueLiteral') {
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'comment') {
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'import') {
        return this.replacer.replace(ast, rawAst, stack);
    } else {
        throw new Error('unknown ast type: ' + ast.type);
    }
};
