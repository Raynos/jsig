'use strict';

var assert = require('assert');

function MacroWaterfall(meta, AST) {
    this.meta = meta;
    this.AST = AST;

    this.errorType = this.meta.checker.errorType;
}

/*
    resolveFunction(EsprimaASTNode, macroToken)

    Returns:

     - null, meaning could not compute function type.
        Must call `this.meta.addError(err)` to show type
        errors to user
     - JsigAST#FunctionType, meaning the function type signature
        of this invocation of the macro which will be fully
        checked.
*/
MacroWaterfall.prototype.resolveFunction =
function resolveFunction(node, macroToken) {
    var AST = this.AST;

    /*
        Read each function.
        Figure out the type,
        and then the next type,
        and then the next...
    */

    var tasks = [];
    var resultType = null;

    var taskArgs = node.arguments[0];
    assert(taskArgs.type === 'ArrayExpression', 'must be arr expr');

    for (var i = 0; i < taskArgs.elements.length; i++) {
        var taskElem = taskArgs.elements[i];

        if (i === 0) {
            var firstType = this.meta.verifyNode(taskElem, null);

            assert(firstType.type === 'function', 'must be func');
            assert(firstType.result.name === 'void', 'must yield void');

            var cbArg = firstType.args[0].value;
            assert(cbArg.type === 'function', 'cb must be a func');
            assert(cbArg.result.name === 'void', 'must return void');

            resultType = cbArg.args[1].value;
            tasks.push(firstType);
        } else {
            var expectedType = AST.functionType({
                args: [
                    AST.param('value', resultType),
                    AST.param('cb', AST.functionType({
                        args: [
                            AST.param('err', AST.union([
                                this.errorType, AST.value('null')
                            ])),
                            AST.param('result',
                                AST.literal('WeirdPlaceHolder', true)
                            )
                        ],
                        result: AST.literal('void')
                    }))
                ],
                result: AST.literal('void')
            });

            resultType = null;
            var beforeErrors = this.meta.getErrors();
            this.meta.verifyNode(taskElem, expectedType);
            var afterErrors = this.meta.getErrors();

            if (beforeErrors.length + 1 === afterErrors.length) {
                var lastError = afterErrors[afterErrors.length - 1];

                if (lastError.type === 'jsig.sub-type.type-class-mismatch' &&
                    lastError.expected === 'WeirdPlaceHolder'
                ) {
                    resultType = lastError._child;
                    expectedType.args[1].value.args[1].value = resultType;
                    this.meta.setErrors(beforeErrors);
                }
            }

            tasks.push(expectedType);
        }
    }

    var argTypes = [
        AST.param('tasks', AST.tuple(tasks)),
        AST.param('done', AST.functionType({
            args: [
                AST.param('err', AST.union([
                    this.errorType, AST.value('null')
                ])),
                AST.param('result', resultType, {
                    optional: true
                })
            ],
            result: AST.literal('void')
        }))
    ];

    return AST.functionType({
        args: argTypes,
        result: AST.literal('void')
    });
};

module.exports = {
    MacroWaterfall: MacroWaterfall
};
