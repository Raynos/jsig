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

function makeParam(name, value) {
    var opts = {};

    if (name && name[name.length - 1] === '?') {
        opts.optional = true;
        name = name.substr(0, name.length - 1);
    }

    return AST.param(name, value, opts);
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
                args: [makeParam(null, AST.generic(
                    makeLiteral('Callback'),
                    [makeLiteral('MongoCursor')]
                ))],
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
                args: [AST.param('name', makeLiteral('String'))],
                result: makeLiteral('Collection')
            })
        }),
        AST.functionType({
            args: [makeParam(null, AST.generic(
                makeLiteral('Callback'),
                [makeLiteral('MongoDB')]
            ))],
            result: makeLiteral('void')
        })
    ])),
    AST.typeDeclaration('Collection', AST.intersection([
        AST.object({
            'find': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Cursor'),
                    [makeLiteral('T')]
                )
            }),
            'findById': AST.functionType({
                args: [
                    makeParam('id', makeLiteral('String')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findAndModify': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('sort?', makeLiteral('Array')),
                    makeParam('doc?', makeLiteral('Object')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findAndRemove': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('sort?', makeLiteral('Array')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'findOne': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('T')]
                )
            }),
            'insert': AST.functionType({
                args: [
                    makeParam('docs', AST.generic(
                        makeLiteral('Array'),
                        [makeLiteral('T')]
                    )),
                    makeParam('options?', makeLiteral('Object'))
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
                    makeParam('map', makeLiteral('Function')),
                    makeParam('reduce', makeLiteral('Function')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Collection')]
                )
            }),
            'remove': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Number')]
                )
            }),
            'update': AST.functionType({
                args: [
                    makeParam('selector', makeLiteral('Object')),
                    makeParam('doc?', makeLiteral('Object')),
                    makeParam('options?', makeLiteral('Object'))
                ],
                result: AST.generic(
                    makeLiteral('Continuable'),
                    [makeLiteral('Number')]
                )
            })
        }),
        AST.functionType({
            args: [makeParam(null, AST.generic(
                makeLiteral('Callback'),
                [makeLiteral('MongoCollection')]
            ))],
            result: makeLiteral('void')
        })
    ]), [ makeLiteral('T') ]),
    AST.assignment('continuable-mongo/cursor', AST.functionType({
        args: [
            makeParam(null, AST.generic(
                makeLiteral('Collection'),
                [makeLiteral('T')]
            )),
            makeParam('selector', makeLiteral('Object')),
            makeParam('options?', makeLiteral('Object'))
        ],
        result: AST.generic(
            makeLiteral('Cursor'),
            [makeLiteral('T')]
        )
    })),
    AST.assignment('continuable-mongo/collection',
        AST.functionType({
            args: [makeParam(null, makeLiteral('Client'))],
            result: AST.functionType({
                args: [makeParam('collectionName', makeLiteral('String'))],
                result: makeLiteral('Collection')
            })
        })),
    AST.assignment('continuable-mongo', AST.functionType({
        args: [
            makeParam('uri', makeLiteral('String')),
            makeParam('options?', makeLiteral('Object'))
        ],
        result: makeLiteral('Client')
    }))
]);

test('the continuable-mongo type definition', function t(assert) {
    AST.CONFIG.loc = false;
    var result = parse(content);
    AST.CONFIG.loc = true;

    result.statements[5].typeExpression.intersections[0]
        .keyValues[5].value.args[0].value
        .generics[0].genericIdentifierUUID = null;
    ASTFixture.statements[5].typeExpression.intersections[0]
        .keyValues[5].value.args[0].value
        .generics[0].genericIdentifierUUID = null;

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
