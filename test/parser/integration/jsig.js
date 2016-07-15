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

function makeLiteral(name, builtin) {
    if (typeof builtin === 'string') {
        builtin = undefined;
    }

    return AST.literal(name, builtin);
}

function makeParam(name, value) {
    var opts = {};

    if (name && name[name.length - 1] === '?') {
        opts.optional = true;
        name = name.substr(0, name.length - 1);
    }

    return AST.param(name, value, opts);
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
            args: [ makeParam(null, AST.generic(
                makeLiteral('Array'),
                [ makeLiteral('Statement') ]
            )) ],
            result: makeLiteral('Program')
        }),
        'typeDeclaration': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam(null, makeLiteral('TypeExpression'))
            ],
            result: makeLiteral('TypeDeclaration')
        }),
        'assignment': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam(null, makeLiteral('TypeExpression'))
            ],
            result: makeLiteral('Assignment')
        }),
        'importStatement': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam(null, AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('LiteralE') ]
                ))
            ],
            result: makeLiteral('Import')
        }),
        'object': AST.functionType({
            args: [
                makeParam('keyValues', AST.union([
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
                ])),
                makeParam('label?', makeLiteral('String'))
            ],
            result: makeLiteral('ObjectE')
        }),
        'union': AST.functionType({
            args: [
                makeParam(null, AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                )),
                makeParam('label?', makeLiteral('String')),
                makeParam('opts?', AST.object({
                    'optional': makeLiteral('Boolean')
                }))
            ],
            result: makeLiteral('UnionE')
        }),
        'intersection': AST.functionType({
            args: [
                makeParam(null, AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                )),
                makeParam('label?', makeLiteral('String')),
                makeParam('opts?', AST.object({
                    'optional': makeLiteral('Boolean')
                }))
            ],
            result: makeLiteral('IntersectionE')
        }),
        'literal': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam('builtin?', makeLiteral('String')),
                makeParam('opts?', AST.object({
                    'optional': makeLiteral('Boolean')
                }))
            ],
            result: makeLiteral('LiteralE')
        }),
        'keyValue': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam(null, makeLiteral('TypeExpression'))
            ],
            result: makeLiteral('KeyValue')
        }),
        'value': AST.functionType({
            args: [
                makeParam(null, makeLiteral('String')),
                makeParam('name', makeLiteral('String', 'name')),
                makeParam('label?', makeLiteral('String'))
            ],
            result: makeLiteral('ValueE')
        }),
        'functionType': AST.functionType({
            args: [ makeParam('opts', AST.object([
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
            ])) ],
            result: makeLiteral('FunctionE')
        }),
        'generic': AST.functionType({
            args: [
                makeParam('value', makeLiteral('TypeExpression')),
                makeParam('generics', AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                )),
                makeParam('label?', makeLiteral('String'))
            ],
            result: makeLiteral('GenericE')
        }),
        'tuple': AST.functionType({
            args: [
                makeParam(null, AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('TypeExpression') ]
                )),
                makeParam('label?', makeLiteral('String')),
                makeParam('opts?', AST.object({
                    'optional': makeLiteral('Boolean')
                }))
            ],
            result: makeLiteral('TupleE')
        })
    })),
    AST.assignment('jsig/ast', makeLiteral('AST')),
    AST.assignment('jsig/parser', AST.functionType({
        args: [ makeParam('content', makeLiteral('String')) ],
        result: makeLiteral('Program')
    }))
]);

test('the jsig type definition', function t(assert) {
    AST.CONFIG.loc = false;
    var result = parse(content);
    AST.CONFIG.loc = true;

   // showDiff(result, ASTFixture)
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize jsig is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
