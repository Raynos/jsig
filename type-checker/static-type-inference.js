'use strict';

var assert = require('assert');

var getUniqueTypes = require('./lib/get-unique-types.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');
var deepCloneAST = require('./lib/deep-clone-ast.js');
var JsigAST = require('../ast/');

module.exports = StaticTypeInference;

/*  StaticTypeInference class is responsible for ahead of time
    static type inference based on the implementation of a
    function body.

    This is different to the other `TypeInference` class which
    is responsible for usage-based inference of a function. aka
    if a function is being called we can see if the function
    implements the call signature and then "infer" that the
    function must be of that type.

    This class is capable of infering a more "generic" type
    for a function declaration without it being called.

    This is the foundation for the 100% type inference mode
    of the jsig type system.
*/
function StaticTypeInference(meta) {
    this.meta = meta;
    this.counter = 0;
}

function isPrototypeAssignment(currentNode, leftType) {
    return leftType && leftType.type === 'typeLiteral' &&
        leftType.builtin &&
        leftType.name === '%Mixed%%MethodInferrenceField' &&
        currentNode.left.type === 'MemberExpression' &&
        currentNode.left.object.type === 'MemberExpression' &&
        currentNode.left.object.property.name === 'prototype' &&
        currentNode.left.object.object.type === 'Identifier';
}

StaticTypeInference.prototype.inferFunctionType =
function inferFunctionType(node) {
    var funcName = this.meta.getFunctionName(node);
    var isConstructor = /[A-Z]/.test(funcName[0]);

    if (isConstructor) {
        return this.inferConstructorType(node);
        // TODO: scan for all prototype assignment expressions
        // and infer them so that we can finalize the methods on
        // the `thisType`
        // otherwise when `inferFunctionType` is called from a
        // new expression statement; the callsite will have the
        // class instance but will know nothing about the methods
        // as we have not yet verified the method assignment
        // statements.

        // TODO: the this arg will probably contain generic fields
        // and so will the constructor
        // We need to infer the type of all the methods to see
        // if there are further type restrictions on the generic
        // fields in the methods.
        // Once we've inferred the type of all the methods we can
        // go back and finalize the `thisArg` type on the constructor
    }

    var currentNode = this.meta.currentNode;
    if (currentNode.type === 'AssignmentExpression') {
        // in an assignment expression; see if the left type is
        // a possible method inferrence variable and if the
        // assignment expression looks like prototype method assignment
        var leftType = this.meta.verifyNode(currentNode.left, null);

        if (this.meta.currentScope.type === 'file' &&
            isPrototypeAssignment(currentNode, leftType)
        ) {
            var constructorIdentifier = currentNode.left.object.object.name;
            var constructorVar = this.meta.currentScope
                .getVar(constructorIdentifier);

            // dereference identifiers to their FunctionDeclarations
            if (node.type === 'Identifier') {
                var untyped = this.meta.currentScope
                    .getUntypedFunction(node.name);
                node = untyped.node;
            }

            // this prototype assignment has a well-typed constructor and
            // it's type has been inferred then we can infer methods as well.
            if (constructorVar && constructorVar.defn.type === 'function' &&
                constructorVar.defn.inferred
            ) {
                return this.inferPrototypeMethodType(
                    node,
                    constructorVar.defn.thisArg.value,
                    constructorVar.defn
                );
            }
        }
    }
};

StaticTypeInference.prototype._getFunctionScope =
function _getFunctionScope(funcName) {
    var funcScopes = this.meta.currentScope.getKnownFunctionScope(
        funcName
    ).funcScopes;
    assert(funcScopes.length === 1,
        'cannot infer function declaration for overloaded function'
    );

    var funcScope = funcScopes[0];
    return funcScope;
};

StaticTypeInference.prototype._findFunctionReturnType =
function _findFunctionReturnType(funcScope) {
    var foundReturnType = null;
    if (funcScope.knownReturnTypes.length > 0) {
        var uniqueKnownReturnTypes = getUniqueTypes(
            funcScope.knownReturnTypes
        );

        // TODO: grab the smallest union?
        assert(uniqueKnownReturnTypes.length === 1,
            'only support trivial single return funcs');
        foundReturnType = uniqueKnownReturnTypes[0];
    }

    return foundReturnType;
};

StaticTypeInference.prototype.inferConstructorType =
function inferConstructorType(node) {
    var errorCount = this.meta.countErrors();
    var args = [];
    for (var i = 0; i < node.params.length; i++) {
        args.push(JsigAST.param(
            node.params[i].name,
            JsigAST.inferredLiteral(
                'T' + this.counter++ + ':args[' + i + ']'
            )
        ));
    }

    var returnType = JsigAST.literal('%Void%%UnknownReturn', true);
    var inferredFuncType = JsigAST.functionType({
        result: returnType,
        args: args,
        // TODO: mark thisType as being a special open type
        // TOOD: mark thisType as a special infer ???
        thisArg: JsigAST.param('this', JsigAST.object([], null, {
            open: true
        }))
        // TODO: should we mark generics here or handle that later????
    });

    // console.log('inferredFuncType',
    //     this.meta.serializeType(inferredFuncType));

    if (node.type === 'FunctionDeclaration') {
        var funcName = this.meta.getFunctionName(node);

        // Evaluate the function implementation based on inferred type.
        var maybeRevert = this._verifyFunction(node, inferredFuncType);
        if (!maybeRevert) {
            // Inference failed !!
            // TODO: complain about inference failing with an error?
            this.meta.sanityCheckErrorsState(errorCount);
            return null;
        }

        var funcScope = this._getFunctionScope(funcName);
        // console.log('info', funcScope);
        // console.log('latest thisType', funcScope.getThisType());

        var foundReturnType = this._findFunctionReturnType(funcScope);

        // We must revert the function as we only allocated the
        // function scope because we attempted to run the verification
        // and type inference logic.
        maybeRevert();

        // This is the function type that we inferred from trying to force
        // update the function.
        var newFuncType = JsigAST.functionType({
            result: foundReturnType === null ?
                JsigAST.literal('void') : foundReturnType,
            args: inferredFuncType.args,
            thisArg: JsigAST.param('this', funcScope.getThisType())
        });

        var replacer = new InferredLiteralReplacer();
        var astReplacer = new JsigASTReplacer(replacer, true);
        astReplacer.inlineReferences(newFuncType, newFuncType, []);

        var openThisArg = newFuncType.thisArg.value;
        var closedThisArg = JsigAST.param('this', JsigAST.object(
            openThisArg.keyValues,
            null,
            {
                open: false,
                brand: openThisArg.brand,
                inferred: openThisArg.inferred
            }
        ));

        var finalFuncType = JsigAST.functionType({
            result: newFuncType.result,
            args: newFuncType.args,
            thisArg: closedThisArg,
            generics: replacer.generics,
            inferred: true
        });

        // console.log('static type inference', {
        //     generics: finalFuncType.generics,
        //     funcType: this.meta.serializeType(finalFuncType)
        // });

        return finalFuncType;
    }
};

