'use strict';

var assert = require('assert');

var JsigAST = require('../ast/');
var getUniqueTypes = require('./lib/get-unique-types.js');
var deepCloneJSIG = require('./lib/deep-clone-ast.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');

module.exports = GenericResolver;

function GenericResolver(meta) {
    this.meta = meta;
}

GenericResolver.prototype.resolveGeneric =
function resolveGeneric(funcType, node, currentExpressionType) {
    /*
        CallExpression : {
            callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier' }
            },
            arguments: Array<X>
        }

        NewExpression : {
            callee: { type: 'Identifier' },
            arguments: Array<X>
        }
    */

    var copyFunc = deepCloneJSIG(funcType);
    copyFunc._raw = null;

    var resolver = new GenericCallResolver(
        this.meta, copyFunc, node, currentExpressionType
    );
    var knownGenericTypes = resolver.resolve();
    // console.log('what have we found', knownGenericTypes);
    if (!knownGenericTypes) {
        return null;
    }

    for (var i = 0; i < copyFunc.generics.length; i++) {
        var g = copyFunc.generics[i];
        var newType = knownGenericTypes[g.name];
        assert(newType, 'newType must exist');

        var stack = g.location.slice();

        var obj = copyFunc;
        for (var j = 0; j < stack.length - 1; j++) {
            if (stack[j] === 'generics' && obj.type !== 'genericLiteral') {
                // there used to be a genericLiteral at this location
                // but it's already been inlined so we can't descend into
                // it anymore.
                break;
            }

            obj = obj[stack[j]];
            obj._raw = null;
        }

        var lastProp = stack[stack.length - 1];
        obj[lastProp] = newType;
    }

    return copyFunc;
};

function GenericInliner(knownGenericTypes) {
    this.knownGenericTypes = knownGenericTypes;
    this.failed = false;
    this.unknownReturn = false;
}

GenericInliner.prototype.replace = function replace(ast, raw, stack) {
    var name = ast.name;

    // TODO: cross reference the uuid instead of the name
    // var uuid = ast.genericIdentifierUUID;

    var knownType = this.knownGenericTypes[name];
    if (!knownType) {
        if (stack[stack.length - 1] === 'result') {
            this.unknownReturn = true;
            return JsigAST.literal('%Void%%UnknownReturn', true);
        }

        this.failed = true;
        return null;
    }

    return knownType;
};

function GenericCallResolver(meta, copyFunc, node, currentExpressionType) {
    this.counter = 0;
    this.knownGenericTypes = Object.create(null);
    this.meta = meta;
    this.copyFunc = copyFunc;
    this.node = node;
    this.currentExpressionType = currentExpressionType;

    this._cachedInferredFunctionArgs = [];
}

GenericCallResolver.prototype.resolveArg =
function resolveArg(stack) {
    // console.log('resolveArg()', stack);
    var referenceNode = this.node.arguments[stack[1]];
    if (!referenceNode) {
        return null;
    }

    // Do maybe function inference

    var expectedValue = this.copyFunc.args[stack[1]].value;
    var knownExpressionType = null;
    var hasUnknownReturn = false;
    if (referenceNode.type === 'FunctionExpression' &&
        expectedValue.type === 'function'
    ) {
        if (this._cachedInferredFunctionArgs[stack[1]]) {
            knownExpressionType = this._cachedInferredFunctionArgs[stack[1]];
        } else {
            var copyExpected = deepCloneJSIG(expectedValue);
            var replacer = new GenericInliner(this.knownGenericTypes);
            var astReplacer = new JsigASTReplacer(replacer, true, true);
            astReplacer.inlineReferences(copyExpected, copyExpected, []);

            if (!replacer.failed) {
                knownExpressionType = copyExpected;
            }
            if (!replacer.failed && replacer.unknownReturn) {
                hasUnknownReturn = true;
            }
        }
    }

    var newType = this.meta.verifyNode(referenceNode, knownExpressionType);
    if (!newType) {
        return null;
    }

    if (hasUnknownReturn) {
        // Grab the scope for the known function
        var funcScopes = this.meta.currentScope.getKnownFunctionScope(
            this.meta.getFunctionName(referenceNode)
        ).funcScopes;
        assert(funcScopes.length === 1,
            'cannot infer call return for overloaded function'
        );
        assert(newType.type === 'function', 'must have a newType function');
        var funcScope = funcScopes[0];

        if (funcScope.knownReturnTypes.length > 0) {
            var uniqueKnownReturnTypes = getUniqueTypes(
                funcScope.knownReturnTypes
            );

            // TODO: grab the smallest union?
            assert(uniqueKnownReturnTypes.length === 1,
                'only support trivial single return funcs');
            newType.result = uniqueKnownReturnTypes[0];
        }
    }

    if (knownExpressionType) {
        this._cachedInferredFunctionArgs[stack[1]] = knownExpressionType;
    }

    newType = walkProps(newType, stack, 3);
    return newType;
};

