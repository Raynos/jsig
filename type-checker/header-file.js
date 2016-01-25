'use strict';

var assert = require('assert');

// var JsigAST = require('../ast.js');

module.exports = HeaderFile;

function HeaderFile(jsigAst) {
    this.rawJsigAst = jsigAst;
    this.resolvedJsigAst = null;

    this.indexTable = Object.create(null);
    this.errors = [];
}

HeaderFile.prototype.resolveReferences =
function resolveReferences() {
    if (this.resolvedJsigAst) {
        return;
    }

    var ast = this.rawJsigAst;
    var copyAst = JSON.parse(JSON.stringify(ast));

    for (var i = 0; i < copyAst.statements.length; i++) {
        var line = copyAst.statements[i];

        if (line.type === 'typeDeclaration') {
            this.indexTable[line.identifier] = line.typeExpression;
        }
    }

    copyAst = this.inlineReferences(copyAst);

    if (this.errors.length > 0) {
        throw new Error('got inline error');
    }

    // console.log('copy AST?', JSON.stringify(copyAst, null, 4));
    this.resolvedJsigAst = copyAst;
};

/*eslint complexity: [2, 30], max-statements: [2, 40]*/
HeaderFile.prototype.inlineReferences =
function inlineReferences(ast) {
    var i;

    if (ast.type === 'program') {
        var newStatements = [];
        for (i = 0; i < ast.statements.length; i++) {
            var t = this.inlineReferences(ast.statements[i]);
            if (t) {
                newStatements.push(t);
            }
        }
        ast.statements = newStatements;
        return ast;
    } else if (ast.type === 'typeDeclaration') {
        ast.typeExpression = this.inlineReferences(ast.typeExpression);
        return null;
    } else if (ast.type === 'assignment') {
        ast.typeExpression = this.inlineReferences(ast.typeExpression);
        return ast;
    } else if (ast.type === 'function') {
        for (i = 0; i < ast.args.length; i++) {
            ast.args[i] = this.inlineReferences(ast.args[i]);
        }

        if (ast.result) {
            ast.result = this.inlineReferences(ast.result);
        }
        if (ast.thisArg) {
            ast.thisArg = this.inlineReferences(ast.thisArg);
        }

        return ast;
    } else if (ast.type === 'typeLiteral') {
        if (ast.builtin) {
            return ast;
        }

        var name = ast.name;
        var typeDefn = this.indexTable[name];
        if (!typeDefn) {
            this.errors.push(new Error('could not find: ' + name));
        }

        return typeDefn;
    } else if (ast.type === 'genericLiteral') {
        ast.value = this.inlineReferences(ast.value);

        for (i = 0; i < ast.generics.length; i++) {
            ast.generics[i] = this.inlineReferences(ast.generics[i]);
        }

        return ast;
    } else if (ast.type === 'object') {
        for (i = 0; i < ast.keyValues.length; i++) {
            ast.keyValues[i] = this.inlineReferences(ast.keyValues[i]);
        }

        return ast;
    } else if (ast.type === 'keyValue') {
        ast.value = this.inlineReferences(ast.value);
        return ast;
    } else {
        throw new Error('unknown ast type: ' + ast.type);
    }
};

HeaderFile.prototype.getResolvedAssignments =
function getResolvedAssignments() {
    this.resolveReferences();

    if (!this.resolvedJsigAst) {
        return null;
    }

    return this.resolvedJsigAst.statements;
};

HeaderFile.prototype.checkSubType =
function checkSubType(parent, child) {
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');

    if (parent.type === 'typeLiteral') {
        return this.checkTypeLiteralSubType(parent, child);
    } else if (parent.type === 'genericLiteral') {
        return this.checkGenericLiteralSubType(parent, child);
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }
};

HeaderFile.prototype.checkTypeLiteralSubType =
function checkTypeLiteralSubType(parent, child) {
    if (!parent.builtin) {
        throw new Error('not implemented, sub type for non-builtin');
    }

    if (parent.name === 'Any:ModuleExports') {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        throw new Error('child must be type literal');
    }

    var name = parent.name;
    if (name === 'Object') {
        if (child.name !== 'Object') {
            return new Error('Not an object');
        }
    }
};

HeaderFile.prototype.checkGenericLiteralSubType =
function checkGenericLiteralSubType(parent, child) {
    if (child.type !== 'genericLiteral') {
        throw new Error('child must be generic literal');
    }

    var err = this.checkSubType(parent.value, child.value);
    if (err) {
        return err;
    }

};
