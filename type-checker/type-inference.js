'use strict';

var assert = require('assert');

var JsigAST = require('../ast/');
var getUniqueTypes = require('./lib/get-unique-types.js');
var isSameType = require('./lib/is-same-type.js');

module.exports = TypeInference;

function TypeInference(meta) {
    this.meta = meta;
}

TypeInference.prototype.inferType = function inferType(node) {
    if (node.type === 'CallExpression') {
        return this.inferCallExpression(node);
    } else if (node.type === 'Literal') {
        return this.inferLiteral(node);
    } else if (node.type === 'ArrayExpression') {
        return this.inferArrayExpression(node);
    } else if (node.type === 'ObjectExpression') {
        return this.inferObjectExpression(node);
    } else {
        throw new Error('!! skipping inferType: ' + node.type);
    }
};

TypeInference.prototype.inferCallExpression =
function inferCallExpression(node) {
    var untypedFunc = this.meta.currentScope
        .getUntypedFunction(node.callee.name);
    if (!untypedFunc) {
        return null;
    }

    var args = node.arguments;

    var argTypes = [];
    for (var i = 0; i < args.length; i++) {
        var funcArg = this.meta.verifyNode(args[i], null);
        if (!funcArg) {
            return null;
        }

        argTypes.push(JsigAST.param(null, funcArg));
    }

    var returnType = JsigAST.literal('%Void%%UnknownReturn', true);
    if (this.meta.currentExpressionType &&
        this.meta.currentExpressionType.name !== '%Null%%Default' &&
        this.meta.currentExpressionType.name !== '%Void%%Uninitialized'
    ) {
        returnType = this.meta.currentExpressionType;
    }

    // if (this.meta.currentScope.getAssignmentType()) {
        // returnType = this.meta.currentScope.getAssignmentType();
    // } else if (this.meta.currentScope.getReturnExpressionType()) {
        // returnType = this.meta.currentScope.getReturnExpressionType();
    // }

    // TODO: infer this arg based on method calls
    var funcType = JsigAST.functionType({
        args: argTypes,
        result: returnType,
        thisArg: null
    });

    // TODO: We should see if this function actually
    // has a smaller return type. Aka given some inferred type
    // () => X, does the function actually return Y, Y <: X.
    // In which case we should mark this type as () => Y.
    if (!this.meta.tryUpdateFunction(node.callee.name, funcType)) {
        return null;
    }

    if (returnType.builtin && returnType.name === '%Void%%UnknownReturn') {
        // Grab the scope for the known function
        var funcScopes = this.meta.currentScope.getKnownFunctionScope(
            node.callee.name
        ).funcScopes;

        assert(funcScopes.length === 1,
            'cannot infer call return for overloaded function'
        );
        var funcScope = funcScopes[0];

        if (funcScope.knownReturnTypes.length > 0) {
            var uniqueKnownReturnTypes = getUniqueTypes(
                funcScope.knownReturnTypes
            );

            // TODO: grab the smallest union?
            assert(uniqueKnownReturnTypes.length === 1,
                'only support trivial single return funcs');
            funcType.result = uniqueKnownReturnTypes[0];
        }
    }

    return funcType;
};

TypeInference.prototype.inferLiteral =
function inferLiteral(node) {
    var value = node.value;

    if (typeof value === 'string') {
        return JsigAST.literal('String', true, {
            concreteValue: value
        });
    } else if (typeof value === 'number') {
        return JsigAST.literal('Number', true, {
            concreteValue: parseFloat(value, 10)
        });
    } else if (value === null) {
        return JsigAST.value('null');
    } else if (Object.prototype.toString.call(value) === '[object RegExp]') {
        return JsigAST.literal('RegExp');
    } else if (typeof value === 'boolean') {
        return JsigAST.literal('Boolean', true, {
            concreteValue: value === true ? 'true' : 'false'
        });
    } else {
        throw new Error('not recognised literal');
    }
};

function isTypeTuple(jsigType) {
    return jsigType && jsigType.type === 'tuple';
}

function isTypeArray(jsigType) {
    return jsigType && jsigType.type === 'genericLiteral' &&
        jsigType.value.type === 'typeLiteral' &&
        jsigType.value.name === 'Array' &&
        jsigType.value.builtin;
}