GenericCallResolver.prototype.resolveThisArg =
function resolveThisArg(stack) {
    var newType;

    // Method call()
    if (this.node.callee.type === 'MemberExpression') {
        var referenceNode = this.node.callee.object;
        // TODO: this might be wrong
        newType = this.meta.verifyNode(referenceNode, null);
        if (!newType) {
            return null;
        }

        newType = walkProps(newType, stack, 2);
    // new expression
    } else if (this.node.callee.type === 'Identifier') {
        if (this.currentExpressionType) {
            newType = this.currentExpressionType;
            newType = walkProps(newType, stack, 2);
        } else {
            // If we have no ctx as for type then free literal
            // console.log('building a free literal', stack,
            //     this.meta.serializeAST(this.node));
            newType = JsigAST.freeLiteral('T' + this.counter++);
        }
    } else {
        assert(false, 'unknown caller type: ' + this.node.callee.type);
    }

    return newType;
};

GenericCallResolver.prototype.updateKnownGeneric =
function updateKnownGeneric(ast, newType, referenceNode) {
    if (this.knownGenericTypes[ast.name]) {
        var oldType = this.knownGenericTypes[ast.name];

        var subTypeError;
        if (newType.type === 'freeLiteral') {
            subTypeError = null;
        } else {
            subTypeError = this.meta.checkSubTypeRaw(
                referenceNode, oldType, newType
            );
        }

        if (subTypeError) {
            // A free variable fits in any type.
            var isSub = oldType.type === 'freeLiteral';
            if (!isSub) {
                isSub = this.meta.isSubType(
                    referenceNode, newType, oldType
                );
            }
            if (isSub) {
                this.knownGenericTypes[ast.name] = newType;
                subTypeError = null;
            }
        }

        if (subTypeError) {
            this.meta.addError(subTypeError);
            return false;
            // TODO: bug and shit
            // assert(false, 'could not resolve generics');
        }
    } else {
        this.knownGenericTypes[ast.name] = newType;
    }

    return true;
};

GenericCallResolver.prototype.resolveLocationNode =
function resolveLocationNode(locationNode) {
    var newType;
    var referenceNode;
    var stack = locationNode.location;
    var ast = walkProps(this.copyFunc, stack, 0);

    if (stack[0] === 'args') {
        referenceNode = this.node.arguments[stack[1]];

        newType = this.resolveArg(stack);
    } else if (stack[0] === 'thisArg') {
        referenceNode = this.node.callee.object;
        newType = this.resolveThisArg(stack);
    } else {
        referenceNode = this.node;
        newType = this.knownGenericTypes[ast.name];
        assert(newType, 'newType must exist in fallback');
    }

    // do not bail if we cannot resolve a generic location.
    if (!newType) {
        return true;
    }

    // If we are resolving the location of a generic inside
    // another generic, aka `<T>(Foo<T>, T) => T` the T inside
    // Foo<T> then we must double check to see if Foo<T> has
    // already been inlined or not.
    if (stack[stack.length - 2] === 'generics') {
        var newStack = stack.slice(0, stack.length - 2);
        var genericLiteral = walkProps(this.copyFunc, newStack, 0);

        // console.log("resolveLocation()", stack, newType);

        // console.log("genericLiteral", genericLiteral);
        // console.log("keyValues", genericLiteral.keyValues);

        /*  the node at this location is no longer a genericLiteral
            which means it's already been inlined aka the type of
            `Foo<T>` has been resolved to `{ ... }`.

            this means we can't really do anything here with updating
            the type of T
        */
        if (genericLiteral.type !== 'genericLiteral') {
            // TODO: Foo<T> has been inline but T might still exist
            // somewhere so we should scan for it and update the nested
            // T.
            return true;
        }
    }

    return this.updateKnownGeneric(
        ast, newType, referenceNode
    );
};

GenericCallResolver.prototype.resolve = function resolve() {
    var locationNodes = this.copyFunc.generics.slice();

    var argList = [];
    var otherList = [];

    for (var i = 0; i < locationNodes.length; i++) {
        var stack = locationNodes[i].location;

        if (stack[0] === 'thisArg') {
            argList.unshift(locationNodes[i]);
        } else if (stack[0] === 'args') {
            argList.push(locationNodes[i]);
        } else {
            otherList.push(locationNodes[i]);
        }
    }

    var originalLength = argList.length;
    for (i = 0; i < argList.length; i++) {
        var locationNode = argList[i];
        // console.log('attempt resolve', argList[i]);

        // If we want to resolve an argument that is an untyped
        // function expression, then we should move this location
        // node to the end of the list and resolve the other
        // information first.
        if (i < originalLength && locationNode.location[0] === 'args') {
            var referenceNode = this.node.arguments[
                locationNode.location[1]
            ];

            if (referenceNode &&
                referenceNode.type === 'FunctionExpression'
            ) {
                argList.push(locationNode);
                continue;
            }
        }

        var success = this.resolveLocationNode(locationNode);
        if (!success) {
            return null;
        }
    }
    for (i = 0; i < otherList.length; i++) {
        locationNode = otherList[i];

        success = this.resolveLocationNode(locationNode);
        if (!success) {
            return null;
        }
    }

    return this.knownGenericTypes;
};

function walkProps(object, stack, start) {
    for (var i = start; i < stack.length; i++) {
        if (!object) {
            return null;
        }

        object = object[stack[i]];
    }
    return object;
}
