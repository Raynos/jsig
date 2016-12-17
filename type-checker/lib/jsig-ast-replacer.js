'use strict';

var assert = require('assert');

module.exports = JsigASTReplacer;

function JsigASTReplacer(replacer, neverRaw, replaceGeneric) {
    this.replacer = replacer;
    this.neverRaw = Boolean(neverRaw);
    this.replaceGeneric = Boolean(replaceGeneric);

    this.currentTypeDeclaration = null;
}

/*eslint complexity: [2, 80], max-statements: [2, 150]*/
JsigASTReplacer.prototype.inlineReferences =
function inlineReferences(ast, rawAst, stack) {
    assert(Array.isArray(stack), 'must pass in a stack');
    var i;

    // console.log('inlineReferences()', ast && ast.type, stack);

    var neverRaw = this.neverRaw;

    if (ast.type === 'program') {
        var newStatements = [];
        stack.push('statements');
        for (i = 0; i < ast.statements.length; i++) {
            stack.push(i);
            var t = this.inlineReferences(
                ast.statements[i],
                (rawAst && rawAst.statements) ?
                    rawAst.statements[i] : null,
                stack
            );
            stack.pop();
            if (t) {
                newStatements.push(t);
            }
        }
        stack.pop();
        ast.statements = newStatements;
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeDeclaration') {
        this.currentTypeDeclaration = ast;

        var newGenerics = [];
        stack.push('generics');
        for (i = 0; i < ast.generics.length; i++) {
            stack.push(i);
            newGenerics[i] = this.inlineReferences(
                ast.generics[i],
                (rawAst && rawAst.generics) ?
                    rawAst.generics[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();
        ast.generics = newGenerics;

        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression,
            (rawAst && rawAst.typeExpression) ?
                rawAst.typeExpression : null,
            stack
        );
        stack.pop();
        ast._raw = neverRaw ? null : (ast._raw || rawAst);

        this.currentTypeDeclaration = null;

        return null;
    } else if (ast.type === 'assignment') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression,
            (rawAst && rawAst.typeExpression) ?
                rawAst.typeExpression : null,
            stack
        );
        stack.pop();
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'defaultExport') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression,
            (rawAst && rawAst.typeExpression) ?
                rawAst.typeExpression : null,
            stack
        );
        stack.pop();
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'function') {
        if (ast.thisArg) {
            stack.push('thisArg');
            ast.thisArg = this.inlineReferences(
                ast.thisArg,
                (rawAst && rawAst.thisArg) ? rawAst.thisArg : null,
                stack
            );
            stack.pop();
        }

        stack.push('args');
        for (i = 0; i < ast.args.length; i++) {
            stack.push(i);
            ast.args[i] = this.inlineReferences(
                ast.args[i],
                (rawAst && rawAst.args) ? rawAst.args[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        if (ast.result) {
            stack.push('result');
            ast.result = this.inlineReferences(
                ast.result,
                (rawAst && rawAst.result) ? rawAst.result : null,
                stack
            );
            stack.pop();
        }

        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeLiteral') {
        if (ast.builtin) {
            ast._raw = neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        if (ast.isGeneric && !this.replaceGeneric) {
            ast._raw = neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        return this.replacer.replace(ast, rawAst, stack);
    } else if (ast.type === 'genericLiteral') {
        if (ast.value.builtin) {
            stack.push('generics');
            for (i = 0; i < ast.generics.length; i++) {
                stack.push(i);
                ast.generics[i] = this.inlineReferences(
                    ast.generics[i],
                    (rawAst && rawAst.generics) ?
                        rawAst.generics[i] : null,
                    stack
                );
                stack.pop();
            }
            stack.pop();

            stack.push('value');
            ast.value = this.inlineReferences(
                ast.value,
                (rawAst && rawAst.value) ? rawAst.value : null,
                stack
            );
            stack.pop();

            ast._raw = neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        // Inline the arguments to the generics before calling replacer.
        stack.push('generics');
        for (i = 0; i < ast.generics.length; i++) {
            stack.push(i);

            ast.generics[i] = this.inlineReferences(
                ast.generics[i],
                (rawAst && rawAst.generics) ?
                    rawAst.generics[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        return this.replacer.replace(ast, rawAst, stack);
        // console.log('ast.value', ast.value);
        // throw new Error('git rekt');
    } else if (ast.type === 'object') {
        stack.push('keyValues');
        for (i = 0; i < ast.keyValues.length; i++) {
            stack.push(i);
            ast.keyValues[i] = this.inlineReferences(
                ast.keyValues[i],
                (rawAst && rawAst.keyValues) ?
                    rawAst.keyValues[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'tuple') {
        stack.push('values');
        for (i = 0; i < ast.values.length; i++) {
            stack.push(i);
            ast.values[i] = this.inlineReferences(
                ast.values[i],
                (rawAst && rawAst.values) ?
                    rawAst.values[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'keyValue') {
        stack.push('value');
        ast.value = this.inlineReferences(
            ast.value,
            (rawAst && rawAst.value) ? rawAst.value : null,
            stack
        );
        stack.pop();
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'param') {
        stack.push('value');
        ast.value = this.inlineReferences(
            ast.value,
            (rawAst && rawAst.value) ? rawAst.value : null,
            stack
        );
        stack.pop();
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'unionType') {
        stack.push('unions');
        for (i = 0; i < ast.unions.length; i++) {
            stack.push(i);
            ast.unions[i] = this.inlineReferences(
                ast.unions[i],
                (rawAst && rawAst.unions) ?
                    rawAst.unions[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'intersectionType') {
        stack.push('intersections');
        for (i = 0; i < ast.intersections.length; i++) {
            stack.push(i);
            ast.intersections[i] = this.inlineReferences(
                ast.intersections[i],
                (rawAst && rawAst.intersections) ?
                    rawAst.intersections[i] : null,
                stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'valueLiteral') {
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'comment') {
        ast._raw = neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'import') {
        return this.replacer.replace(ast, rawAst, stack);
    } else {
        throw new Error('unknown ast type: ' + ast.type);
    }
};
