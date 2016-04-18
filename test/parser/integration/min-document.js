'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');

// var showDiff = require('../lib/show-diff.js')

var parse = require('../../../parser.js');
var AST = require('../../../ast/');
var serialize = require('../../../serialize.js');

var uri = path.join(__dirname, 'definitions', 'min-document.mli');
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
    AST.typeDeclaration('DOMText', AST.object({
        'data': makeLiteral('String'),
        'type':
            AST.value('"DOMTextNode"', 'string'),
        'length': makeLiteral('Number'),
        'nodeType': AST.value('3', 'number'),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeLiteral('DOMText', 'this')
        }),
        'replaceChild': AST.functionType({
            args: [
                makeLiteral('Number', 'index'),
                makeLiteral('Number', 'length'),
                makeLiteral('String', 'value')
            ],
            result: makeLiteral('void'),
            thisArg: makeLiteral('DOMText', 'this')
        })
    })),
    AST.typeDeclaration('DOMNode', AST.union([
        makeLiteral('DOMText'),
        makeLiteral('DOMElement'),
        makeLiteral('DocumentFragment')
    ])),
    AST.typeDeclaration('DOMChild', AST.union([
        makeLiteral('DOMText'),
        makeLiteral('DOMElement')
    ])),
    AST.typeDeclaration('DOMElement', AST.object({
        'tagName': makeLiteral('String'),
        'className': makeLiteral('String'),
        'dataset': AST.generic(
            makeLiteral('Object'),
            [ makeLiteral('String'), makeLiteral('Any') ]
        ),
        'childNodes': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('DOMChild') ]
        ),
        'parentNode': AST.union([
            AST.value('null'),
            makeLiteral('DOMElement')
        ]),
        'style': AST.generic(
            makeLiteral('Object'),
            [ makeLiteral('String'), makeLiteral('String') ]
        ),
        'type': AST.value('"DOMElement"', 'string'),
        'nodeType': AST.value('1', 'number'),
        'ownerDocument': AST.union([
            AST.value('null'),
            makeLiteral('Document')
        ]),
        'namespaceURI': AST.union([
            AST.value('null'),
            makeLiteral('String')
        ]),
        'appendChild': AST.functionType({
            args: [ makeLiteral('DOMChild', 'child') ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DOMElement', 'this')
        }),
        'replaceChild': AST.functionType({
            args: [
                makeLiteral('DOMChild', 'elem'),
                makeLiteral('DOMChild', 'needle')
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DOMElement', 'this')
        }),
        'removeChild': AST.functionType({
            args: [ makeLiteral('DOMChild', 'child') ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DOMElement', 'this')
        }),
        'insertBefore': AST.functionType({
            args: [
                makeLiteral('DOMChild', 'elem'),
                AST.union([
                    makeLiteral('DOMChild'),
                    AST.value('null'),
                    AST.value('undefined')
                ], 'needle')
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DOMElement', 'this')
        }),
        'addEventListener': makeLiteral('addEventListener'),
        'dispatchEvent': makeLiteral('dispatchEvent'),
        'focus': AST.functionType({
            result: makeLiteral('void'),
            thisArg: makeLiteral('DOMElement', 'this')
        }),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeLiteral('DOMElement', 'this')
        })
    })),
    AST.typeDeclaration('DocumentFragment', AST.object({
        'childNodes': AST.generic(
            makeLiteral('Array'),
            [ makeLiteral('DOMChild') ]
        ),
        'parentNode': AST.union([
            AST.value('null'),
            makeLiteral('DOMElement')
        ]),
        'type': AST.value('"DocumentFragment"', 'string'),
        'nodeType': AST.value('11', 'number'),
        'nodeName': AST.value('"#document-fragment"', 'string'),
        'ownerDocument': AST.union([
            makeLiteral('Document'),
            AST.value('null')
        ]),
        'appendChild': AST.functionType({
            args: [makeLiteral('DOMChild', 'child')],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DocumentFragment', 'this')
        }),
        'replaceChild': AST.functionType({
            args: [
                makeLiteral('DOMChild', 'elem'),
                makeLiteral('DOMChild', 'needle')
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DocumentFragment', 'this')
        }),
        'removeChild': AST.functionType({
            args: [ makeLiteral('DOMChild', 'child') ],
            result: makeLiteral('DOMChild'),
            thisArg: makeLiteral('DocumentFragment', 'this')
        }),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeLiteral('DocumentFragment', 'this')
        })
    })),
    AST.typeDeclaration('Document', AST.object({
        'body': makeLiteral('DOMElement'),
        'documentElement': makeLiteral('DOMElement'),
        'createTextNode': AST.functionType({
            args: [ makeLiteral('String', 'value') ],
            thisArg: makeLiteral('Document', 'this'),
            result: makeLiteral('DOMText')
        }),
        'createElement': AST.functionType({
            args: [ makeLiteral('String', 'tagName') ],
            thisArg: makeLiteral('Document', 'this'),
            result: makeLiteral('DOMElement')
        }),
        'createElementNS': AST.functionType({
            args: [
                AST.union([
                    makeLiteral('String'),
                    AST.value('null')
                ], 'namespace'),
                makeLiteral('String', 'tagName')
            ],
            thisArg: makeLiteral('Document', 'this'),
            result: makeLiteral('DOMElement')
        }),
        'createDocumentFragment': AST.functionType({
            args: [],
            thisArg: makeLiteral('Document', 'this'),
            result: makeLiteral('DocumentFragment')
        }),
        'createEvent': AST.functionType({
            args: [],
            thisArg: makeLiteral('Document', 'this'),
            result: makeLiteral('Event')
        }),
        'getElementById': AST.functionType({
            args: [
                makeLiteral('String', 'id'),
                makeLiteral('DOMElement', 'parent', {
                    optional: true
                })
            ],
            thisArg: makeLiteral('Document', 'this'),
            result: AST.union([
                AST.value('null'),
                makeLiteral('DOMElement')
            ])
        })
    })),
    AST.typeDeclaration('Event', AST.object({
        'type': makeLiteral('String'),
        'bubbles': makeLiteral('Boolean'),
        'cancelable': makeLiteral('Boolean'),
        'initEvent': AST.functionType({
            args: [
                makeLiteral('String', 'type'),
                makeLiteral('Boolean', 'bubbles'),
                makeLiteral('Boolean', 'cancelable')
            ],
            thisArg: makeLiteral('Event', 'this'),
            result: makeLiteral('void')
        })
    })),
    AST.typeDeclaration('addEventListener', AST.functionType({
        args: [
            makeLiteral('String', 'type'),
            makeLiteral('Listener', 'listener')
        ],
        thisArg: makeLiteral('DOMElement', 'this'),
        result: makeLiteral('void')
    })),
    AST.typeDeclaration('dispatchEvent', AST.functionType({
        args: [ makeLiteral('Event', 'ev') ],
        thisArg: makeLiteral('DOMElement', 'this'),
        result: makeLiteral('void')
    })),
    AST.assignment('min-document/event/add-event-listener',
        makeLiteral('addEventListener')),
    AST.assignment('min-document/event/dispatch-event',
        makeLiteral('dispatchEvent')),
    AST.assignment('min-document/document', AST.functionType({
        args: [],
        result: makeLiteral('Document')
    })),
    AST.assignment('min-document/dom-element', AST.functionType({
        args: [
            makeLiteral('String', 'tagName'),
            makeLiteral('Document', 'owner', { optional: true }),
            AST.union([
                makeLiteral('String'),
                AST.value('null')
            ], 'namespace', { optional: true })
        ],
        result: makeLiteral('DOMElement')
    })),
    AST.assignment('min-document/dom-fragment', AST.functionType({
        args: [ makeLiteral('Document', 'owner', { optional: true }) ],
        result: makeLiteral('DocumentFragment')
    })),
    AST.assignment('min-document/dom-text', AST.functionType({
        args: [
            makeLiteral('String', 'value'),
            makeLiteral('Document', 'owner', { optional: true })
        ],
        result: makeLiteral('DOMText')
    })),
    AST.assignment('min-document/event', AST.functionType({
        args: [],
        result: makeLiteral('Event')
    })),
    AST.assignment('min-document/serialize', AST.functionType({
        args: [ makeLiteral('DOMElement') ],
        result: makeLiteral('String')
    })),
    AST.assignment('min-document', makeLiteral('Document'))
]);

test('the min-document type definition', function t(assert) {
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
