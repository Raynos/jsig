'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js')

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions', 'error.mli');
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
    AST.typeDeclaration('OptionError', AST.object({
        'option': AST.union([
            makeLiteral('T'),
            AST.value('null')
        ]),
        'message': makeLiteral('String'),
        'type': AST.value('"OptionError"', 'string')
    }), [ makeLiteral('T') ]),
    AST.typeDeclaration('TypedError', AST.object({
        'message': makeLiteral('String'),
        'type': makeLiteral('T')
    }), [ makeLiteral('T') ]),
    AST.typeDeclaration('ValidationError', AST.object({
        'errors': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('Error') ]
        ),
        'message': makeLiteral('String'),
        'type': AST.value('"ValidationError"', 'string')
    })),
    AST.assignment('error/option', AST.functionType({
        args: [
            makeLiteral('String'),
            makeLiteral('T')
        ],
        result: AST.generic(
            makeLiteral('OptionError'),
            [ makeLiteral('T') ]
        )
    })),
    AST.assignment('error/typed', AST.functionType({
        args: [
            AST.object({
                'message': makeLiteral('String'),
                'type': makeLiteral('String')
            }, 'args')
        ],
        result: AST.functionType({
            args: [ makeLiteral('Object', 'opts') ],
            result: AST.generic(
                makeLiteral('TypedError'),
                [ makeLiteral('String') ]
            )
        })
    })),
    AST.assignment('error/validation', AST.functionType({
        args: [
            AST.generic(
                makeLiteral('Array'),
                [ makeLiteral('Error') ]
            )
        ],
        result: makeLiteral('ValidationError')
    }))
]);

test('the error type definition', function t(assert) {
    var result = parse(content);

    // showDiff(result, ASTFixture)
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize error is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
