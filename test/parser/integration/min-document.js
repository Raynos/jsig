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
    AST.typeDeclaration('DOMText', AST.object({
        'data': makeLiteral('String'),
        'type':
            AST.value('"DOMTextNode"', 'string'),
        'length': makeLiteral('Number'),
        'nodeType': AST.value('3', 'number'),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeParam('this', makeLiteral('DOMText'))
        }),
        'replaceChild': AST.functionType({
            args: [
                makeParam('index', makeLiteral('Number')),
                makeParam('length', makeLiteral('Number')),
                makeParam('value', makeLiteral('String'))
            ],
            result: makeLiteral('void'),
            thisArg: makeParam('this', makeLiteral('DOMText'))
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
            [ makeLiteral('String'), makeLiteral('Mixed') ]
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
            args: [ makeParam('child', makeLiteral('DOMChild')) ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
        }),
        'replaceChild': AST.functionType({
            args: [
                makeParam('elem', makeLiteral('DOMChild')),
                makeParam('needle', makeLiteral('DOMChild'))
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
        }),
        'removeChild': AST.functionType({
            args: [ makeParam('child', makeLiteral('DOMChild')) ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
        }),
        'insertBefore': AST.functionType({
            args: [
                makeParam('elem', makeLiteral('DOMChild')),
                makeParam('needle', AST.union([
                    makeLiteral('DOMChild'),
                    AST.value('null'),
                    AST.value('undefined')
                ]))
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
        }),
        'addEventListener': makeLiteral('addEventListener'),
        'dispatchEvent': makeLiteral('dispatchEvent'),
        'focus': AST.functionType({
            result: makeLiteral('void'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
        }),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeParam('this', makeLiteral('DOMElement'))
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
            args: [ makeParam('child', makeLiteral('DOMChild')) ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DocumentFragment'))
        }),
        'replaceChild': AST.functionType({
            args: [
                makeParam('elem', makeLiteral('DOMChild')),
                makeParam('needle', makeLiteral('DOMChild'))
            ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DocumentFragment'))
        }),
        'removeChild': AST.functionType({
            args: [ makeParam('child', makeLiteral('DOMChild')) ],
            result: makeLiteral('DOMChild'),
            thisArg: makeParam('this', makeLiteral('DocumentFragment'))
        }),
        'toString': AST.functionType({
            result: makeLiteral('String'),
            thisArg: makeParam('this', makeLiteral('DocumentFragment'))
        })
    })),
    AST.typeDeclaration('Document', AST.object({
        'body': makeLiteral('DOMElement'),
        'documentElement': makeLiteral('DOMElement'),
        'createTextNode': AST.functionType({
            args: [ makeParam('value', makeLiteral('String')) ],
            thisArg: makeParam('this', makeLiteral('Document')),
            result: makeLiteral('DOMText')
        }),
        'createElement': AST.functionType({
            args: [ makeParam('tagName', makeLiteral('String')) ],
            thisArg: makeParam('this', makeLiteral('Document')),
            result: makeLiteral('DOMElement')
        }),
        'createElementNS': AST.functionType({
            args: [
                makeParam('namespace', AST.union([
                    makeLiteral('String'),
                    AST.value('null')
                ])),
                makeParam('tagName', makeLiteral('String'))
            ],
            thisArg: makeParam('this', makeLiteral('Document')),
            result: makeLiteral('DOMElement')
        }),
        'createDocumentFragment': AST.functionType({
            args: [],
            thisArg: makeParam('this', makeLiteral('Document')),
            result: makeLiteral('DocumentFragment')
        }),
        'createEvent': AST.functionType({
            args: [],
            thisArg: makeParam('this', makeLiteral('Document')),
            result: makeLiteral('Event')
        }),
        'getElementById': AST.functionType({
            args: [
                makeParam('id', makeLiteral('String')),
                makeParam('parent?', makeLiteral('DOMElement'))
            ],
            thisArg: makeParam('this', makeLiteral('Document')),
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
                makeParam('type', makeLiteral('String')),
                makeParam('bubbles', makeLiteral('Boolean')),
                makeParam('cancelable', makeLiteral('Boolean'))
            ],
            thisArg: makeParam('this', makeLiteral('Event')),
            result: makeLiteral('void')
        })
    })),
    AST.typeDeclaration('addEventListener', AST.functionType({
        args: [
            makeParam('type', makeLiteral('String')),
            makeParam('listener', makeLiteral('Listener'))
        ],
        thisArg: makeParam('this', makeLiteral('DOMElement')),
        result: makeLiteral('void')
    })),
    AST.typeDeclaration('dispatchEvent', AST.functionType({
        args: [ makeParam('ev', makeLiteral('Event')) ],
        thisArg: makeParam('this', makeLiteral('DOMElement')),
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
            makeParam('tagName', makeLiteral('String')),
            makeParam('owner?', makeLiteral('Document')),
            makeParam('namespace?', AST.union([
                makeLiteral('String'),
                AST.value('null')
            ]))
        ],
        result: makeLiteral('DOMElement')
    })),
    AST.assignment('min-document/dom-fragment', AST.functionType({
        args: [ makeParam('owner?', makeLiteral('Document')) ],
        result: makeLiteral('DocumentFragment')
    })),
    AST.assignment('min-document/dom-text', AST.functionType({
        args: [
            makeParam('value', makeLiteral('String')),
            makeParam('owner?', makeLiteral('Document'))
        ],
        result: makeLiteral('DOMText')
    })),
    AST.assignment('min-document/event', AST.functionType({
        args: [],
        result: makeLiteral('Event')
    })),
    AST.assignment('min-document/serialize', AST.functionType({
        args: [ makeParam(null, makeLiteral('DOMElement')) ],
        result: makeLiteral('String')
    })),
    AST.assignment('min-document', makeLiteral('Document'))
]);

test('the min-document type definition', function t(assert) {
    AST.CONFIG.loc = false;
    var result = parse(content);
    AST.CONFIG.loc = true;

    // showDiff(result, ASTFixture)
    assert.deepEqual(result, ASTFixture);

    assert.end();
});

test('serialize min-document is idempotent', function t(assert) {
    var tree = parse(content);
    var text = serialize(tree);

    var rawLines = content.split('\n');
    var newLines = text.split('\n');

    assert.deepEqual(rawLines, newLines);

    assert.end();
});
