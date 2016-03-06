'use strict';

module.exports = JsigASTReplacer;

function JsigASTReplacer(replacer) {
    this.replacer = replacer;
}

/*eslint complexity: [2, 30], max-statements: [2, 80]*/
JsigASTReplacer.prototype.inlineReferences =
function inlineReferences(ast, rawAst) {
    var i;

    if (ast.type === 'program') {
        var newStatements = [];
        for (i = 0; i < ast.statements.length; i++) {
            var t = this.inlineReferences(
                ast.statements[i], rawAst.statements[i]
            );
            if (t) {
                newStatements.push(t);
            }
        }
        ast.statements = newStatements;
        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'typeDeclaration') {
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression
        );
        ast._raw = rawAst;
        return null;
    } else if (ast.type === 'assignment') {
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression
        );
        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'function') {
        for (i = 0; i < ast.args.length; i++) {
            ast.args[i] = this.inlineReferences(
                ast.args[i], rawAst.args[i]
            );
        }

        if (ast.result) {
            ast.result = this.inlineReferences(ast.result, rawAst.result);
        }
        if (ast.thisArg) {
            ast.thisArg = this.inlineReferences(ast.thisArg, rawAst.thisArg);
        }

        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'typeLiteral') {
        if (ast.builtin) {
            ast._raw = rawAst;
            return ast;
        }

        return this.replacer.replace(ast, rawAst);
    } else if (ast.type === 'genericLiteral') {
        ast.value = this.inlineReferences(ast.value, rawAst.value);

        for (i = 0; i < ast.generics.length; i++) {
            ast.generics[i] = this.inlineReferences(
                ast.generics[i], rawAst.generics[i]
            );
        }

        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'object') {
        for (i = 0; i < ast.keyValues.length; i++) {
            ast.keyValues[i] = this.inlineReferences(
                ast.keyValues[i], rawAst.keyValues[i]
            );
        }

        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'keyValue') {
        ast.value = this.inlineReferences(ast.value, rawAst.value);
        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'unionType') {
        for (i = 0; i < ast.unions.length; i++) {
            ast.unions[i] = this.inlineReferences(
                ast.unions[i], rawAst.unions[i]
            );
        }

        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'valueLiteral') {
        ast._raw = rawAst;
        return ast;
    } else if (ast.type === 'comment') {
        ast._raw = rawAst;
        return ast;
    } else {
        throw new Error('unknown ast type: ' + ast.type);
    }
};
