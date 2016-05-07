'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions',
    'jsonml-stringify.mli');
var content = fs.readFileSync(uri, 'utf8');

function makeLiteral(name, builtin, opts) {
    opts = opts || {};
    if (typeof builtin === 'string') {
        opts.label = builtin;
        builtin = undefined;
    }

    return AST.literal(name, builtin, opts);
}

var ASTFixture = AST.program([
    AST.typeDeclaration('JsonMLSelector',
        makeLiteral('String')),
    AST.typeDeclaration('JsonMLTextContent',
        makeLiteral('String')),
    AST.typeDeclaration('JsonMLRawContent', AST.object({
        raw: makeLiteral('String')
    })),
    AST.typeDeclaration('JsonMLFragment', AST.object({
        fragment: AST.generic(
            makeLiteral('Array'),
            [makeLiteral('JsonML')]
        )
    })),
    AST.typeDeclaration('JsonMLAttributeKey',
        makeLiteral('String')),
    AST.typeDeclaration('JsonMLAttributeValue', AST.union([
        makeLiteral('String'),
        makeLiteral('Number'),
        makeLiteral('Boolean')
    ])),
    AST.typeDeclaration('JsonMLAttrs', AST.generic(
        makeLiteral('Object'),
        [
            makeLiteral('JsonMLAttributeKey'),
            makeLiteral('JsonMLAttributeValue')
        ])
    ),
    AST.typeDeclaration('MaybeJsonML', AST.union([
        makeLiteral('JsonMLTextContent'),
        makeLiteral('JsonMLRawContent'),
        AST.object({
            'fragment': AST.generic(
                makeLiteral('Array'),
                [makeLiteral('MaybeJsonML')]
            )
        }),
        AST.tuple([makeLiteral('JsonMLSelector')]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLRawContent')
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            AST.object({
                'fragment': AST.generic(
                    makeLiteral('Array'),
                    [makeLiteral('MaybeJsonML')]
                )
            })
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('Object')
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLTextContent')
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            AST.generic(
                makeLiteral('Array'),
                [makeLiteral('MaybeJsonML')]
            )
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLAttrs'),
            AST.generic(
                makeLiteral('Array'),
                [makeLiteral('MaybeJsonML')]
            )
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLAttrs'),
            makeLiteral('JsonMLTextContent')
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLAttrs'),
            AST.object({
                'fragment': AST.generic(
                    makeLiteral('Array'),
                    [makeLiteral('MaybeJsonML')]
                )
            })
        ]),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLAttrs'),
            makeLiteral('JsonMLRawContent')
        ])
    ])),
    AST.typeDeclaration('JsonML', AST.union([
        makeLiteral('JsonMLTextContent'),
        makeLiteral('JsonMLFragment'),
        makeLiteral('JsonMLRawContent'),
        AST.tuple([
            makeLiteral('JsonMLSelector'),
            makeLiteral('JsonMLAttrs'),
            AST.generic(
                makeLiteral('Array'),
                [makeLiteral('JsonML')]
            )
        ])
    ])),
    AST.assignment('jsonml-stringify', AST.functionType({
        args: [
            makeLiteral('JsonML', 'jsonml'),
            makeLiteral('Object', true, {
                label: 'opts',
                optional: true
            })
        ],
        result: makeLiteral('String')
    })),
    AST.assignment('jsonml-stringify/normalize', AST.functionType({
        args: [makeLiteral('MaybeJsonML')],
        result: makeLiteral('JsonML')
    })),
    AST.assignment('jsonml-stringify/dom', AST.functionType({
        args: [makeLiteral('JsonML', 'jsonml')],
        result: makeLiteral('DOMElement')
    })),
    AST.assignment('jsonml-stringify/attrs', AST.functionType({
        args: [makeLiteral('Object', 'attributes')],
        result: makeLiteral('String')
    })),
    AST.assignment('jsonml-stringify/unpack-selector',
        AST.functionType({
            args: [
                makeLiteral('String', 'selector'),
                makeLiteral('Object', 'attributes')
            ],
            result: makeLiteral('String', 'tagName')
        }))
]);

test('the jsonml-stringify type definition', function t(assert) {
    var result = parse(content);

    // showDiff(result, ASTFixture);
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize jsonml-stringify is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
