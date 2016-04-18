'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js');

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions', 'jsig.mli');
var content = fs.readFileSync(uri, 'utf8');

/*eslint array-bracket-spacing: 0*/

function makeLiteral(name, builtin, opts) {
    opts = opts || {};
    if (typeof builtin === 'string') {
        opts.label = builtin;
        builtin = undefined;
    }

    return AST.literal(name, builtin, opts);
}

var ASTFixture = AST.program([
    AST.typeDeclaration('GenericE', AST.object({
        'type': AST.value('\'genericLiteral\'', 'string'),
        'value': makeLiteral('TypeExpression'),
        'generics': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('TypeExpression') ]
        ),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('FunctionE', AST.object({
        'type': AST.value('\'function\'', 'string'),
        'args': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('TypeExpression') ]
        ),
        'result': makeLiteral('TypeExpression'),
        'thisArg': AST.union([
            makeLiteral('TypeExpression'),
            AST.value('null')
        ]),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('ValueE', AST.object({
        'type': AST.value('\'valueLiteral\'', 'string'),
        'value': makeLiteral('String'),
        'name': makeLiteral('String'),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('LiteralE', AST.object({
        'type': AST.value('\'typeLiteral\'', 'string'),
        'name': makeLiteral('String'),
        'builtin': makeLiteral('Boolean'),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('UnionE', AST.object({
        'type': AST.value('\'unionType\'', 'string'),
        'unions': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('TypeExpression') ]
        ),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('IntersectionE', AST.object({
        'type': AST.value('\'intersectionType\'', 'string'),
        'intersections': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('TypeExpression') ]
        ),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('KeyValue', AST.object({
        'type': AST.value('\'keyValue\'', 'string'),
        'key': makeLiteral('String'),
        'value': makeLiteral('TypeExpression'),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('ObjectE', AST.object({
        'type': AST.value('\'object\'', 'string'),
        'keyValues': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('KeyValue') ]
        ),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('TupleE', AST.object({
        'type': AST.value('\'tuple\'', 'string'),
        'values': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('TypeExpression') ]
        ),
        'label': AST.union([
            makeLiteral('String'),
            AST.value('null')
        ]),
        'optional': makeLiteral('Boolean')
    })),
    AST.typeDeclaration('TypeExpression', AST.union([
        makeLiteral('ObjectE'),
        makeLiteral('UnionE'),
        makeLiteral('LiteralE'),
        makeLiteral('FunctionE'),
        makeLiteral('ValueE'),
        makeLiteral('GenericE'),
        makeLiteral('TupleE'),
        makeLiteral('IntersectionE')
    ])),
    AST.typeDeclaration('Assignment', AST.object({
        'type': AST.value('\'assignment\'', 'string'),
        'identifier': makeLiteral('String'),
        'typeExpression': makeLiteral('TypeExpression')
    })),
    AST.typeDeclaration('TypeDeclaration', AST.object({
        'type': AST.value('\'typeDeclaration\'', 'string'),
        'identifier': makeLiteral('String'),
        'typeExpression': makeLiteral('TypeExpression'),
        'generics': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('LiteralE') ]
        )
    })),
    AST.typeDeclaration('Import', AST.object({
        'type': AST.value('\'import\'', 'string'),
        'dependency': makeLiteral('String'),
        'types': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('LiteralE') ]
        )
    })),
    AST.typeDeclaration('Statement', AST.union([
        makeLiteral('Import'),
        makeLiteral('TypeDeclaration'),
        makeLiteral('Assignment')
    ])),
    AST.typeDeclaration('Program', AST.object({
        'type': AST.value('\'program\'', 'string'),
        'statements': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('Statement') ]
        )
    })),
    AST.typeDeclaration('AST', AST.object({
        'program': AST.functionType({
            args: [ AST.generic(
                makeLiteral('Array'),
                [ makeLiteral('Statement') ]
            ) ],
            result: makeLiteral('Program')
        }),
        'typeDeclaration': AST.functionType({
            args: [
                makeLiteral('String'),
                makeLiteral('TypeExpression')
            ],
            result: makeLiteral('TypeDeclaration')
        }),
        'assignment': AST.functionType({
            args: [
                makeLiteral('String'),
                makeLiteral('TypeExpression')
            ],
            result: makeLiteral('Assignment')
        }),
        'importStatement': AST.functionType({
            args: [
                makeLiteral('String'),
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('LiteralE') ]
                )
            ],
            result: makeLiteral('Import')
        }),
        'object': AST.functionType({
            args: [
                AST.union([
                    AST.generic(
                        makeLiteral('Array'),
                        [ makeLiteral('KeyValue') ]
                    ),
                    AST.generic(
                        makeLiteral('Object'),
                        [
                            makeLiteral('String'),
                            makeLiteral('TypeExpression')
                        ]
                    )
                ], 'keyValues'),
                makeLiteral('String', 'label', {
                    optional: true
                })
            ],
            result: makeLiteral('ObjectE')
        }),
        'union': AST.functionType({
            args: [
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                ),
                makeLiteral('String', 'label', {
                    optional: true
                }),
                AST.object({
                    'optional': makeLiteral('Boolean')
                }, 'opts', { optional: true })
            ],
            result: makeLiteral('UnionE')
        }),
        'intersection': AST.functionType({
            args: [
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                ),
                makeLiteral('String', 'label', {
                    optional: true
                }),
                AST.object({
                    'optional': makeLiteral('Boolean')
                }, 'opts', { optional: true })
            ],
            result: makeLiteral('IntersectionE')
        }),
        'literal': AST.functionType({
            args: [
                makeLiteral('String'),
                makeLiteral('String', 'builtin', {
                    optional: true
                }),
                AST.object({
                    'optional': makeLiteral('Boolean')
                }, 'opts', { optional: true })
            ],
            result: makeLiteral('LiteralE')
        }),
        'keyValue': AST.functionType({
            args: [
                makeLiteral('String'),
                makeLiteral('TypeExpression')
            ],
            result: makeLiteral('KeyValue')
        }),
        'value': AST.functionType({
            args: [
                makeLiteral('String'),
                makeLiteral('String', 'name'),
                makeLiteral('String', 'label', {
                    optional: true
                })
            ],
            result: makeLiteral('ValueE')
        }),
        'functionType': AST.functionType({
            args: [ AST.object([
                AST.keyValue('args', AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                ), { optional: true }),
                AST.keyValue('result', makeLiteral('TypeExpression')),
                AST.keyValue('thisArg',
                    makeLiteral('TypeExpression'), {
                        optional: true
                    }),
                AST.keyValue('label',
                    makeLiteral('String'), {
                        optional: true
                    }),
                AST.keyValue('optional',
                    makeLiteral('Boolean'), {
                        optional: true
                    })
            ], 'opts') ],
            result: makeLiteral('FunctionE')
        }),
        'generic': AST.functionType({
            args: [
                makeLiteral('TypeExpression', 'value'),
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ],
                    'generics'
                ),
                makeLiteral('String', 'label', {
                    optional: true
                })
            ],
            result: makeLiteral('GenericE')
        }),
        'tuple': AST.functionType({
            args: [
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                ),
                makeLiteral('String', 'label', {
                    optional: true
                }),
                AST.object({
                    'optional': makeLiteral('Boolean')
                }, 'opts', { optional: true })
            ],
            result: makeLiteral('TupleE')
        })
    })),
    AST.assignment('jsig/ast', makeLiteral('AST')),
    AST.assignment('jsig/parser', AST.functionType({
        args: [ makeLiteral('String', 'content') ],
        result: makeLiteral('Program')
    }))
]);

test('the jsig type definition', function t(assert) {
    var result = parse(content);

   // showDiff(result, ASTFixture)
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
