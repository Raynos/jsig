'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js');

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
            AST.param(null, makeLiteral('String')),
            AST.param(null, makeLiteral('T'))
        ],
        result: AST.generic(
            makeLiteral('OptionError'),
            [ makeLiteral('T') ]
        )
    })),
    AST.assignment('error/typed', AST.functionType({
        args: [
            AST.param('args', AST.object({
                'message': makeLiteral('String'),
                'type': makeLiteral('String')
            }))
        ],
        result: AST.functionType({
            args: [ AST.param('opts', makeLiteral('Object')) ],
            result: AST.generic(
                makeLiteral('TypedError'),
                [ makeLiteral('String') ]
            )
        })
    })),
    AST.assignment('error/validation', AST.functionType({
        args: [
            AST.param(null, AST.generic(
                makeLiteral('Array'),
                [ makeLiteral('Error') ]
            ))
        ],
        result: makeLiteral('ValidationError')
    }))
]);

test('the error type definition', function t(assert) {
    AST.CONFIG.loc = false;
    var result = parse(content);
    AST.CONFIG.loc = true;

    ASTFixture.statements[0].typeExpression.keyValues[0]
        .value.unions[0].genericIdentifierUUID = null;
    result.statements[0].typeExpression.keyValues[0]
        .value.unions[0].genericIdentifierUUID = null;

    result.statements[1].typeExpression.keyValues[1]
        .value.genericIdentifierUUID = null;
    ASTFixture.statements[1].typeExpression.keyValues[1]
        .value.genericIdentifierUUID = null;

    // showDiff(result, ASTFixture);
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
