'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js')

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions', 'frp-keyboard.mli');
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
    AST.importStatement('observ', [ makeLiteral('Observ') ]),
    AST.importStatement('dom-delegator', [ makeLiteral('Delegator') ]),
    AST.typeDeclaration('KeyCode', makeLiteral('Number')),
    AST.typeDeclaration('Direction', AST.union([
        AST.value('"left"', 'string'),
        AST.value('"right"', 'string'),
        AST.value('"up"', 'string'),
        AST.value('"down"', 'string'),
        AST.value('"void"', 'string')
    ])),
    AST.typeDeclaration('Coord', AST.object({
        'x': makeLiteral('Number'),
        'y': makeLiteral('Number'),
        'lastPressed': makeLiteral('Direction')
    })),
    AST.typeDeclaration('NativeKeyboard', AST.object({
        'isDown': AST.functionType({
            args: [ makeLiteral('KeyCode', 'keyCode') ],
            result: AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Boolean') ])
        }),
        'keysDown': AST.generic(
            makeLiteral('Observ'),
            [
                AST.generic(
                    makeLiteral('Array'),
                    [ makeLiteral('KeyCode', 'keyCode') ]
                )
            ]),
        'keyDown': AST.generic(
            makeLiteral('Observ'),
            [ makeLiteral('KeyCode', 'keyCode') ]),
        'lastPressed': AST.generic(
            makeLiteral('Observ'),
            [ makeLiteral('KeyCode', 'keyCode') ]),
        'directions': AST.functionType({
            args: [
                makeLiteral('KeyCode', 'up'),
                makeLiteral('KeyCode', 'down'),
                makeLiteral('KeyCode', 'left'),
                makeLiteral('KeyCode', 'right')
            ],
            result: AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Coord') ])
        })
    })),
    AST.typeDeclaration('Keyboard', AST.intersection([
        makeLiteral('NativeKeyboard'),
        AST.object({
            'arrows': AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Coord') ]
            ),
            'wasd': AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Coord') ]
            ),
            'ctrl': AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Boolean') ]
            ),
            'shift': AST.generic(
                makeLiteral('Observ'),
                [ makeLiteral('Boolean') ]
            )
        })
    ])),
    AST.assignment('frp-keyboard', AST.functionType({
        args: [],
        result: makeLiteral('Keyboard', 'cachedKeyboard')
    })),
    AST.assignment('frp-keyboard/keyboard', AST.functionType({
        args: [ makeLiteral('Delegator') ],
        result: makeLiteral('Keyboard')
    })),
    AST.assignment('frp-keyboard/native', AST.functionType({
        args: [ makeLiteral('Delegator') ],
        result: makeLiteral('NativeKeyboard')
    }))
]);

test('the frp-keyboard type definition', function t(assert) {
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