StaticTypeInference.prototype._verifyFunction =
function _verifyFunction(node, inferredFunctionType) {
    var self = this;
    var funcName = this.meta.getFunctionName(node);
    if (node.type === 'FunctionExpression') {
        var funcType = this.meta.verifyNode(node, inferredFunctionType);
        if (!funcType) {
            this.meta.tryRevertFunctionExpression(
                funcName, inferredFunctionType
            );
            return null;
        }

        return revertFunction;
    } else if (
        node.type === 'Identifier' ||
        node.type === 'FunctionDeclaration'
    ) {
        var untypedFunc = this.meta.currentScope.getUntypedFunction(funcName);
        var success = this.meta.tryUpdateFunction(
            funcName, inferredFunctionType
        );
        if (!success) {
            return null;
        }

        return revertFunction;
    } else {
        assert(false, 'cannot _verifyFunction() on ' + node.type);
    }

    function revertFunction() {
        if (node.type === 'FunctionExpression') {
            self.meta.tryRevertFunctionExpression(
                funcName, inferredFunctionType
            );
        } else if (
            node.type === 'Identifier' ||
            node.type === 'FunctionDeclaration'
        ) {
            self.meta.tryRevertFunction(
                funcName, inferredFunctionType, untypedFunc
            );
        }
    }
};

StaticTypeInference.prototype.inferPrototypeMethodType =
function inferPrototypeMethodType(
    node, inferredThisType, constructorType
) {
    var errorCount = this.meta.countErrors();
    var inferredThisCopy = deepCloneAST(inferredThisType);
    var args = [];
    for (var i = 0; i < node.params.length; i++) {
        args.push(JsigAST.param(
            node.params[i].name,
            JsigAST.inferredLiteral(
                'T' + this.counter++ + ':args[' + i + ']'
            )
        ));
    }

    // TODO: inferredThisType contains generics which are referenced
    // in the constructorGenerics array.

    var returnType = JsigAST.literal('%Void%%UnknownReturn', true);
    var inferredFuncType = JsigAST.functionType({
        result: returnType,
        args: args,
        thisArg: JsigAST.param('this', inferredThisCopy)
        // TODO: should we mark generics here or handle that later????
    });

    var funcName = this.meta.getFunctionName(node);
    var maybeRevert = this._verifyFunction(node, inferredFuncType);
    if (!maybeRevert) {
        // Inference failed !!
        // TODO: complain about inference failing with an error?
        this.meta.sanityCheckErrorsState(errorCount);
        return null;
    }

    var funcScope = this._getFunctionScope(funcName);
    var foundReturnType = this._findFunctionReturnType(funcScope);

    maybeRevert();

    var newFuncType = JsigAST.functionType({
        result: foundReturnType === null ?
            JsigAST.literal('void') : foundReturnType,
        args: inferredFuncType.args,
        thisArg: JsigAST.param('this', inferredThisCopy)
    });

    var replacer = new InferredLiteralReplacer();
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(newFuncType, newFuncType, []);

    var foundGenerics = replacer.generics
        .concat(constructorType.computeUniqueGenericNames());

    var finalFuncType = JsigAST.functionType({
        result: newFuncType.result,
        args: newFuncType.args,
        // we must use the original inferredThisType, not the copy here.
        thisArg: JsigAST.param('this', inferredThisType),
        generics: foundGenerics,
        inferred: true
    });

    // console.log('static type inference', {
    //     generics: finalFuncType.generics,
    //     funcType: this.meta.serializeType(finalFuncType)
    // });

    return finalFuncType;
};

function InferredLiteralReplacer() {
    this.genericLiteralsTable = Object.create(null);
    this.generics = [];
    this.counter = 0;
}

InferredLiteralReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (ast.type === 'inferredLiteral') {
        return this.replaceInferredLiteral(ast, stack);
    }
};

InferredLiteralReplacer.prototype.replaceInferredLiteral =
function replaceInferredLiteral(ast, stack) {
    if (this.genericLiteralsTable[ast.name]) {
        return this.genericLiteralsTable[ast.name];
    }

    // if this inferred literal has a supertype then we infer
    // it must be exactly that supertype
    if (ast.supertypes.length === 1) {
        return ast.supertypes[0];
    }

    var literal = JsigAST.literal('T' + this.counter++, false);
    this.generics.push(literal.name);
    this.genericLiteralsTable[ast.name] = literal;
    return literal;
};
