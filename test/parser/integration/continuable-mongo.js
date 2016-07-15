'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js');

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions',
    'continuable-mongo.mli');
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
    AST.importStatement('node.jsig', [
        makeLiteral('Stream')
    ]),
    AST.importStatement('continuable.jsig', [
        makeLiteral('Continuable')
    ]),
    AST.importStatement('mongodb.jsig', [
        AST.renamedLiteral('MongoCursor', 'Cursor'),
        AST.renamedLiteral('MongoCollection', 'Collection'),
        AST.renamedLiteral('MongoDB', 'DB')
    ]),
    AST.typeDeclaration('Cursor',
        AST.intersection([
            AST.object({
                'toArray': AST.functionType({
                    result: AST.generic(
                        makeLiteral('Continuable'),
                        [AST.generic(
                            makeLiteral('Array'),
                            [makeLiteral('T')]
                        )]
                    )
                }),
                'nextObject': AST.functionType({
                    result: AST.generic(
                        makeLiteral('Continuable'),
                        [AST.union([
                            makeLiteral('T'),
                            AST.value('null')
                        ])
                    ])
                }),
                'stream': AST.functionType({
                    result: makeLiteral('Stream')
                })
            }),
            AST.functionType({
                args: [AST.generic(
                    makeLiteral('Callback'),
                    [makeLiteral('MongoCursor')]
                )],
                result: makeLiteral('void')
            })
        ]),
        [makeLiteral('T')]
    ),
    AST.typeDeclaration('Client', AST.intersection([
        AST.object({
            'close': AST.generic(
                makeLiteral('Continuable'),
                [makeLiteral('void')
            ]),
            'collection': AST.functionType({
                args: [makeLiteral('String', 'name')],
                result: makeLiteral('Collection')
            })
        }),
        AST.functionType({
            args: [AST.generic(
                makeLiteral('Callback'),
                [makeLiteral('MongoDB')]
            )],
            result: makeLiteral('void')
        })
    ])),
    AST.typeDeclaration('Collection', AST.intersection([
        AST.object({
            'find': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Cursor'),
                    [makeLiteral('T')]
                )
            }),
            'findById': AST.functionType({
                args: [
                    makeLiteral('String', true, {
                        label: 'id'
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findAndModify': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Array', true, {
                        label: 'sort',
                        optional: true
                    }),
                    makeLiteral('Object', true, {
                        label: 'doc',
                        optional: true
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findAndRemove': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Array', true, {
                        label: 'sort',
                        optional: true
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findOne': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'insert': AST.functionType({
                args: [
                    AST.generic(
                        makeLiteral('Array'),
                        [makeLiteral('T')],
                        'docs'
                    ),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [AST.generic(
                        makeLiteral('Array'),
                        [makeLiteral('T')]
                    )]
                )
            }),
            'mapReduce': AST.functionType({
                args: [
                    makeLiteral('Function', true, {
                        label: 'map'
                    }),
                    makeLiteral('Function', true, {
                        label: 'reduce'
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Collection')]
                )
            }),
            'remove': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Number')]
                )
            }),
            'update': AST.functionType({
                args: [
                    makeLiteral('Object', true, {
                        label: 'selector'
                    }),
                    makeLiteral('Object', true, {
                        label: 'doc',
                        optional: true
                    }),
                    makeLiteral('Object', true, {
                        label: 'options',
                        optional: true
                    })
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Number')]
                )
            })
        }),
        AST.functionType({
            args: [AST.generic(
                makeLiteral('Callback'),
                [makeLiteral('MongoCollection')]
            )],
            result: makeLiteral('void')
        })
    ]), [ makeLiteral('T') ]),
    AST.assignment('continuable-mongo/cursor', AST.functionType({
        args: [
            AST.generic(
                makeLiteral('Collection'),
                [makeLiteral('T')]
            ),
            makeLiteral('Object', true, {
                label: 'selector'
            }),
            makeLiteral('Object', true, {
                label: 'options',
                optional: true
            })
        ],
        result: AST.generic(
            makeLiteral('Cursor'),
            [makeLiteral('T')]
        )
    })),
    AST.assignment('continuable-mongo/collection',
        AST.functionType({
            args: [makeLiteral('Client')],
            result: AST.functionType({
                args: [makeLiteral('String', true, {
                    label: 'collectionName'
                })],
                result: makeLiteral('Collection')
            })
        })),
    AST.assignment('continuable-mongo', AST.functionType({
        args: [
            makeLiteral('String', true, {
                label: 'uri'
            }),
            makeLiteral('Object', true, {
                label: 'options',
                optional: true
            })
        ],
        result: makeLiteral('Client')
    }))
]);

test('the continuable-mongo type definition', function t(assert) {
    AST.CONFIG.loc = false;
    var result = parse(content);
    AST.CONFIG.loc = true;

    // showDiff(result, ASTFixture);
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize continualbe-mongo is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
