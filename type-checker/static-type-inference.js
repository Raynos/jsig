'use strict';

var assert = require('assert');

var getUniqueTypes = require('./lib/get-unique-types.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');
var JsigAST = require('../ast/');

var THIS_ASSIGNMENT_REGEX = /this\.[a-zA-Z]+\s\=/;

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

StaticTypeInference.prototype.inferFunctionType =
function inferFunctionType(node) {
    var functionText = this.meta.serializeAST(node);
    if (THIS_ASSIGNMENT_REGEX.test(functionText)) {
        return this.inferConstructorType(node);
    }
};

StaticTypeInference.prototype.inferConstructorType =
function inferConstructorType(node) {
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

    var funcName = null;
    if (node.type === 'FunctionDeclaration') {
        funcName = node.id.name;
        var untypedFunc = this.meta.currentScope.getUntypedFunction(funcName);
        var success = this.meta.tryUpdateFunction(funcName, inferredFuncType);
        if (!success) {
            // Inference failed !!
            // TODO: complain about inference failing with an error?
            assert(true, 'inference failed');
        }

        // var funcType = this.meta.currentScope.getVar(funcName);
        // console.log('inferred type', this.meta.serializeType(funcType.defn));

        var funcScopes = this.meta.currentScope.getKnownFunctionScope(
            funcName
        ).funcScopes;
        assert(funcScopes.length === 1,
            'cannot infer function declaration for overloaded function'
        );

        var funcScope = funcScopes[0];

        // console.log('info', funcScope);
        // console.log('latest thisType', funcScope.getThisType());

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

        this.meta.tryRevertFunction(
            funcName, this.inferFunctionType, untypedFunc
        );

        // TODO: update func type with the new thisType information
        // TODO: walk the function type and replace the inferred literals
        //      with actual generic literals
        // TODO: rebuild the function type object with generic literals and
        //      its location index tracking.

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

        var finalFuncType = JsigAST.functionType({
            result: newFuncType.result,
            args: newFuncType.args,
            thisArg: newFuncType.thisArg,
            generics: replacer.generics
        });

        return finalFuncType;
    }
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

    var literal = JsigAST.literal('T' + this.counter++, false);
    this.generics.push(literal.name);
    this.genericLiteralsTable[ast.name] = literal;
    return literal;
};