/*eslint complexity: [2,20] */
TypeInference.prototype.inferArrayExpression =
function inferArrayExpression(node) {
    var elems = node.elements;

    if (elems.length === 0) {
        var currExprType = this.meta.currentExpressionType;
        if (currExprType && currExprType.type === 'genericLiteral' &&
            currExprType.value.type === 'typeLiteral' &&
            currExprType.value.builtin && currExprType.value.name === 'Array'
        ) {
            return currExprType;
        }

        return JsigAST.generic(
            JsigAST.literal('Array'),
            [JsigAST.freeLiteral('T')]
        );
    }

    var currExpr = this.meta.currentExpressionType;
    if (isTypeTuple(currExpr)) {
        return this._inferTupleExpression(node);
    }

    if (isTypeArray(currExpr)) {
        return this._inferArrayExpression(node);
    }

    var i = 0;

    if (currExpr && currExpr.type === 'unionType') {
        var unions = currExpr.unions;
        for (i = 0; i < unions.length; i++) {
            var possibleType = unions[i];
            if (isTypeTuple(possibleType)) {
                return this._inferTupleExpression(node);
            }

            if (isTypeArray(possibleType)) {
                return this._inferArrayExpression(node);
            }
        }
    }

    var values = [];

    for (i = 0; i < elems.length; i++) {
        if (elems[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                elems[i].name, null
            );
        }

        var newType = this.meta.verifyNode(elems[i], null);
        if (!newType) {
            return null;
        }

        values[i] = newType;
    }

    return JsigAST.tuple(values, null, {
        inferred: true
    });
};

TypeInference.prototype._inferArrayExpression =
function _inferArrayExpression(node) {
    var i = 0;
    var currExpr = this.meta.currentExpressionType;
    if (currExpr.type === 'unionType') {
        for (i = 0; i < currExpr.unions.length; i++) {
            var possibleType = currExpr.unions[i];
            if (isTypeArray(possibleType)) {
                currExpr = possibleType;
                break;
            }
        }
    }

    assert(isTypeArray(currExpr), 'must be an array...');

    var arrayType = currExpr.generics[0];
    var elems = node.elements;

    var type = null;
    for (i = 0; i < elems.length; i++) {
        if (elems[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                elems[i].name, null
            );
        }

        var newType = this.meta.verifyNode(elems[i], arrayType);

        if (type && newType) {
            if (!isSameType(newType, type)) {
                assert(false, 'arrays must be homogenous');
            }
        }

        if (newType) {
            type = newType;
        }
    }

    if (!type) {
        return null;
    }

    return JsigAST.generic(JsigAST.literal('Array'), [type]);
};

TypeInference.prototype._inferTupleExpression =
function _inferTupleExpression(node) {
    var values = [];
    var i = 0;
    var currExpr = this.meta.currentExpressionType;
    if (currExpr.type === 'unionType') {
        for (i = 0; i < currExpr.unions.length; i++) {
            var possibleType = currExpr.unions[i];
            if (isTypeTuple(possibleType)) {
                currExpr = possibleType;
                break;
            }
        }
    }

    assert(isTypeTuple(currExpr), 'must be a tuple...');

    var tupleTypes = currExpr.values;
    for (i = 0; i < node.elements.length; i++) {
        var expected = tupleTypes[i] || null;

        if (node.elements[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                node.elements[i].name, null
            );
        }

        values[i] = this.meta.verifyNode(node.elements[i], expected);
        if (!values[i]) {
            return null;
        }
    }

    return JsigAST.tuple(values);
};

TypeInference.prototype.inferObjectExpression =
function inferObjectExpression(node) {
    var properties = node.properties;

    if (properties.length === 0) {
        var openObj = JsigAST.object([]);
        openObj.open = true;
        return openObj;
    }

    var currentExpressionType = this.meta.currentExpressionType;
    if (currentExpressionType &&
        currentExpressionType.name === '%Export%%ModuleExports' &&
        this.meta.hasExportDefined()
    ) {
        currentExpressionType = this.meta.getModuleExportsType();
    }

    var index = null;
    if (currentExpressionType && currentExpressionType.type === 'object') {
        index = currentExpressionType.buildObjectIndex();
    }

    var keyValues = [];
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        assert(prop.kind === 'init', 'only support init kind');

        var keyName = null;
        if (prop.key.type === 'Identifier') {
            keyName = prop.key.name;
        } else if (prop.key.type === 'Literal') {
            keyName = prop.key.value;
        }

        var expectedType = null;
        if (keyName && index && index[keyName]) {
            expectedType = index[keyName];
        }

        // If this object literal is assigned to module.exports
        // And we are in partial export mode and we do not know the
        // type of the field, then skip this field on the export
        if (this.meta.currentExpressionType &&
            this.meta.currentExpressionType.name === '%Export%%ModuleExports' &&
            this.meta.checkerRules.partialExport &&
            !expectedType
        ) {
            continue;
        }

        if (prop.value.type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                prop.value.name, null
            );
        }

        var value = this.meta.verifyNode(prop.value, expectedType);
        if (!value) {
            return null;
        }

        keyValues.push(JsigAST.keyValue(keyName, value));
    }

    return JsigAST.object(keyValues, null, {
        inferred: true
    });
};
