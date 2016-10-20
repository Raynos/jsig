(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* @jsig */

/**
    In some future we will convert the JsigAST parser to a grown
    up system like pegjs

    When we do so we should be able to configure the parser,
    for example `Jsig.parse(source: String, { loc: Boolean });`

    But today, the parser is using the Parsimmon library which
    is build up statically without having a story for configuring.

    Because these is no way to configure it, the only way to do
    so is to mutate global state and then unmutate it...
*/
var ASTConfig = {
    loc: true
};

module.exports = ASTConfig;

},{}],2:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = AssignmentNode;

function AssignmentNode(id, expr) {
    this.type = 'assignment';
    this.identifier = id;
    this.typeExpression = expr;
    this._raw = null;
}

},{}],3:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = CommentNode;

function CommentNode(text) {
    this.type = 'comment';
    this.text = text;
    this._raw = null;
}

},{}],4:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = DefaultExportNode;

function DefaultExportNode(expr) {
    this.type = 'defaultExport';
    this.typeExpression = expr;
    this._raw = null;
}

},{}],5:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = FreeLiteralNode;

function FreeLiteralNode(name) {
    this.type = 'freeLiteral';
    this.name = name;
    this._raw = null;
}

},{}],6:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = FunctionParameterNode;

function FunctionParameterNode(name, value, opts) {
    this.type = 'param';
    this.name = name;
    this.value = value;
    this.optional = (opts && opts.optional) || false;
    this._raw = null;
}

},{}],7:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');
var uuid = require('uuid');

var LocationLiteralNode = require('./location-literal.js');
var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');

module.exports = FunctionNode;

function FunctionNode(opts) {
    assert(!(opts && opts.label), 'cannot have label on function');
    assert(!(opts && opts.optional), 'cannot have optional on function');

    this.type = 'function';
    this.args = opts.args || [];
    this.result = opts.result;
    this.thisArg = opts.thisArg || null;
    // Brand is used if this function is a constructor
    // This will brand the object instance allocated with `new`
    this.brand = opts.brand || 'Object';
    // specialKind is used to store singleton information
    // For example the assert function has special type narrow
    // semantics so its FunctionNode is the "assert" specialKind
    this.specialKind = opts.specialKind || null;
    this._raw = null;

    if (opts.generics && typeof opts.generics[0] === 'string') {
        /*jsig ignore next: narrowing by array member not implemented*/
        this.generics = this._findGenerics(opts.generics);
    } else {
        this.generics = [];
    }
}

FunctionNode.prototype._findGenerics =
function _findGenerics(generics) {
    var replacer = new GenericReplacer(this, generics);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this, []);

    return replacer.seenGenerics;
};

function GenericReplacer(node, generics) {
    this.node = node;

    this.knownGenerics = generics;
    this.genericUUIDs = Object.create(null);
    for (var i = 0; i < this.knownGenerics.length; i++) {
        this.genericUUIDs[this.knownGenerics[i]] = uuid();
    }
    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, raw, stack);
    } else {
        assert(false, 'unexpected other type: ' + ast.type);
    }
};

GenericReplacer.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, raw, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    this.seenGenerics.push(new LocationLiteralNode(ast.name, stack.slice()));

    ast.isGeneric = true;
    ast.genericIdentifierUUID = this.genericUUIDs[ast.name];
    return ast;
};

},{"../type-checker/lib/jsig-ast-replacer.js":78,"./location-literal.js":14,"assert":24,"uuid":49}],8:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = GenericLiteralNode;

function GenericLiteralNode(value, generics, label) {
    assert(!label, 'cannot have label on generic');

    this.type = 'genericLiteral';
    this.value = value;
    this.generics = generics;
    this._raw = null;
}

},{"assert":24}],9:[function(require,module,exports){
'use strict';

/* @jsig */

var ASTConfig = require('./_ast-config.js');

module.exports = ImportStatementNode;

function ImportStatementNode(dependency, types, opts) {
    this.type = 'import';
    this.dependency = dependency;
    this.types = types;
    this.line = (ASTConfig.loc && opts && opts.line) || null;
    this.loc = (ASTConfig.loc && opts && opts.loc) || null;
    this.isMacro = (opts && opts.isMacro) || false;
    this._raw = null;
}

},{"./_ast-config.js":1}],10:[function(require,module,exports){
'use strict';

var ASTConfig = require('./_ast-config.js');
var ProgramNode = require('./program.js');
var TypeDeclarationNode = require('./type-declaration.js');
var AssignmentNode = require('./assignment.js');
var ImportStatementNode = require('./import-statement.js');
var ObjectNode = require('./object.js');
var UnionTypeNode = require('./union.js');
var IntersectionTypeNode = require('./intersection.js');
var LiteralTypeNode = require('./literal.js');
var FreeLiteralNode = require('./free-literal.js');
var LocationLiteralNode = require('./location-literal.js');
var KeyValueNode = require('./key-value.js');
var ValueLiteralNode = require('./value.js');
var FunctionNode = require('./function.js');
var GenericLiteralNode = require('./generic.js');
var TupleNode = require('./tuple.js');
var RenamedLiteralNode = require('./renamed-literal.js');
var CommentNode = require('./comment.js');
var DefaultExportNode = require('./default-export.js');
var FunctionParameterNode = require('./function-parameter.js');
var MacroLiteralNode = require('./macro-literal.js');

module.exports = {
    CONFIG: ASTConfig,
    program: function program(statements) {
        return new ProgramNode(statements);
    },
    typeDeclaration: function typeDeclaration(id, expr, generics) {
        return new TypeDeclarationNode(id, expr, generics);
    },
    assignment: function assigment(id, expr) {
        return new AssignmentNode(id, expr);
    },
    importStatement: function importStatement(dependency, types, opts) {
        return new ImportStatementNode(dependency, types, opts);
    },
    object: function object(pairs, label, opts) {
        return new ObjectNode(pairs, label, opts);
    },
    union: function union(unions, label, opts) {
        return new UnionTypeNode(unions, label, opts);
    },
    intersection: function intersection(pairs, label, opts) {
        return new IntersectionTypeNode(pairs, label, opts);
    },
    literal: function literal(name, builtin, opts) {
        return new LiteralTypeNode(name, builtin, opts);
    },
    locationLiteral: function locationLiteral(name, loc) {
        return new LocationLiteralNode(name, loc);
    },
    freeLiteral: function freeLiteral(name) {
        return new FreeLiteralNode(name);
    },
    keyValue: function keyValue(key, value, opts) {
        return new KeyValueNode(key, value, opts);
    },
    value: function value($value, name, label) {
        return new ValueLiteralNode($value, name, label);
    },
    functionType: function functionType(opts) {
        return new FunctionNode(opts);
    },
    param: function param(name, value, opts) {
        return new FunctionParameterNode(name, value, opts);
    },
    generic: function generic(value, generics, label) {
        return new GenericLiteralNode(value, generics, label);
    },
    tuple: function tuple(values, label, opts) {
        return new TupleNode(values, label, opts);
    },
    renamedLiteral: function renamedLiteral(token, original, opts) {
        return new RenamedLiteralNode(token, original, opts);
    },
    comment: function comment(text) {
        return new CommentNode(text);
    },
    defaultExport: function defaultExport(type) {
        return new DefaultExportNode(type);
    },
    macroLiteral: function macroLiteral(macroName, macroFile) {
        return new MacroLiteralNode(macroName, macroFile);
    }
};

},{"./_ast-config.js":1,"./assignment.js":2,"./comment.js":3,"./default-export.js":4,"./free-literal.js":5,"./function-parameter.js":6,"./function.js":7,"./generic.js":8,"./import-statement.js":9,"./intersection.js":11,"./key-value.js":12,"./literal.js":13,"./location-literal.js":14,"./macro-literal.js":15,"./object.js":16,"./program.js":17,"./renamed-literal.js":18,"./tuple.js":19,"./type-declaration.js":20,"./union.js":21,"./value.js":22}],11:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = IntersectionTypeNode;

function IntersectionTypeNode(intersections, label, opts) {
    assert(!label, 'cannot have label on intersection');
    assert(!(opts && opts.optional), 'cannot have optional on intersection');

    this.type = 'intersectionType';
    this.intersections = intersections;
    this._raw = null;
}

IntersectionTypeNode.prototype.buildObjectIndex =
function buildObjectIndex(index) {
    index = index || {};

    /* jsig ignore next: cannot yet narrow by string field check */
    for (var i = 0; i < this.intersections.length; i++) {
        var maybeObj = this.intersections[i];
        if (maybeObj.type !== 'object') {
            continue;
        }

        maybeObj.buildObjectIndex(index);
    }

    return index;
};

},{"assert":24}],12:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = KeyValueNode;

function KeyValueNode(key, value, opts) {
    this.type = 'keyValue';
    this.key = key;
    this.value = value;
    this.optional = (opts && opts.optional) || false;
    this.isMethod = false;
    this.isOverloaded = false;
    this._raw = null;
}

},{}],13:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

var ASTConfig = require('./_ast-config.js');
var builtinTypes = require('../parser/builtin-types.js');

module.exports = LiteralTypeNode;

function LiteralTypeNode(name, builtin, opts) {
    assert(!(opts && opts.label), 'cannot have label on literal');
    assert(!(opts && opts.optional), 'cannot have optional on literal');

    builtin = builtin !== undefined ? builtin :
        builtinTypes.indexOf(name) !== -1;

    this.type = 'typeLiteral';
    this.name = name;
    this.builtin = builtin;
    this.line = (ASTConfig.loc && opts && opts.line) || null;
    this.loc = (ASTConfig.loc && opts && opts.loc) || null;

    // TODO: gaurd against re-assignment...
    this.concreteValue = (opts && 'concreteValue' in opts) ?
        opts.concreteValue : null;

    this.isGeneric = false;
    this.genericIdentifierUUID = null;
    this._raw = null;
}

},{"../parser/builtin-types.js":52,"./_ast-config.js":1,"assert":24}],14:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = LocationLiteralNode;

function LocationLiteralNode(name, location) {
    assert(location.length > 0, 'location must contain values');

    this.type = 'locationLiteral';
    this.name = name;
    this.location = location;
    this._raw = null;
}

},{"assert":24}],15:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = MacroLiteralNode;

function MacroLiteralNode(macroName, macroFile) {
    this.type = 'macroLiteral';

    this.macroName = macroName;
    this.macroFile = macroFile;
    this._raw = null;
}

},{}],16:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

var KeyValueNode = require('./key-value.js');

module.exports = ObjectNode;

function ObjectNode(keyValues, label, opts) {
    assert(!label, 'cannot have label on object');
    assert(!(opts && opts.optional), 'cannot have optional on object');

    var keyValuesArray = null;

    if (!Array.isArray(keyValues)) {
        keyValuesArray = convertToKeyValues(keyValues);
    } else {
        keyValuesArray = keyValues;
    }

    this.type = 'object';
    this.keyValues = keyValuesArray;
    this.open = (opts && opts.open) || false;
    this.brand = (opts && opts.brand) || 'Object';
    this.inferred = (opts && 'inferred' in opts) ?
        opts.inferred : false;
    this._raw = null;
}

ObjectNode.prototype.buildObjectIndex =
function buildObjectIndex(index) {
    index = index || Object.create(null);

    for (var i = 0; i < this.keyValues.length; i++) {
        var pair = this.keyValues[i];
        index[pair.key] = pair.value;
    }

    return index;
};

function convertToKeyValues(keyValuesObj) {
    var keyValues = [];
    var keys = Object.keys(keyValuesObj);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        keyValues.push(new KeyValueNode(key, keyValuesObj[key]));
    }

    return keyValues;
}

},{"./key-value.js":12,"assert":24}],17:[function(require,module,exports){
'use strict';

/* @jsig */

module.exports = ProgramNode;

function ProgramNode(statements) {
    this.type = 'program';
    this.statements = statements;
    this._raw = null;
}

},{}],18:[function(require,module,exports){
'use strict';

/* @jsig */

var LiteralTypeNode = require('./literal.js');

module.exports = RenamedLiteralNode;

function RenamedLiteralNode(token, original, opts) {
    if (typeof token === 'string') {
        token = new LiteralTypeNode(token, false, opts);
    }
    if (typeof original === 'string') {
        original = new LiteralTypeNode(original);
    }

    this.type = 'renamedLiteral';
    this.name = token.name;
    this.builtin = token.builtin;
    this.original = original;
    this._raw = null;
}

},{"./literal.js":13}],19:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = TupleNode;

function TupleNode(values, label, opts) {
    assert(!label, 'cannot have label on tuple');
    assert(!(opts && opts.optional), 'cannot have optional on tuple');

    this.type = 'tuple';
    this.values = values;
    this.inferred = (opts && 'inferred' in opts) ?
        opts.inferred : false;
    this._raw = null;
}

},{"assert":24}],20:[function(require,module,exports){
'use strict';

/* @jsig */

var uuid = require('uuid');
var assert = require('assert');

var JsigASTReplacer = require('../type-checker/lib/jsig-ast-replacer.js');
var LocationLiteralNode = require('./location-literal.js');

module.exports = TypeDeclarationNode;

function TypeDeclarationNode(identifier, expr, generics) {
    generics = generics || [];

    this.type = 'typeDeclaration';
    this.identifier = identifier;
    this.typeExpression = expr;
    this._raw = null;

    this.generics = generics;

    if (generics.length > 0) {
        this.seenGenerics = this._markGenerics(generics);
    } else {
        this.seenGenerics = [];
    }
}

TypeDeclarationNode.prototype._markGenerics =
function _markGenerics(generics) {
    var genericNames = [];
    for (var i = 0; i < generics.length; i++) {
        genericNames.push(generics[i].name);
    }

    // console.log('_markGenerics()', this.identifier);

    var replacer = new GenericReplacer(this, genericNames);
    var astReplacer = new JsigASTReplacer(replacer, true);
    astReplacer.inlineReferences(this, this, []);

    return replacer.seenGenerics;
};

function GenericReplacer(node, genericNames) {
    this.node = node;

    this.knownGenerics = genericNames;
    this.genericUUIDs = Object.create(null);
    for (var i = 0; i < this.knownGenerics.length; i++) {
        this.genericUUIDs[this.knownGenerics[i]] = uuid();
    }
    this.seenGenerics = [];
}

GenericReplacer.prototype.replace = function replace(ast, raw, stack) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, raw, stack);
    } else {
        assert(false, 'unexpected other type: ' + ast.type);
    }
};

GenericReplacer.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, raw, stack) {
    if (this.knownGenerics.indexOf(ast.name) === -1) {
        return ast;
    }

    this.seenGenerics.push(new LocationLiteralNode(ast.name, stack.slice()));

    ast.isGeneric = true;
    ast.genericIdentifierUUID = this.genericUUIDs[ast.name];
    return ast;
};

},{"../type-checker/lib/jsig-ast-replacer.js":78,"./location-literal.js":14,"assert":24,"uuid":49}],21:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = UnionTypeNode;

function UnionTypeNode(unions, label, opts) {
    assert(!label, 'cannot have label on union');
    assert(!(opts && opts.optional), 'cannot have optional on union');

    this.type = 'unionType';
    this.unions = unions;
    this._raw = null;
}

},{"assert":24}],22:[function(require,module,exports){
'use strict';

/* @jsig */

var assert = require('assert');

module.exports = ValueLiteralNode;

function ValueLiteralNode(value, name, label) {
    assert(!label, 'cannot have label on valueLiteral');

    name = name ? name :
        value === 'null' ? 'null' :
        value === 'undefined' ? 'undefined' :
        /*istanbul ignore next*/ 'unknown';

    this.type = 'valueLiteral';
    this.value = value;
    this.name = name;
    this._raw = null;
}

},{"assert":24}],23:[function(require,module,exports){

},{}],24:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":29}],25:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":26}],26:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],27:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],28:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],29:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":28,"_process":26,"inherits":27}],30:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// This is CodeMirror (http://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.CodeMirror = factory());
}(this, (function () { 'use strict';

// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
var userAgent = navigator.userAgent
var platform = navigator.platform

var gecko = /gecko\/\d/i.test(userAgent)
var ie_upto10 = /MSIE \d/.test(userAgent)
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent)
var ie = ie_upto10 || ie_11up
var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : ie_11up[1])
var webkit = /WebKit\//.test(userAgent)
var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent)
var chrome = /Chrome\//.test(userAgent)
var presto = /Opera\//.test(userAgent)
var safari = /Apple Computer/.test(navigator.vendor)
var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent)
var phantom = /PhantomJS/.test(userAgent)

var ios = /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent)
// This is woefully incomplete. Suggestions for alternative methods welcome.
var mobile = ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent)
var mac = ios || /Mac/.test(platform)
var chromeOS = /\bCrOS\b/.test(userAgent)
var windows = /win/i.test(platform)

var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/)
if (presto_version) { presto_version = Number(presto_version[1]) }
if (presto_version && presto_version >= 15) { presto = false; webkit = true }
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11))
var captureRightClick = gecko || (ie && ie_version >= 9)

function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*") }

var rmClass = function(node, cls) {
  var current = node.className
  var match = classTest(cls).exec(current)
  if (match) {
    var after = current.slice(match.index + match[0].length)
    node.className = current.slice(0, match.index) + (after ? match[1] + after : "")
  }
}

function removeChildren(e) {
  for (var count = e.childNodes.length; count > 0; --count)
    { e.removeChild(e.firstChild) }
  return e
}

function removeChildrenAndAdd(parent, e) {
  return removeChildren(parent).appendChild(e)
}

function elt(tag, content, className, style) {
  var e = document.createElement(tag)
  if (className) { e.className = className }
  if (style) { e.style.cssText = style }
  if (typeof content == "string") { e.appendChild(document.createTextNode(content)) }
  else if (content) { for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]) } }
  return e
}

var range
if (document.createRange) { range = function(node, start, end, endNode) {
  var r = document.createRange()
  r.setEnd(endNode || node, end)
  r.setStart(node, start)
  return r
} }
else { range = function(node, start, end) {
  var r = document.body.createTextRange()
  try { r.moveToElementText(node.parentNode) }
  catch(e) { return r }
  r.collapse(true)
  r.moveEnd("character", end)
  r.moveStart("character", start)
  return r
} }

function contains(parent, child) {
  if (child.nodeType == 3) // Android browser always returns false when child is a textnode
    { child = child.parentNode }
  if (parent.contains)
    { return parent.contains(child) }
  do {
    if (child.nodeType == 11) { child = child.host }
    if (child == parent) { return true }
  } while (child = child.parentNode)
}

var activeElt = function() {
  var activeElement = document.activeElement
  while (activeElement && activeElement.root && activeElement.root.activeElement)
    { activeElement = activeElement.root.activeElement }
  return activeElement
}
// Older versions of IE throws unspecified error when touching
// document.activeElement in some cases (during loading, in iframe)
if (ie && ie_version < 11) { activeElt = function() {
  try { return document.activeElement }
  catch(e) { return document.body }
} }

function addClass(node, cls) {
  var current = node.className
  if (!classTest(cls).test(current)) { node.className += (current ? " " : "") + cls }
}
function joinClasses(a, b) {
  var as = a.split(" ")
  for (var i = 0; i < as.length; i++)
    { if (as[i] && !classTest(as[i]).test(b)) { b += " " + as[i] } }
  return b
}

var selectInput = function(node) { node.select() }
if (ios) // Mobile Safari apparently has a bug where select() is broken.
  { selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length } }
else if (ie) // Suppress mysterious IE10 errors
  { selectInput = function(node) { try { node.select() } catch(_e) {} } }

function bind(f) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function(){return f.apply(null, args)}
}

function copyObj(obj, target, overwrite) {
  if (!target) { target = {} }
  for (var prop in obj)
    { if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
      { target[prop] = obj[prop] } }
  return target
}

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
function countColumn(string, end, tabSize, startIndex, startValue) {
  if (end == null) {
    end = string.search(/[^\s\u00a0]/)
    if (end == -1) { end = string.length }
  }
  for (var i = startIndex || 0, n = startValue || 0;;) {
    var nextTab = string.indexOf("\t", i)
    if (nextTab < 0 || nextTab >= end)
      { return n + (end - i) }
    n += nextTab - i
    n += tabSize - (n % tabSize)
    i = nextTab + 1
  }
}

function Delayed() {this.id = null}
Delayed.prototype.set = function(ms, f) {
  clearTimeout(this.id)
  this.id = setTimeout(f, ms)
}

function indexOf(array, elt) {
  for (var i = 0; i < array.length; ++i)
    { if (array[i] == elt) { return i } }
  return -1
}

// Number of pixels added to scroller and sizer to hide scrollbar
var scrollerGap = 30

// Returned or thrown by various protocols to signal 'I'm not
// handling this'.
var Pass = {toString: function(){return "CodeMirror.Pass"}}

// Reused option objects for setSelection & friends
var sel_dontScroll = {scroll: false};
var sel_mouse = {origin: "*mouse"};
var sel_move = {origin: "+move"};
// The inverse of countColumn -- find the offset that corresponds to
// a particular column.
function findColumn(string, goal, tabSize) {
  for (var pos = 0, col = 0;;) {
    var nextTab = string.indexOf("\t", pos)
    if (nextTab == -1) { nextTab = string.length }
    var skipped = nextTab - pos
    if (nextTab == string.length || col + skipped >= goal)
      { return pos + Math.min(skipped, goal - col) }
    col += nextTab - pos
    col += tabSize - (col % tabSize)
    pos = nextTab + 1
    if (col >= goal) { return pos }
  }
}

var spaceStrs = [""]
function spaceStr(n) {
  while (spaceStrs.length <= n)
    { spaceStrs.push(lst(spaceStrs) + " ") }
  return spaceStrs[n]
}

function lst(arr) { return arr[arr.length-1] }

function map(array, f) {
  var out = []
  for (var i = 0; i < array.length; i++) { out[i] = f(array[i], i) }
  return out
}

function insertSorted(array, value, score) {
  var pos = 0, priority = score(value)
  while (pos < array.length && score(array[pos]) <= priority) { pos++ }
  array.splice(pos, 0, value)
}

function nothing() {}

function createObj(base, props) {
  var inst
  if (Object.create) {
    inst = Object.create(base)
  } else {
    nothing.prototype = base
    inst = new nothing()
  }
  if (props) { copyObj(props, inst) }
  return inst
}

var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/
function isWordCharBasic(ch) {
  return /\w/.test(ch) || ch > "\x80" &&
    (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
}
function isWordChar(ch, helper) {
  if (!helper) { return isWordCharBasic(ch) }
  if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) { return true }
  return helper.test(ch)
}

function isEmpty(obj) {
  for (var n in obj) { if (obj.hasOwnProperty(n) && obj[n]) { return false } }
  return true
}

// Extending unicode characters. A series of a non-extending char +
// any number of extending chars is treated as a single unit as far
// as editing and measuring is concerned. This is not fully correct,
// since some scripts/fonts/browsers also treat other configurations
// of code points as a group.
var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/
function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

// The display handles the DOM integration, both for input reading
// and content drawing. It holds references to DOM nodes and
// display-related state.

function Display(place, doc, input) {
  var d = this
  this.input = input

  // Covers bottom-right square when both scrollbars are present.
  d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler")
  d.scrollbarFiller.setAttribute("cm-not-content", "true")
  // Covers bottom of gutter when coverGutterNextToScrollbar is on
  // and h scrollbar is present.
  d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler")
  d.gutterFiller.setAttribute("cm-not-content", "true")
  // Will contain the actual code, positioned to cover the viewport.
  d.lineDiv = elt("div", null, "CodeMirror-code")
  // Elements are added to these to represent selection and cursors.
  d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1")
  d.cursorDiv = elt("div", null, "CodeMirror-cursors")
  // A visibility: hidden element used to find the size of things.
  d.measure = elt("div", null, "CodeMirror-measure")
  // When lines outside of the viewport are measured, they are drawn in this.
  d.lineMeasure = elt("div", null, "CodeMirror-measure")
  // Wraps everything that needs to exist inside the vertically-padded coordinate system
  d.lineSpace = elt("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
                    null, "position: relative; outline: none")
  // Moved around its parent to cover visible view.
  d.mover = elt("div", [elt("div", [d.lineSpace], "CodeMirror-lines")], null, "position: relative")
  // Set to the height of the document, allowing scrolling.
  d.sizer = elt("div", [d.mover], "CodeMirror-sizer")
  d.sizerWidth = null
  // Behavior of elts with overflow: auto and padding is
  // inconsistent across browsers. This is used to ensure the
  // scrollable area is big enough.
  d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;")
  // Will contain the gutters, if any.
  d.gutters = elt("div", null, "CodeMirror-gutters")
  d.lineGutter = null
  // Actual scrollable element.
  d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll")
  d.scroller.setAttribute("tabIndex", "-1")
  // The element in which the editor lives.
  d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror")

  // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
  if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0 }
  if (!webkit && !(gecko && mobile)) { d.scroller.draggable = true }

  if (place) {
    if (place.appendChild) { place.appendChild(d.wrapper) }
    else { place(d.wrapper) }
  }

  // Current rendered range (may be bigger than the view window).
  d.viewFrom = d.viewTo = doc.first
  d.reportedViewFrom = d.reportedViewTo = doc.first
  // Information about the rendered lines.
  d.view = []
  d.renderedView = null
  // Holds info about a single rendered line when it was rendered
  // for measurement, while not in view.
  d.externalMeasured = null
  // Empty space (in pixels) above the view
  d.viewOffset = 0
  d.lastWrapHeight = d.lastWrapWidth = 0
  d.updateLineNumbers = null

  d.nativeBarWidth = d.barHeight = d.barWidth = 0
  d.scrollbarsClipped = false

  // Used to only resize the line number gutter when necessary (when
  // the amount of lines crosses a boundary that makes its width change)
  d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null
  // Set to true when a non-horizontal-scrolling line widget is
  // added. As an optimization, line widget aligning is skipped when
  // this is false.
  d.alignWidgets = false

  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null

  // Tracks the maximum line length so that the horizontal scrollbar
  // can be kept static when scrolling.
  d.maxLine = null
  d.maxLineLength = 0
  d.maxLineChanged = false

  // Used for measuring wheel scrolling granularity
  d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null

  // True when shift is held down.
  d.shift = false

  // Used to track whether anything happened since the context menu
  // was opened.
  d.selForContextMenu = null

  d.activeTouch = null

  input.init(d)
}

// Find the line object corresponding to the given line number.
function getLine(doc, n) {
  n -= doc.first
  if (n < 0 || n >= doc.size) { throw new Error("There is no line " + (n + doc.first) + " in the document.") }
  var chunk = doc
  while (!chunk.lines) {
    for (var i = 0;; ++i) {
      var child = chunk.children[i], sz = child.chunkSize()
      if (n < sz) { chunk = child; break }
      n -= sz
    }
  }
  return chunk.lines[n]
}

// Get the part of a document between two positions, as an array of
// strings.
function getBetween(doc, start, end) {
  var out = [], n = start.line
  doc.iter(start.line, end.line + 1, function (line) {
    var text = line.text
    if (n == end.line) { text = text.slice(0, end.ch) }
    if (n == start.line) { text = text.slice(start.ch) }
    out.push(text)
    ++n
  })
  return out
}
// Get the lines between from and to, as array of strings.
function getLines(doc, from, to) {
  var out = []
  doc.iter(from, to, function (line) { out.push(line.text) }) // iter aborts when callback returns truthy value
  return out
}

// Update the height of a line, propagating the height change
// upwards to parent nodes.
function updateLineHeight(line, height) {
  var diff = height - line.height
  if (diff) { for (var n = line; n; n = n.parent) { n.height += diff } }
}

// Given a line object, find its line number by walking up through
// its parent links.
function lineNo(line) {
  if (line.parent == null) { return null }
  var cur = line.parent, no = indexOf(cur.lines, line)
  for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
    for (var i = 0;; ++i) {
      if (chunk.children[i] == cur) { break }
      no += chunk.children[i].chunkSize()
    }
  }
  return no + cur.first
}

// Find the line at the given vertical position, using the height
// information in the document tree.
function lineAtHeight(chunk, h) {
  var n = chunk.first
  outer: do {
    for (var i$1 = 0; i$1 < chunk.children.length; ++i$1) {
      var child = chunk.children[i$1], ch = child.height
      if (h < ch) { chunk = child; continue outer }
      h -= ch
      n += child.chunkSize()
    }
    return n
  } while (!chunk.lines)
  var i = 0
  for (; i < chunk.lines.length; ++i) {
    var line = chunk.lines[i], lh = line.height
    if (h < lh) { break }
    h -= lh
  }
  return n + i
}

function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size}

function lineNumberFor(options, i) {
  return String(options.lineNumberFormatter(i + options.firstLineNumber))
}

// A Pos instance represents a position within the text.
function Pos (line, ch) {
  if (!(this instanceof Pos)) { return new Pos(line, ch) }
  this.line = line; this.ch = ch
}

// Compare two positions, return 0 if they are the same, a negative
// number when a is less, and a positive number otherwise.
function cmp(a, b) { return a.line - b.line || a.ch - b.ch }

function copyPos(x) {return Pos(x.line, x.ch)}
function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
function minPos(a, b) { return cmp(a, b) < 0 ? a : b }

// Most of the external API clips given positions to make sure they
// actually exist within the document.
function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1))}
function clipPos(doc, pos) {
  if (pos.line < doc.first) { return Pos(doc.first, 0) }
  var last = doc.first + doc.size - 1
  if (pos.line > last) { return Pos(last, getLine(doc, last).text.length) }
  return clipToLen(pos, getLine(doc, pos.line).text.length)
}
function clipToLen(pos, linelen) {
  var ch = pos.ch
  if (ch == null || ch > linelen) { return Pos(pos.line, linelen) }
  else if (ch < 0) { return Pos(pos.line, 0) }
  else { return pos }
}
function clipPosArray(doc, array) {
  var out = []
  for (var i = 0; i < array.length; i++) { out[i] = clipPos(doc, array[i]) }
  return out
}

// Optimize some code when these features are not used.
var sawReadOnlySpans = false;
var sawCollapsedSpans = false;
function seeReadOnlySpans() {
  sawReadOnlySpans = true
}

function seeCollapsedSpans() {
  sawCollapsedSpans = true
}

// TEXTMARKER SPANS

function MarkedSpan(marker, from, to) {
  this.marker = marker
  this.from = from; this.to = to
}

// Search an array of spans for a span matching the given marker.
function getMarkedSpanFor(spans, marker) {
  if (spans) { for (var i = 0; i < spans.length; ++i) {
    var span = spans[i]
    if (span.marker == marker) { return span }
  } }
}
// Remove a span from an array, returning undefined if no spans are
// left (we don't store arrays for lines without spans).
function removeMarkedSpan(spans, span) {
  var r
  for (var i = 0; i < spans.length; ++i)
    { if (spans[i] != span) { (r || (r = [])).push(spans[i]) } }
  return r
}
// Add a span to a line.
function addMarkedSpan(line, span) {
  line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span]
  span.marker.attachLine(line)
}

// Used for the algorithm that adjusts markers for a change in the
// document. These functions cut an array of spans at a given
// character position, returning an array of remaining chunks (or
// undefined if nothing remains).
function markedSpansBefore(old, startCh, isInsert) {
  var nw
  if (old) { for (var i = 0; i < old.length; ++i) {
    var span = old[i], marker = span.marker
    var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh)
    if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh)
      ;(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to))
    }
  } }
  return nw
}
function markedSpansAfter(old, endCh, isInsert) {
  var nw
  if (old) { for (var i = 0; i < old.length; ++i) {
    var span = old[i], marker = span.marker
    var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh)
    if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh)
      ;(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
                                            span.to == null ? null : span.to - endCh))
    }
  } }
  return nw
}

// Given a change object, compute the new set of marker spans that
// cover the line in which the change took place. Removes spans
// entirely within the change, reconnects spans belonging to the
// same marker that appear on both sides of the change, and cuts off
// spans partially within the change. Returns an array of span
// arrays with one element for each line in (after) the change.
function stretchSpansOverChange(doc, change) {
  if (change.full) { return null }
  var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans
  var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans
  if (!oldFirst && !oldLast) { return null }

  var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0
  // Get the spans that 'stick out' on both sides
  var first = markedSpansBefore(oldFirst, startCh, isInsert)
  var last = markedSpansAfter(oldLast, endCh, isInsert)

  // Next, merge those two ends
  var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0)
  if (first) {
    // Fix up .to properties of first
    for (var i = 0; i < first.length; ++i) {
      var span = first[i]
      if (span.to == null) {
        var found = getMarkedSpanFor(last, span.marker)
        if (!found) { span.to = startCh }
        else if (sameLine) { span.to = found.to == null ? null : found.to + offset }
      }
    }
  }
  if (last) {
    // Fix up .from in last (or move them into first in case of sameLine)
    for (var i$1 = 0; i$1 < last.length; ++i$1) {
      var span$1 = last[i$1]
      if (span$1.to != null) { span$1.to += offset }
      if (span$1.from == null) {
        var found$1 = getMarkedSpanFor(first, span$1.marker)
        if (!found$1) {
          span$1.from = offset
          if (sameLine) { (first || (first = [])).push(span$1) }
        }
      } else {
        span$1.from += offset
        if (sameLine) { (first || (first = [])).push(span$1) }
      }
    }
  }
  // Make sure we didn't create any zero-length spans
  if (first) { first = clearEmptySpans(first) }
  if (last && last != first) { last = clearEmptySpans(last) }

  var newMarkers = [first]
  if (!sameLine) {
    // Fill gap with whole-line-spans
    var gap = change.text.length - 2, gapMarkers
    if (gap > 0 && first)
      { for (var i$2 = 0; i$2 < first.length; ++i$2)
        { if (first[i$2].to == null)
          { (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$2].marker, null, null)) } } }
    for (var i$3 = 0; i$3 < gap; ++i$3)
      { newMarkers.push(gapMarkers) }
    newMarkers.push(last)
  }
  return newMarkers
}

// Remove spans that are empty and don't have a clearWhenEmpty
// option of false.
function clearEmptySpans(spans) {
  for (var i = 0; i < spans.length; ++i) {
    var span = spans[i]
    if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
      { spans.splice(i--, 1) }
  }
  if (!spans.length) { return null }
  return spans
}

// Used to 'clip' out readOnly ranges when making a change.
function removeReadOnlyRanges(doc, from, to) {
  var markers = null
  doc.iter(from.line, to.line + 1, function (line) {
    if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
      var mark = line.markedSpans[i].marker
      if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
        { (markers || (markers = [])).push(mark) }
    } }
  })
  if (!markers) { return null }
  var parts = [{from: from, to: to}]
  for (var i = 0; i < markers.length; ++i) {
    var mk = markers[i], m = mk.find(0)
    for (var j = 0; j < parts.length; ++j) {
      var p = parts[j]
      if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) { continue }
      var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to)
      if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
        { newParts.push({from: p.from, to: m.from}) }
      if (dto > 0 || !mk.inclusiveRight && !dto)
        { newParts.push({from: m.to, to: p.to}) }
      parts.splice.apply(parts, newParts)
      j += newParts.length - 1
    }
  }
  return parts
}

// Connect or disconnect spans from a line.
function detachMarkedSpans(line) {
  var spans = line.markedSpans
  if (!spans) { return }
  for (var i = 0; i < spans.length; ++i)
    { spans[i].marker.detachLine(line) }
  line.markedSpans = null
}
function attachMarkedSpans(line, spans) {
  if (!spans) { return }
  for (var i = 0; i < spans.length; ++i)
    { spans[i].marker.attachLine(line) }
  line.markedSpans = spans
}

// Helpers used when computing which overlapping collapsed span
// counts as the larger one.
function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0 }
function extraRight(marker) { return marker.inclusiveRight ? 1 : 0 }

// Returns a number indicating which of two overlapping collapsed
// spans is larger (and thus includes the other). Falls back to
// comparing ids when the spans cover exactly the same range.
function compareCollapsedMarkers(a, b) {
  var lenDiff = a.lines.length - b.lines.length
  if (lenDiff != 0) { return lenDiff }
  var aPos = a.find(), bPos = b.find()
  var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b)
  if (fromCmp) { return -fromCmp }
  var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b)
  if (toCmp) { return toCmp }
  return b.id - a.id
}

// Find out whether a line ends or starts in a collapsed span. If
// so, return the marker for that span.
function collapsedSpanAtSide(line, start) {
  var sps = sawCollapsedSpans && line.markedSpans, found
  if (sps) { for (var sp = void 0, i = 0; i < sps.length; ++i) {
    sp = sps[i]
    if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
        (!found || compareCollapsedMarkers(found, sp.marker) < 0))
      { found = sp.marker }
  } }
  return found
}
function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true) }
function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false) }

// Test whether there exists a collapsed span that partially
// overlaps (covers the start or end, but not both) of a new span.
// Such overlap is not allowed.
function conflictingCollapsedRange(doc, lineNo, from, to, marker) {
  var line = getLine(doc, lineNo)
  var sps = sawCollapsedSpans && line.markedSpans
  if (sps) { for (var i = 0; i < sps.length; ++i) {
    var sp = sps[i]
    if (!sp.marker.collapsed) { continue }
    var found = sp.marker.find(0)
    var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker)
    var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker)
    if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) { continue }
    if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) ||
        fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0))
      { return true }
  } }
}

// A visual line is a line as drawn on the screen. Folding, for
// example, can cause multiple logical lines to appear on the same
// visual line. This finds the start of the visual line that the
// given line is part of (usually that is the line itself).
function visualLine(line) {
  var merged
  while (merged = collapsedSpanAtStart(line))
    { line = merged.find(-1, true).line }
  return line
}

// Returns an array of logical lines that continue the visual line
// started by the argument, or undefined if there are no such lines.
function visualLineContinued(line) {
  var merged, lines
  while (merged = collapsedSpanAtEnd(line)) {
    line = merged.find(1, true).line
    ;(lines || (lines = [])).push(line)
  }
  return lines
}

// Get the line number of the start of the visual line that the
// given line number is part of.
function visualLineNo(doc, lineN) {
  var line = getLine(doc, lineN), vis = visualLine(line)
  if (line == vis) { return lineN }
  return lineNo(vis)
}

// Get the line number of the start of the next visual line after
// the given line.
function visualLineEndNo(doc, lineN) {
  if (lineN > doc.lastLine()) { return lineN }
  var line = getLine(doc, lineN), merged
  if (!lineIsHidden(doc, line)) { return lineN }
  while (merged = collapsedSpanAtEnd(line))
    { line = merged.find(1, true).line }
  return lineNo(line) + 1
}

// Compute whether a line is hidden. Lines count as hidden when they
// are part of a visual line that starts with another line, or when
// they are entirely covered by collapsed, non-widget span.
function lineIsHidden(doc, line) {
  var sps = sawCollapsedSpans && line.markedSpans
  if (sps) { for (var sp = void 0, i = 0; i < sps.length; ++i) {
    sp = sps[i]
    if (!sp.marker.collapsed) { continue }
    if (sp.from == null) { return true }
    if (sp.marker.widgetNode) { continue }
    if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
      { return true }
  } }
}
function lineIsHiddenInner(doc, line, span) {
  if (span.to == null) {
    var end = span.marker.find(1, true)
    return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker))
  }
  if (span.marker.inclusiveRight && span.to == line.text.length)
    { return true }
  for (var sp = void 0, i = 0; i < line.markedSpans.length; ++i) {
    sp = line.markedSpans[i]
    if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
        (sp.to == null || sp.to != span.from) &&
        (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
        lineIsHiddenInner(doc, line, sp)) { return true }
  }
}

// Find the height above the given line.
function heightAtLine(lineObj) {
  lineObj = visualLine(lineObj)

  var h = 0, chunk = lineObj.parent
  for (var i = 0; i < chunk.lines.length; ++i) {
    var line = chunk.lines[i]
    if (line == lineObj) { break }
    else { h += line.height }
  }
  for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
    for (var i$1 = 0; i$1 < p.children.length; ++i$1) {
      var cur = p.children[i$1]
      if (cur == chunk) { break }
      else { h += cur.height }
    }
  }
  return h
}

// Compute the character length of a line, taking into account
// collapsed ranges (see markText) that might hide parts, and join
// other lines onto it.
function lineLength(line) {
  if (line.height == 0) { return 0 }
  var len = line.text.length, merged, cur = line
  while (merged = collapsedSpanAtStart(cur)) {
    var found = merged.find(0, true)
    cur = found.from.line
    len += found.from.ch - found.to.ch
  }
  cur = line
  while (merged = collapsedSpanAtEnd(cur)) {
    var found$1 = merged.find(0, true)
    len -= cur.text.length - found$1.from.ch
    cur = found$1.to.line
    len += cur.text.length - found$1.to.ch
  }
  return len
}

// Find the longest line in the document.
function findMaxLine(cm) {
  var d = cm.display, doc = cm.doc
  d.maxLine = getLine(doc, doc.first)
  d.maxLineLength = lineLength(d.maxLine)
  d.maxLineChanged = true
  doc.iter(function (line) {
    var len = lineLength(line)
    if (len > d.maxLineLength) {
      d.maxLineLength = len
      d.maxLine = line
    }
  })
}

// BIDI HELPERS

function iterateBidiSections(order, from, to, f) {
  if (!order) { return f(from, to, "ltr") }
  var found = false
  for (var i = 0; i < order.length; ++i) {
    var part = order[i]
    if (part.from < to && part.to > from || from == to && part.to == from) {
      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr")
      found = true
    }
  }
  if (!found) { f(from, to, "ltr") }
}

function bidiLeft(part) { return part.level % 2 ? part.to : part.from }
function bidiRight(part) { return part.level % 2 ? part.from : part.to }

function lineLeft(line) { var order = getOrder(line); return order ? bidiLeft(order[0]) : 0 }
function lineRight(line) {
  var order = getOrder(line)
  if (!order) { return line.text.length }
  return bidiRight(lst(order))
}

function compareBidiLevel(order, a, b) {
  var linedir = order[0].level
  if (a == linedir) { return true }
  if (b == linedir) { return false }
  return a < b
}

var bidiOther = null
function getBidiPartAt(order, pos) {
  var found
  bidiOther = null
  for (var i = 0; i < order.length; ++i) {
    var cur = order[i]
    if (cur.from < pos && cur.to > pos) { return i }
    if ((cur.from == pos || cur.to == pos)) {
      if (found == null) {
        found = i
      } else if (compareBidiLevel(order, cur.level, order[found].level)) {
        if (cur.from != cur.to) { bidiOther = found }
        return i
      } else {
        if (cur.from != cur.to) { bidiOther = i }
        return found
      }
    }
  }
  return found
}

function moveInLine(line, pos, dir, byUnit) {
  if (!byUnit) { return pos + dir }
  do { pos += dir }
  while (pos > 0 && isExtendingChar(line.text.charAt(pos)))
  return pos
}

// This is needed in order to move 'visually' through bi-directional
// text -- i.e., pressing left should make the cursor go left, even
// when in RTL text. The tricky part is the 'jumps', where RTL and
// LTR text touch each other. This often requires the cursor offset
// to move more than one unit, in order to visually move one unit.
function moveVisually(line, start, dir, byUnit) {
  var bidi = getOrder(line)
  if (!bidi) { return moveLogically(line, start, dir, byUnit) }
  var pos = getBidiPartAt(bidi, start), part = bidi[pos]
  var target = moveInLine(line, start, part.level % 2 ? -dir : dir, byUnit)

  for (;;) {
    if (target > part.from && target < part.to) { return target }
    if (target == part.from || target == part.to) {
      if (getBidiPartAt(bidi, target) == pos) { return target }
      part = bidi[pos += dir]
      return (dir > 0) == part.level % 2 ? part.to : part.from
    } else {
      part = bidi[pos += dir]
      if (!part) { return null }
      if ((dir > 0) == part.level % 2)
        { target = moveInLine(line, part.to, -1, byUnit) }
      else
        { target = moveInLine(line, part.from, 1, byUnit) }
    }
  }
}

function moveLogically(line, start, dir, byUnit) {
  var target = start + dir
  if (byUnit) { while (target > 0 && isExtendingChar(line.text.charAt(target))) { target += dir } }
  return target < 0 || target > line.text.length ? null : target
}

// Bidirectional ordering algorithm
// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
// that this (partially) implements.

// One-char codes used for character types:
// L (L):   Left-to-Right
// R (R):   Right-to-Left
// r (AL):  Right-to-Left Arabic
// 1 (EN):  European Number
// + (ES):  European Number Separator
// % (ET):  European Number Terminator
// n (AN):  Arabic Number
// , (CS):  Common Number Separator
// m (NSM): Non-Spacing Mark
// b (BN):  Boundary Neutral
// s (B):   Paragraph Separator
// t (S):   Segment Separator
// w (WS):  Whitespace
// N (ON):  Other Neutrals

// Returns null if characters are ordered as they appear
// (left-to-right), or an array of sections ({from, to, level}
// objects) in the order in which they occur visually.
var bidiOrdering = (function() {
  // Character types for codepoints 0 to 0xff
  var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN"
  // Character types for codepoints 0x600 to 0x6ff
  var arabicTypes = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm"
  function charType(code) {
    if (code <= 0xf7) { return lowTypes.charAt(code) }
    else if (0x590 <= code && code <= 0x5f4) { return "R" }
    else if (0x600 <= code && code <= 0x6ed) { return arabicTypes.charAt(code - 0x600) }
    else if (0x6ee <= code && code <= 0x8ac) { return "r" }
    else if (0x2000 <= code && code <= 0x200b) { return "w" }
    else if (code == 0x200c) { return "b" }
    else { return "L" }
  }

  var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/
  var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/
  // Browsers seem to always treat the boundaries of block elements as being L.
  var outerType = "L"

  function BidiSpan(level, from, to) {
    this.level = level
    this.from = from; this.to = to
  }

  return function(str) {
    if (!bidiRE.test(str)) { return false }
    var len = str.length, types = []
    for (var i = 0; i < len; ++i)
      { types.push(charType(str.charCodeAt(i))) }

    // W1. Examine each non-spacing mark (NSM) in the level run, and
    // change the type of the NSM to the type of the previous
    // character. If the NSM is at the start of the level run, it will
    // get the type of sor.
    for (var i$1 = 0, prev = outerType; i$1 < len; ++i$1) {
      var type = types[i$1]
      if (type == "m") { types[i$1] = prev }
      else { prev = type }
    }

    // W2. Search backwards from each instance of a European number
    // until the first strong type (R, L, AL, or sor) is found. If an
    // AL is found, change the type of the European number to Arabic
    // number.
    // W3. Change all ALs to R.
    for (var i$2 = 0, cur = outerType; i$2 < len; ++i$2) {
      var type$1 = types[i$2]
      if (type$1 == "1" && cur == "r") { types[i$2] = "n" }
      else if (isStrong.test(type$1)) { cur = type$1; if (type$1 == "r") { types[i$2] = "R" } }
    }

    // W4. A single European separator between two European numbers
    // changes to a European number. A single common separator between
    // two numbers of the same type changes to that type.
    for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
      var type$2 = types[i$3]
      if (type$2 == "+" && prev$1 == "1" && types[i$3+1] == "1") { types[i$3] = "1" }
      else if (type$2 == "," && prev$1 == types[i$3+1] &&
               (prev$1 == "1" || prev$1 == "n")) { types[i$3] = prev$1 }
      prev$1 = type$2
    }

    // W5. A sequence of European terminators adjacent to European
    // numbers changes to all European numbers.
    // W6. Otherwise, separators and terminators change to Other
    // Neutral.
    for (var i$4 = 0; i$4 < len; ++i$4) {
      var type$3 = types[i$4]
      if (type$3 == ",") { types[i$4] = "N" }
      else if (type$3 == "%") {
        var end = void 0
        for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {}
        var replace = (i$4 && types[i$4-1] == "!") || (end < len && types[end] == "1") ? "1" : "N"
        for (var j = i$4; j < end; ++j) { types[j] = replace }
        i$4 = end - 1
      }
    }

    // W7. Search backwards from each instance of a European number
    // until the first strong type (R, L, or sor) is found. If an L is
    // found, then change the type of the European number to L.
    for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
      var type$4 = types[i$5]
      if (cur$1 == "L" && type$4 == "1") { types[i$5] = "L" }
      else if (isStrong.test(type$4)) { cur$1 = type$4 }
    }

    // N1. A sequence of neutrals takes the direction of the
    // surrounding strong text if the text on both sides has the same
    // direction. European and Arabic numbers act as if they were R in
    // terms of their influence on neutrals. Start-of-level-run (sor)
    // and end-of-level-run (eor) are used at level run boundaries.
    // N2. Any remaining neutrals take the embedding direction.
    for (var i$6 = 0; i$6 < len; ++i$6) {
      if (isNeutral.test(types[i$6])) {
        var end$1 = void 0
        for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {}
        var before = (i$6 ? types[i$6-1] : outerType) == "L"
        var after = (end$1 < len ? types[end$1] : outerType) == "L"
        var replace$1 = before || after ? "L" : "R"
        for (var j$1 = i$6; j$1 < end$1; ++j$1) { types[j$1] = replace$1 }
        i$6 = end$1 - 1
      }
    }

    // Here we depart from the documented algorithm, in order to avoid
    // building up an actual levels array. Since there are only three
    // levels (0, 1, 2) in an implementation that doesn't take
    // explicit embedding into account, we can build up the order on
    // the fly, without following the level-based algorithm.
    var order = [], m
    for (var i$7 = 0; i$7 < len;) {
      if (countsAsLeft.test(types[i$7])) {
        var start = i$7
        for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
        order.push(new BidiSpan(0, start, i$7))
      } else {
        var pos = i$7, at = order.length
        for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
        for (var j$2 = pos; j$2 < i$7;) {
          if (countsAsNum.test(types[j$2])) {
            if (pos < j$2) { order.splice(at, 0, new BidiSpan(1, pos, j$2)) }
            var nstart = j$2
            for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
            order.splice(at, 0, new BidiSpan(2, nstart, j$2))
            pos = j$2
          } else { ++j$2 }
        }
        if (pos < i$7) { order.splice(at, 0, new BidiSpan(1, pos, i$7)) }
      }
    }
    if (order[0].level == 1 && (m = str.match(/^\s+/))) {
      order[0].from = m[0].length
      order.unshift(new BidiSpan(0, 0, m[0].length))
    }
    if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
      lst(order).to -= m[0].length
      order.push(new BidiSpan(0, len - m[0].length, len))
    }
    if (order[0].level == 2)
      { order.unshift(new BidiSpan(1, order[0].to, order[0].to)) }
    if (order[0].level != lst(order).level)
      { order.push(new BidiSpan(order[0].level, len, len)) }

    return order
  }
})()

// Get the bidi ordering for the given line (and cache it). Returns
// false for lines that are fully left-to-right, and an array of
// BidiSpan objects otherwise.
function getOrder(line) {
  var order = line.order
  if (order == null) { order = line.order = bidiOrdering(line.text) }
  return order
}

// EVENT HANDLING

// Lightweight event framework. on/off also work on DOM nodes,
// registering native DOM handlers.

var on = function(emitter, type, f) {
  if (emitter.addEventListener)
    { emitter.addEventListener(type, f, false) }
  else if (emitter.attachEvent)
    { emitter.attachEvent("on" + type, f) }
  else {
    var map = emitter._handlers || (emitter._handlers = {})
    var arr = map[type] || (map[type] = [])
    arr.push(f)
  }
}

var noHandlers = []
function getHandlers(emitter, type, copy) {
  var arr = emitter._handlers && emitter._handlers[type]
  if (copy) { return arr && arr.length > 0 ? arr.slice() : noHandlers }
  else { return arr || noHandlers }
}

function off(emitter, type, f) {
  if (emitter.removeEventListener)
    { emitter.removeEventListener(type, f, false) }
  else if (emitter.detachEvent)
    { emitter.detachEvent("on" + type, f) }
  else {
    var handlers = getHandlers(emitter, type, false)
    for (var i = 0; i < handlers.length; ++i)
      { if (handlers[i] == f) { handlers.splice(i, 1); break } }
  }
}

function signal(emitter, type /*, values...*/) {
  var handlers = getHandlers(emitter, type, true)
  if (!handlers.length) { return }
  var args = Array.prototype.slice.call(arguments, 2)
  for (var i = 0; i < handlers.length; ++i) { handlers[i].apply(null, args) }
}

// The DOM events that CodeMirror handles can be overridden by
// registering a (non-DOM) handler on the editor for the event name,
// and preventDefault-ing the event in that handler.
function signalDOMEvent(cm, e, override) {
  if (typeof e == "string")
    { e = {type: e, preventDefault: function() { this.defaultPrevented = true }} }
  signal(cm, override || e.type, cm, e)
  return e_defaultPrevented(e) || e.codemirrorIgnore
}

function signalCursorActivity(cm) {
  var arr = cm._handlers && cm._handlers.cursorActivity
  if (!arr) { return }
  var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = [])
  for (var i = 0; i < arr.length; ++i) { if (indexOf(set, arr[i]) == -1)
    { set.push(arr[i]) } }
}

function hasHandler(emitter, type) {
  return getHandlers(emitter, type).length > 0
}

// Add on and off methods to a constructor's prototype, to make
// registering events on such objects more convenient.
function eventMixin(ctor) {
  ctor.prototype.on = function(type, f) {on(this, type, f)}
  ctor.prototype.off = function(type, f) {off(this, type, f)}
}

// Due to the fact that we still support jurassic IE versions, some
// compatibility wrappers are needed.

function e_preventDefault(e) {
  if (e.preventDefault) { e.preventDefault() }
  else { e.returnValue = false }
}
function e_stopPropagation(e) {
  if (e.stopPropagation) { e.stopPropagation() }
  else { e.cancelBubble = true }
}
function e_defaultPrevented(e) {
  return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false
}
function e_stop(e) {e_preventDefault(e); e_stopPropagation(e)}

function e_target(e) {return e.target || e.srcElement}
function e_button(e) {
  var b = e.which
  if (b == null) {
    if (e.button & 1) { b = 1 }
    else if (e.button & 2) { b = 3 }
    else if (e.button & 4) { b = 2 }
  }
  if (mac && e.ctrlKey && b == 1) { b = 3 }
  return b
}

// Detect drag-and-drop
var dragAndDrop = function() {
  // There is *some* kind of drag-and-drop support in IE6-8, but I
  // couldn't get it to work yet.
  if (ie && ie_version < 9) { return false }
  var div = elt('div')
  return "draggable" in div || "dragDrop" in div
}()

var zwspSupported
function zeroWidthElement(measure) {
  if (zwspSupported == null) {
    var test = elt("span", "\u200b")
    removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]))
    if (measure.firstChild.offsetHeight != 0)
      { zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8) }
  }
  var node = zwspSupported ? elt("span", "\u200b") :
    elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px")
  node.setAttribute("cm-text", "")
  return node
}

// Feature-detect IE's crummy client rect reporting for bidi text
var badBidiRects
function hasBadBidiRects(measure) {
  if (badBidiRects != null) { return badBidiRects }
  var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"))
  var r0 = range(txt, 0, 1).getBoundingClientRect()
  var r1 = range(txt, 1, 2).getBoundingClientRect()
  removeChildren(measure)
  if (!r0 || r0.left == r0.right) { return false } // Safari returns null in some cases (#2780)
  return badBidiRects = (r1.right - r0.right < 3)
}

// See if "".split is the broken IE version, if so, provide an
// alternative way to split lines.
var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function (string) {
  var pos = 0, result = [], l = string.length
  while (pos <= l) {
    var nl = string.indexOf("\n", pos)
    if (nl == -1) { nl = string.length }
    var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl)
    var rt = line.indexOf("\r")
    if (rt != -1) {
      result.push(line.slice(0, rt))
      pos += rt + 1
    } else {
      result.push(line)
      pos = nl + 1
    }
  }
  return result
} : function (string) { return string.split(/\r\n?|\n/); }

var hasSelection = window.getSelection ? function (te) {
  try { return te.selectionStart != te.selectionEnd }
  catch(e) { return false }
} : function (te) {
  var range
  try {range = te.ownerDocument.selection.createRange()}
  catch(e) {}
  if (!range || range.parentElement() != te) { return false }
  return range.compareEndPoints("StartToEnd", range) != 0
}

var hasCopyEvent = (function () {
  var e = elt("div")
  if ("oncopy" in e) { return true }
  e.setAttribute("oncopy", "return;")
  return typeof e.oncopy == "function"
})()

var badZoomedRects = null
function hasBadZoomedRects(measure) {
  if (badZoomedRects != null) { return badZoomedRects }
  var node = removeChildrenAndAdd(measure, elt("span", "x"))
  var normal = node.getBoundingClientRect()
  var fromRange = range(node, 0, 1).getBoundingClientRect()
  return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1
}

var modes = {};
var mimeModes = {};
// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
function defineMode(name, mode) {
  if (arguments.length > 2)
    { mode.dependencies = Array.prototype.slice.call(arguments, 2) }
  modes[name] = mode
}

function defineMIME(mime, spec) {
  mimeModes[mime] = spec
}

// Given a MIME type, a {name, ...options} config object, or a name
// string, return a mode config object.
function resolveMode(spec) {
  if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
    spec = mimeModes[spec]
  } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
    var found = mimeModes[spec.name]
    if (typeof found == "string") { found = {name: found} }
    spec = createObj(found, spec)
    spec.name = found.name
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
    return resolveMode("application/xml")
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
    return resolveMode("application/json")
  }
  if (typeof spec == "string") { return {name: spec} }
  else { return spec || {name: "null"} }
}

// Given a mode spec (anything that resolveMode accepts), find and
// initialize an actual mode object.
function getMode(options, spec) {
  spec = resolveMode(spec)
  var mfactory = modes[spec.name]
  if (!mfactory) { return getMode(options, "text/plain") }
  var modeObj = mfactory(options, spec)
  if (modeExtensions.hasOwnProperty(spec.name)) {
    var exts = modeExtensions[spec.name]
    for (var prop in exts) {
      if (!exts.hasOwnProperty(prop)) { continue }
      if (modeObj.hasOwnProperty(prop)) { modeObj["_" + prop] = modeObj[prop] }
      modeObj[prop] = exts[prop]
    }
  }
  modeObj.name = spec.name
  if (spec.helperType) { modeObj.helperType = spec.helperType }
  if (spec.modeProps) { for (var prop$1 in spec.modeProps)
    { modeObj[prop$1] = spec.modeProps[prop$1] } }

  return modeObj
}

// This can be used to attach properties to mode objects from
// outside the actual mode definition.
var modeExtensions = {}
function extendMode(mode, properties) {
  var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {})
  copyObj(properties, exts)
}

function copyState(mode, state) {
  if (state === true) { return state }
  if (mode.copyState) { return mode.copyState(state) }
  var nstate = {}
  for (var n in state) {
    var val = state[n]
    if (val instanceof Array) { val = val.concat([]) }
    nstate[n] = val
  }
  return nstate
}

// Given a mode and a state (for that mode), find the inner mode and
// state at the position that the state refers to.
function innerMode(mode, state) {
  var info
  while (mode.innerMode) {
    info = mode.innerMode(state)
    if (!info || info.mode == mode) { break }
    state = info.state
    mode = info.mode
  }
  return info || {mode: mode, state: state}
}

function startState(mode, a1, a2) {
  return mode.startState ? mode.startState(a1, a2) : true
}

// STRING STREAM

// Fed to the mode parsers, provides helper functions to make
// parsers more succinct.

var StringStream = function(string, tabSize) {
  this.pos = this.start = 0
  this.string = string
  this.tabSize = tabSize || 8
  this.lastColumnPos = this.lastColumnValue = 0
  this.lineStart = 0
}

StringStream.prototype = {
  eol: function() {return this.pos >= this.string.length},
  sol: function() {return this.pos == this.lineStart},
  peek: function() {return this.string.charAt(this.pos) || undefined},
  next: function() {
    if (this.pos < this.string.length)
      { return this.string.charAt(this.pos++) }
  },
  eat: function(match) {
    var ch = this.string.charAt(this.pos)
    var ok
    if (typeof match == "string") { ok = ch == match }
    else { ok = ch && (match.test ? match.test(ch) : match(ch)) }
    if (ok) {++this.pos; return ch}
  },
  eatWhile: function(match) {
    var start = this.pos
    while (this.eat(match)){}
    return this.pos > start
  },
  eatSpace: function() {
    var this$1 = this;

    var start = this.pos
    while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) { ++this$1.pos }
    return this.pos > start
  },
  skipToEnd: function() {this.pos = this.string.length},
  skipTo: function(ch) {
    var found = this.string.indexOf(ch, this.pos)
    if (found > -1) {this.pos = found; return true}
  },
  backUp: function(n) {this.pos -= n},
  column: function() {
    if (this.lastColumnPos < this.start) {
      this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue)
      this.lastColumnPos = this.start
    }
    return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
  },
  indentation: function() {
    return countColumn(this.string, null, this.tabSize) -
      (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
  },
  match: function(pattern, consume, caseInsensitive) {
    if (typeof pattern == "string") {
      var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; }
      var substr = this.string.substr(this.pos, pattern.length)
      if (cased(substr) == cased(pattern)) {
        if (consume !== false) { this.pos += pattern.length }
        return true
      }
    } else {
      var match = this.string.slice(this.pos).match(pattern)
      if (match && match.index > 0) { return null }
      if (match && consume !== false) { this.pos += match[0].length }
      return match
    }
  },
  current: function(){return this.string.slice(this.start, this.pos)},
  hideFirstChars: function(n, inner) {
    this.lineStart += n
    try { return inner() }
    finally { this.lineStart -= n }
  }
}

// Compute a style array (an array starting with a mode generation
// -- for invalidation -- followed by pairs of end positions and
// style strings), which is used to highlight the tokens on the
// line.
function highlightLine(cm, line, state, forceToEnd) {
  // A styles array always starts with a number identifying the
  // mode/overlays that it is based on (for easy invalidation).
  var st = [cm.state.modeGen], lineClasses = {}
  // Compute the base array of styles
  runMode(cm, line.text, cm.doc.mode, state, function (end, style) { return st.push(end, style); },
    lineClasses, forceToEnd)

  // Run overlays, adjust style array.
  var loop = function ( o ) {
    var overlay = cm.state.overlays[o], i = 1, at = 0
    runMode(cm, line.text, overlay.mode, true, function (end, style) {
      var start = i
      // Ensure there's a token end at the current position, and that i points at it
      while (at < end) {
        var i_end = st[i]
        if (i_end > end)
          { st.splice(i, 1, end, st[i+1], i_end) }
        i += 2
        at = Math.min(end, i_end)
      }
      if (!style) { return }
      if (overlay.opaque) {
        st.splice(start, i - start, end, "overlay " + style)
        i = start + 2
      } else {
        for (; start < i; start += 2) {
          var cur = st[start+1]
          st[start+1] = (cur ? cur + " " : "") + "overlay " + style
        }
      }
    }, lineClasses)
  };

  for (var o = 0; o < cm.state.overlays.length; ++o) loop( o );

  return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
}

function getLineStyles(cm, line, updateFrontier) {
  if (!line.styles || line.styles[0] != cm.state.modeGen) {
    var state = getStateBefore(cm, lineNo(line))
    var result = highlightLine(cm, line, line.text.length > cm.options.maxHighlightLength ? copyState(cm.doc.mode, state) : state)
    line.stateAfter = state
    line.styles = result.styles
    if (result.classes) { line.styleClasses = result.classes }
    else if (line.styleClasses) { line.styleClasses = null }
    if (updateFrontier === cm.doc.frontier) { cm.doc.frontier++ }
  }
  return line.styles
}

function getStateBefore(cm, n, precise) {
  var doc = cm.doc, display = cm.display
  if (!doc.mode.startState) { return true }
  var pos = findStartLine(cm, n, precise), state = pos > doc.first && getLine(doc, pos-1).stateAfter
  if (!state) { state = startState(doc.mode) }
  else { state = copyState(doc.mode, state) }
  doc.iter(pos, n, function (line) {
    processLine(cm, line.text, state)
    var save = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo
    line.stateAfter = save ? copyState(doc.mode, state) : null
    ++pos
  })
  if (precise) { doc.frontier = pos }
  return state
}

// Lightweight form of highlight -- proceed over this line and
// update state, but don't save a style array. Used for lines that
// aren't currently visible.
function processLine(cm, text, state, startAt) {
  var mode = cm.doc.mode
  var stream = new StringStream(text, cm.options.tabSize)
  stream.start = stream.pos = startAt || 0
  if (text == "") { callBlankLine(mode, state) }
  while (!stream.eol()) {
    readToken(mode, stream, state)
    stream.start = stream.pos
  }
}

function callBlankLine(mode, state) {
  if (mode.blankLine) { return mode.blankLine(state) }
  if (!mode.innerMode) { return }
  var inner = innerMode(mode, state)
  if (inner.mode.blankLine) { return inner.mode.blankLine(inner.state) }
}

function readToken(mode, stream, state, inner) {
  for (var i = 0; i < 10; i++) {
    if (inner) { inner[0] = innerMode(mode, state).mode }
    var style = mode.token(stream, state)
    if (stream.pos > stream.start) { return style }
  }
  throw new Error("Mode " + mode.name + " failed to advance stream.")
}

// Utility for getTokenAt and getLineTokens
function takeToken(cm, pos, precise, asArray) {
  var getObj = function (copy) { return ({
    start: stream.start, end: stream.pos,
    string: stream.current(),
    type: style || null,
    state: copy ? copyState(doc.mode, state) : state
  }); }

  var doc = cm.doc, mode = doc.mode, style
  pos = clipPos(doc, pos)
  var line = getLine(doc, pos.line), state = getStateBefore(cm, pos.line, precise)
  var stream = new StringStream(line.text, cm.options.tabSize), tokens
  if (asArray) { tokens = [] }
  while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
    stream.start = stream.pos
    style = readToken(mode, stream, state)
    if (asArray) { tokens.push(getObj(true)) }
  }
  return asArray ? tokens : getObj()
}

function extractLineClasses(type, output) {
  if (type) { for (;;) {
    var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/)
    if (!lineClass) { break }
    type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length)
    var prop = lineClass[1] ? "bgClass" : "textClass"
    if (output[prop] == null)
      { output[prop] = lineClass[2] }
    else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
      { output[prop] += " " + lineClass[2] }
  } }
  return type
}

// Run the given mode's parser over a line, calling f for each token.
function runMode(cm, text, mode, state, f, lineClasses, forceToEnd) {
  var flattenSpans = mode.flattenSpans
  if (flattenSpans == null) { flattenSpans = cm.options.flattenSpans }
  var curStart = 0, curStyle = null
  var stream = new StringStream(text, cm.options.tabSize), style
  var inner = cm.options.addModeClass && [null]
  if (text == "") { extractLineClasses(callBlankLine(mode, state), lineClasses) }
  while (!stream.eol()) {
    if (stream.pos > cm.options.maxHighlightLength) {
      flattenSpans = false
      if (forceToEnd) { processLine(cm, text, state, stream.pos) }
      stream.pos = text.length
      style = null
    } else {
      style = extractLineClasses(readToken(mode, stream, state, inner), lineClasses)
    }
    if (inner) {
      var mName = inner[0].name
      if (mName) { style = "m-" + (style ? mName + " " + style : mName) }
    }
    if (!flattenSpans || curStyle != style) {
      while (curStart < stream.start) {
        curStart = Math.min(stream.start, curStart + 5000)
        f(curStart, curStyle)
      }
      curStyle = style
    }
    stream.start = stream.pos
  }
  while (curStart < stream.pos) {
    // Webkit seems to refuse to render text nodes longer than 57444
    // characters, and returns inaccurate measurements in nodes
    // starting around 5000 chars.
    var pos = Math.min(stream.pos, curStart + 5000)
    f(pos, curStyle)
    curStart = pos
  }
}

// Finds the line to start with when starting a parse. Tries to
// find a line with a stateAfter, so that it can start with a
// valid state. If that fails, it returns the line with the
// smallest indentation, which tends to need the least context to
// parse correctly.
function findStartLine(cm, n, precise) {
  var minindent, minline, doc = cm.doc
  var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100)
  for (var search = n; search > lim; --search) {
    if (search <= doc.first) { return doc.first }
    var line = getLine(doc, search - 1)
    if (line.stateAfter && (!precise || search <= doc.frontier)) { return search }
    var indented = countColumn(line.text, null, cm.options.tabSize)
    if (minline == null || minindent > indented) {
      minline = search - 1
      minindent = indented
    }
  }
  return minline
}

// LINE DATA STRUCTURE

// Line objects. These hold state related to a line, including
// highlighting info (the styles array).
function Line(text, markedSpans, estimateHeight) {
  this.text = text
  attachMarkedSpans(this, markedSpans)
  this.height = estimateHeight ? estimateHeight(this) : 1
}
eventMixin(Line)
Line.prototype.lineNo = function() { return lineNo(this) }

// Change the content (text, markers) of a line. Automatically
// invalidates cached information and tries to re-estimate the
// line's height.
function updateLine(line, text, markedSpans, estimateHeight) {
  line.text = text
  if (line.stateAfter) { line.stateAfter = null }
  if (line.styles) { line.styles = null }
  if (line.order != null) { line.order = null }
  detachMarkedSpans(line)
  attachMarkedSpans(line, markedSpans)
  var estHeight = estimateHeight ? estimateHeight(line) : 1
  if (estHeight != line.height) { updateLineHeight(line, estHeight) }
}

// Detach a line from the document tree and its markers.
function cleanUpLine(line) {
  line.parent = null
  detachMarkedSpans(line)
}

// Convert a style as returned by a mode (either null, or a string
// containing one or more styles) to a CSS style. This is cached,
// and also looks for line-wide styles.
var styleToClassCache = {};
var styleToClassCacheWithMode = {};
function interpretTokenStyle(style, options) {
  if (!style || /^\s*$/.test(style)) { return null }
  var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache
  return cache[style] ||
    (cache[style] = style.replace(/\S+/g, "cm-$&"))
}

// Render the DOM representation of the text of a line. Also builds
// up a 'line map', which points at the DOM nodes that represent
// specific stretches of text, and is used by the measuring code.
// The returned object contains the DOM node, this map, and
// information about line-wide styles that were set by the mode.
function buildLineContent(cm, lineView) {
  // The padding-right forces the element to have a 'border', which
  // is needed on Webkit to be able to get line-level bounding
  // rectangles for it (in measureChar).
  var content = elt("span", null, null, webkit ? "padding-right: .1px" : null)
  var builder = {pre: elt("pre", [content], "CodeMirror-line"), content: content,
                 col: 0, pos: 0, cm: cm,
                 trailingSpace: false,
                 splitSpaces: (ie || webkit) && cm.getOption("lineWrapping")}
  lineView.measure = {}

  // Iterate over the logical lines that make up this visual line.
  for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
    var line = i ? lineView.rest[i - 1] : lineView.line, order = void 0
    builder.pos = 0
    builder.addToken = buildToken
    // Optionally wire in some hacks into the token-rendering
    // algorithm, to deal with browser quirks.
    if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line)))
      { builder.addToken = buildTokenBadBidi(builder.addToken, order) }
    builder.map = []
    var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line)
    insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate))
    if (line.styleClasses) {
      if (line.styleClasses.bgClass)
        { builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "") }
      if (line.styleClasses.textClass)
        { builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "") }
    }

    // Ensure at least a single node is present, for measuring.
    if (builder.map.length == 0)
      { builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure))) }

    // Store the map and a cache object for the current logical line
    if (i == 0) {
      lineView.measure.map = builder.map
      lineView.measure.cache = {}
    } else {
      ;(lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map)
      ;(lineView.measure.caches || (lineView.measure.caches = [])).push({})
    }
  }

  // See issue #2901
  if (webkit) {
    var last = builder.content.lastChild
    if (/\bcm-tab\b/.test(last.className) || (last.querySelector && last.querySelector(".cm-tab")))
      { builder.content.className = "cm-tab-wrap-hack" }
  }

  signal(cm, "renderLine", cm, lineView.line, builder.pre)
  if (builder.pre.className)
    { builder.textClass = joinClasses(builder.pre.className, builder.textClass || "") }

  return builder
}

function defaultSpecialCharPlaceholder(ch) {
  var token = elt("span", "\u2022", "cm-invalidchar")
  token.title = "\\u" + ch.charCodeAt(0).toString(16)
  token.setAttribute("aria-label", token.title)
  return token
}

// Build up the DOM representation for a single token, and add it to
// the line map. Takes care to render special characters separately.
function buildToken(builder, text, style, startStyle, endStyle, title, css) {
  if (!text) { return }
  var displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text
  var special = builder.cm.state.specialChars, mustWrap = false
  var content
  if (!special.test(text)) {
    builder.col += text.length
    content = document.createTextNode(displayText)
    builder.map.push(builder.pos, builder.pos + text.length, content)
    if (ie && ie_version < 9) { mustWrap = true }
    builder.pos += text.length
  } else {
    content = document.createDocumentFragment()
    var pos = 0
    while (true) {
      special.lastIndex = pos
      var m = special.exec(text)
      var skipped = m ? m.index - pos : text.length - pos
      if (skipped) {
        var txt = document.createTextNode(displayText.slice(pos, pos + skipped))
        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt])) }
        else { content.appendChild(txt) }
        builder.map.push(builder.pos, builder.pos + skipped, txt)
        builder.col += skipped
        builder.pos += skipped
      }
      if (!m) { break }
      pos += skipped + 1
      var txt$1 = void 0
      if (m[0] == "\t") {
        var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize
        txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"))
        txt$1.setAttribute("role", "presentation")
        txt$1.setAttribute("cm-text", "\t")
        builder.col += tabWidth
      } else if (m[0] == "\r" || m[0] == "\n") {
        txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"))
        txt$1.setAttribute("cm-text", m[0])
        builder.col += 1
      } else {
        txt$1 = builder.cm.options.specialCharPlaceholder(m[0])
        txt$1.setAttribute("cm-text", m[0])
        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt$1])) }
        else { content.appendChild(txt$1) }
        builder.col += 1
      }
      builder.map.push(builder.pos, builder.pos + 1, txt$1)
      builder.pos++
    }
  }
  builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32
  if (style || startStyle || endStyle || mustWrap || css) {
    var fullStyle = style || ""
    if (startStyle) { fullStyle += startStyle }
    if (endStyle) { fullStyle += endStyle }
    var token = elt("span", [content], fullStyle, css)
    if (title) { token.title = title }
    return builder.content.appendChild(token)
  }
  builder.content.appendChild(content)
}

function splitSpaces(text, trailingBefore) {
  if (text.length > 1 && !/  /.test(text)) { return text }
  var spaceBefore = trailingBefore, result = ""
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i)
    if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
      { ch = "\u00a0" }
    result += ch
    spaceBefore = ch == " "
  }
  return result
}

// Work around nonsense dimensions being reported for stretches of
// right-to-left text.
function buildTokenBadBidi(inner, order) {
  return function (builder, text, style, startStyle, endStyle, title, css) {
    style = style ? style + " cm-force-border" : "cm-force-border"
    var start = builder.pos, end = start + text.length
    for (;;) {
      // Find the part that overlaps with the start of this text
      var part = void 0
      for (var i = 0; i < order.length; i++) {
        part = order[i]
        if (part.to > start && part.from <= start) { break }
      }
      if (part.to >= end) { return inner(builder, text, style, startStyle, endStyle, title, css) }
      inner(builder, text.slice(0, part.to - start), style, startStyle, null, title, css)
      startStyle = null
      text = text.slice(part.to - start)
      start = part.to
    }
  }
}

function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
  var widget = !ignoreWidget && marker.widgetNode
  if (widget) { builder.map.push(builder.pos, builder.pos + size, widget) }
  if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
    if (!widget)
      { widget = builder.content.appendChild(document.createElement("span")) }
    widget.setAttribute("cm-marker", marker.id)
  }
  if (widget) {
    builder.cm.display.input.setUneditable(widget)
    builder.content.appendChild(widget)
  }
  builder.pos += size
  builder.trailingSpace = false
}

// Outputs a number of spans to make up a line, taking highlighting
// and marked text into account.
function insertLineContent(line, builder, styles) {
  var spans = line.markedSpans, allText = line.text, at = 0
  if (!spans) {
    for (var i$1 = 1; i$1 < styles.length; i$1+=2)
      { builder.addToken(builder, allText.slice(at, at = styles[i$1]), interpretTokenStyle(styles[i$1+1], builder.cm.options)) }
    return
  }

  var len = allText.length, pos = 0, i = 1, text = "", style, css
  var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, title, collapsed
  for (;;) {
    if (nextChange == pos) { // Update current marker set
      spanStyle = spanEndStyle = spanStartStyle = title = css = ""
      collapsed = null; nextChange = Infinity
      var foundBookmarks = [], endStyles = void 0
      for (var j = 0; j < spans.length; ++j) {
        var sp = spans[j], m = sp.marker
        if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
          foundBookmarks.push(m)
        } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
          if (sp.to != null && sp.to != pos && nextChange > sp.to) {
            nextChange = sp.to
            spanEndStyle = ""
          }
          if (m.className) { spanStyle += " " + m.className }
          if (m.css) { css = (css ? css + ";" : "") + m.css }
          if (m.startStyle && sp.from == pos) { spanStartStyle += " " + m.startStyle }
          if (m.endStyle && sp.to == nextChange) { (endStyles || (endStyles = [])).push(m.endStyle, sp.to) }
          if (m.title && !title) { title = m.title }
          if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
            { collapsed = sp }
        } else if (sp.from > pos && nextChange > sp.from) {
          nextChange = sp.from
        }
      }
      if (endStyles) { for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2)
        { if (endStyles[j$1 + 1] == nextChange) { spanEndStyle += " " + endStyles[j$1] } } }

      if (!collapsed || collapsed.from == pos) { for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2)
        { buildCollapsedSpan(builder, 0, foundBookmarks[j$2]) } }
      if (collapsed && (collapsed.from || 0) == pos) {
        buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
                           collapsed.marker, collapsed.from == null)
        if (collapsed.to == null) { return }
        if (collapsed.to == pos) { collapsed = false }
      }
    }
    if (pos >= len) { break }

    var upto = Math.min(len, nextChange)
    while (true) {
      if (text) {
        var end = pos + text.length
        if (!collapsed) {
          var tokenText = end > upto ? text.slice(0, upto - pos) : text
          builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                           spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", title, css)
        }
        if (end >= upto) {text = text.slice(upto - pos); pos = upto; break}
        pos = end
        spanStartStyle = ""
      }
      text = allText.slice(at, at = styles[i++])
      style = interpretTokenStyle(styles[i++], builder.cm.options)
    }
  }
}


// These objects are used to represent the visible (currently drawn)
// part of the document. A LineView may correspond to multiple
// logical lines, if those are connected by collapsed ranges.
function LineView(doc, line, lineN) {
  // The starting line
  this.line = line
  // Continuing lines, if any
  this.rest = visualLineContinued(line)
  // Number of logical lines in this visual line
  this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1
  this.node = this.text = null
  this.hidden = lineIsHidden(doc, line)
}

// Create a range of LineView objects for the given lines.
function buildViewArray(cm, from, to) {
  var array = [], nextPos
  for (var pos = from; pos < to; pos = nextPos) {
    var view = new LineView(cm.doc, getLine(cm.doc, pos), pos)
    nextPos = pos + view.size
    array.push(view)
  }
  return array
}

var operationGroup = null

function pushOperation(op) {
  if (operationGroup) {
    operationGroup.ops.push(op)
  } else {
    op.ownsGroup = operationGroup = {
      ops: [op],
      delayedCallbacks: []
    }
  }
}

function fireCallbacksForOps(group) {
  // Calls delayed callbacks and cursorActivity handlers until no
  // new ones appear
  var callbacks = group.delayedCallbacks, i = 0
  do {
    for (; i < callbacks.length; i++)
      { callbacks[i].call(null) }
    for (var j = 0; j < group.ops.length; j++) {
      var op = group.ops[j]
      if (op.cursorActivityHandlers)
        { while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
          { op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm) } }
    }
  } while (i < callbacks.length)
}

function finishOperation(op, endCb) {
  var group = op.ownsGroup
  if (!group) { return }

  try { fireCallbacksForOps(group) }
  finally {
    operationGroup = null
    endCb(group)
  }
}

var orphanDelayedCallbacks = null

// Often, we want to signal events at a point where we are in the
// middle of some work, but don't want the handler to start calling
// other methods on the editor, which might be in an inconsistent
// state or simply not expect any other events to happen.
// signalLater looks whether there are any handlers, and schedules
// them to be executed when the last operation ends, or, if no
// operation is active, when a timeout fires.
function signalLater(emitter, type /*, values...*/) {
  var arr = getHandlers(emitter, type, false)
  if (!arr.length) { return }
  var args = Array.prototype.slice.call(arguments, 2), list
  if (operationGroup) {
    list = operationGroup.delayedCallbacks
  } else if (orphanDelayedCallbacks) {
    list = orphanDelayedCallbacks
  } else {
    list = orphanDelayedCallbacks = []
    setTimeout(fireOrphanDelayed, 0)
  }
  var loop = function ( i ) {
    list.push(function () { return arr[i].apply(null, args); })
  };

  for (var i = 0; i < arr.length; ++i)
    loop( i );
}

function fireOrphanDelayed() {
  var delayed = orphanDelayedCallbacks
  orphanDelayedCallbacks = null
  for (var i = 0; i < delayed.length; ++i) { delayed[i]() }
}

// When an aspect of a line changes, a string is added to
// lineView.changes. This updates the relevant part of the line's
// DOM structure.
function updateLineForChanges(cm, lineView, lineN, dims) {
  for (var j = 0; j < lineView.changes.length; j++) {
    var type = lineView.changes[j]
    if (type == "text") { updateLineText(cm, lineView) }
    else if (type == "gutter") { updateLineGutter(cm, lineView, lineN, dims) }
    else if (type == "class") { updateLineClasses(lineView) }
    else if (type == "widget") { updateLineWidgets(cm, lineView, dims) }
  }
  lineView.changes = null
}

// Lines with gutter elements, widgets or a background class need to
// be wrapped, and have the extra elements added to the wrapper div
function ensureLineWrapped(lineView) {
  if (lineView.node == lineView.text) {
    lineView.node = elt("div", null, null, "position: relative")
    if (lineView.text.parentNode)
      { lineView.text.parentNode.replaceChild(lineView.node, lineView.text) }
    lineView.node.appendChild(lineView.text)
    if (ie && ie_version < 8) { lineView.node.style.zIndex = 2 }
  }
  return lineView.node
}

function updateLineBackground(lineView) {
  var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass
  if (cls) { cls += " CodeMirror-linebackground" }
  if (lineView.background) {
    if (cls) { lineView.background.className = cls }
    else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null }
  } else if (cls) {
    var wrap = ensureLineWrapped(lineView)
    lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild)
  }
}

// Wrapper around buildLineContent which will reuse the structure
// in display.externalMeasured when possible.
function getLineContent(cm, lineView) {
  var ext = cm.display.externalMeasured
  if (ext && ext.line == lineView.line) {
    cm.display.externalMeasured = null
    lineView.measure = ext.measure
    return ext.built
  }
  return buildLineContent(cm, lineView)
}

// Redraw the line's text. Interacts with the background and text
// classes because the mode may output tokens that influence these
// classes.
function updateLineText(cm, lineView) {
  var cls = lineView.text.className
  var built = getLineContent(cm, lineView)
  if (lineView.text == lineView.node) { lineView.node = built.pre }
  lineView.text.parentNode.replaceChild(built.pre, lineView.text)
  lineView.text = built.pre
  if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
    lineView.bgClass = built.bgClass
    lineView.textClass = built.textClass
    updateLineClasses(lineView)
  } else if (cls) {
    lineView.text.className = cls
  }
}

function updateLineClasses(lineView) {
  updateLineBackground(lineView)
  if (lineView.line.wrapClass)
    { ensureLineWrapped(lineView).className = lineView.line.wrapClass }
  else if (lineView.node != lineView.text)
    { lineView.node.className = "" }
  var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass
  lineView.text.className = textClass || ""
}

function updateLineGutter(cm, lineView, lineN, dims) {
  if (lineView.gutter) {
    lineView.node.removeChild(lineView.gutter)
    lineView.gutter = null
  }
  if (lineView.gutterBackground) {
    lineView.node.removeChild(lineView.gutterBackground)
    lineView.gutterBackground = null
  }
  if (lineView.line.gutterClass) {
    var wrap = ensureLineWrapped(lineView)
    lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
                                    ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + (dims.gutterTotalWidth) + "px"))
    wrap.insertBefore(lineView.gutterBackground, lineView.text)
  }
  var markers = lineView.line.gutterMarkers
  if (cm.options.lineNumbers || markers) {
    var wrap$1 = ensureLineWrapped(lineView)
    var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px"))
    cm.display.input.setUneditable(gutterWrap)
    wrap$1.insertBefore(gutterWrap, lineView.text)
    if (lineView.line.gutterClass)
      { gutterWrap.className += " " + lineView.line.gutterClass }
    if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
      { lineView.lineNumber = gutterWrap.appendChild(
        elt("div", lineNumberFor(cm.options, lineN),
            "CodeMirror-linenumber CodeMirror-gutter-elt",
            ("left: " + (dims.gutterLeft["CodeMirror-linenumbers"]) + "px; width: " + (cm.display.lineNumInnerWidth) + "px"))) }
    if (markers) { for (var k = 0; k < cm.options.gutters.length; ++k) {
      var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id]
      if (found)
        { gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt",
                                   ("left: " + (dims.gutterLeft[id]) + "px; width: " + (dims.gutterWidth[id]) + "px"))) }
    } }
  }
}

function updateLineWidgets(cm, lineView, dims) {
  if (lineView.alignable) { lineView.alignable = null }
  for (var node = lineView.node.firstChild, next = void 0; node; node = next) {
    next = node.nextSibling
    if (node.className == "CodeMirror-linewidget")
      { lineView.node.removeChild(node) }
  }
  insertLineWidgets(cm, lineView, dims)
}

// Build a line's DOM representation from scratch
function buildLineElement(cm, lineView, lineN, dims) {
  var built = getLineContent(cm, lineView)
  lineView.text = lineView.node = built.pre
  if (built.bgClass) { lineView.bgClass = built.bgClass }
  if (built.textClass) { lineView.textClass = built.textClass }

  updateLineClasses(lineView)
  updateLineGutter(cm, lineView, lineN, dims)
  insertLineWidgets(cm, lineView, dims)
  return lineView.node
}

// A lineView may contain multiple logical lines (when merged by
// collapsed spans). The widgets for all of them need to be drawn.
function insertLineWidgets(cm, lineView, dims) {
  insertLineWidgetsFor(cm, lineView.line, lineView, dims, true)
  if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
    { insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false) } }
}

function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
  if (!line.widgets) { return }
  var wrap = ensureLineWrapped(lineView)
  for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
    var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget")
    if (!widget.handleMouseEvents) { node.setAttribute("cm-ignore-events", "true") }
    positionLineWidget(widget, node, lineView, dims)
    cm.display.input.setUneditable(node)
    if (allowAbove && widget.above)
      { wrap.insertBefore(node, lineView.gutter || lineView.text) }
    else
      { wrap.appendChild(node) }
    signalLater(widget, "redraw")
  }
}

function positionLineWidget(widget, node, lineView, dims) {
  if (widget.noHScroll) {
    ;(lineView.alignable || (lineView.alignable = [])).push(node)
    var width = dims.wrapperWidth
    node.style.left = dims.fixedPos + "px"
    if (!widget.coverGutter) {
      width -= dims.gutterTotalWidth
      node.style.paddingLeft = dims.gutterTotalWidth + "px"
    }
    node.style.width = width + "px"
  }
  if (widget.coverGutter) {
    node.style.zIndex = 5
    node.style.position = "relative"
    if (!widget.noHScroll) { node.style.marginLeft = -dims.gutterTotalWidth + "px" }
  }
}

function widgetHeight(widget) {
  if (widget.height != null) { return widget.height }
  var cm = widget.doc.cm
  if (!cm) { return 0 }
  if (!contains(document.body, widget.node)) {
    var parentStyle = "position: relative;"
    if (widget.coverGutter)
      { parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;" }
    if (widget.noHScroll)
      { parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;" }
    removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle))
  }
  return widget.height = widget.node.parentNode.offsetHeight
}

// Return true when the given mouse event happened in a widget
function eventInWidget(display, e) {
  for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
    if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
        (n.parentNode == display.sizer && n != display.mover))
      { return true }
  }
}

// POSITION MEASUREMENT

function paddingTop(display) {return display.lineSpace.offsetTop}
function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
function paddingH(display) {
  if (display.cachedPaddingH) { return display.cachedPaddingH }
  var e = removeChildrenAndAdd(display.measure, elt("pre", "x"))
  var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle
  var data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)}
  if (!isNaN(data.left) && !isNaN(data.right)) { display.cachedPaddingH = data }
  return data
}

function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
function displayWidth(cm) {
  return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
}
function displayHeight(cm) {
  return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
}

// Ensure the lineView.wrapping.heights array is populated. This is
// an array of bottom offsets for the lines that make up a drawn
// line. When lineWrapping is on, there might be more than one
// height.
function ensureLineHeights(cm, lineView, rect) {
  var wrapping = cm.options.lineWrapping
  var curWidth = wrapping && displayWidth(cm)
  if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
    var heights = lineView.measure.heights = []
    if (wrapping) {
      lineView.measure.width = curWidth
      var rects = lineView.text.firstChild.getClientRects()
      for (var i = 0; i < rects.length - 1; i++) {
        var cur = rects[i], next = rects[i + 1]
        if (Math.abs(cur.bottom - next.bottom) > 2)
          { heights.push((cur.bottom + next.top) / 2 - rect.top) }
      }
    }
    heights.push(rect.bottom - rect.top)
  }
}

// Find a line map (mapping character offsets to text nodes) and a
// measurement cache for the given line number. (A line view might
// contain multiple lines when collapsed ranges are present.)
function mapFromLineView(lineView, line, lineN) {
  if (lineView.line == line)
    { return {map: lineView.measure.map, cache: lineView.measure.cache} }
  for (var i = 0; i < lineView.rest.length; i++)
    { if (lineView.rest[i] == line)
      { return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]} } }
  for (var i$1 = 0; i$1 < lineView.rest.length; i$1++)
    { if (lineNo(lineView.rest[i$1]) > lineN)
      { return {map: lineView.measure.maps[i$1], cache: lineView.measure.caches[i$1], before: true} } }
}

// Render a line into the hidden node display.externalMeasured. Used
// when measurement is needed for a line that's not in the viewport.
function updateExternalMeasurement(cm, line) {
  line = visualLine(line)
  var lineN = lineNo(line)
  var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN)
  view.lineN = lineN
  var built = view.built = buildLineContent(cm, view)
  view.text = built.pre
  removeChildrenAndAdd(cm.display.lineMeasure, built.pre)
  return view
}

// Get a {top, bottom, left, right} box (in line-local coordinates)
// for a given character.
function measureChar(cm, line, ch, bias) {
  return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
}

// Find a line view that corresponds to the given line number.
function findViewForLine(cm, lineN) {
  if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
    { return cm.display.view[findViewIndex(cm, lineN)] }
  var ext = cm.display.externalMeasured
  if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
    { return ext }
}

// Measurement can be split in two steps, the set-up work that
// applies to the whole line, and the measurement of the actual
// character. Functions like coordsChar, that need to do a lot of
// measurements in a row, can thus ensure that the set-up work is
// only done once.
function prepareMeasureForLine(cm, line) {
  var lineN = lineNo(line)
  var view = findViewForLine(cm, lineN)
  if (view && !view.text) {
    view = null
  } else if (view && view.changes) {
    updateLineForChanges(cm, view, lineN, getDimensions(cm))
    cm.curOp.forceUpdate = true
  }
  if (!view)
    { view = updateExternalMeasurement(cm, line) }

  var info = mapFromLineView(view, line, lineN)
  return {
    line: line, view: view, rect: null,
    map: info.map, cache: info.cache, before: info.before,
    hasHeights: false
  }
}

// Given a prepared measurement object, measures the position of an
// actual character (or fetches it from the cache).
function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
  if (prepared.before) { ch = -1 }
  var key = ch + (bias || ""), found
  if (prepared.cache.hasOwnProperty(key)) {
    found = prepared.cache[key]
  } else {
    if (!prepared.rect)
      { prepared.rect = prepared.view.text.getBoundingClientRect() }
    if (!prepared.hasHeights) {
      ensureLineHeights(cm, prepared.view, prepared.rect)
      prepared.hasHeights = true
    }
    found = measureCharInner(cm, prepared, ch, bias)
    if (!found.bogus) { prepared.cache[key] = found }
  }
  return {left: found.left, right: found.right,
          top: varHeight ? found.rtop : found.top,
          bottom: varHeight ? found.rbottom : found.bottom}
}

var nullRect = {left: 0, right: 0, top: 0, bottom: 0}

function nodeAndOffsetInLineMap(map, ch, bias) {
  var node, start, end, collapse, mStart, mEnd
  // First, search the line map for the text node corresponding to,
  // or closest to, the target character.
  for (var i = 0; i < map.length; i += 3) {
    mStart = map[i]
    mEnd = map[i + 1]
    if (ch < mStart) {
      start = 0; end = 1
      collapse = "left"
    } else if (ch < mEnd) {
      start = ch - mStart
      end = start + 1
    } else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
      end = mEnd - mStart
      start = end - 1
      if (ch >= mEnd) { collapse = "right" }
    }
    if (start != null) {
      node = map[i + 2]
      if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
        { collapse = bias }
      if (bias == "left" && start == 0)
        { while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
          node = map[(i -= 3) + 2]
          collapse = "left"
        } }
      if (bias == "right" && start == mEnd - mStart)
        { while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
          node = map[(i += 3) + 2]
          collapse = "right"
        } }
      break
    }
  }
  return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
}

function getUsefulRect(rects, bias) {
  var rect = nullRect
  if (bias == "left") { for (var i = 0; i < rects.length; i++) {
    if ((rect = rects[i]).left != rect.right) { break }
  } } else { for (var i$1 = rects.length - 1; i$1 >= 0; i$1--) {
    if ((rect = rects[i$1]).left != rect.right) { break }
  } }
  return rect
}

function measureCharInner(cm, prepared, ch, bias) {
  var place = nodeAndOffsetInLineMap(prepared.map, ch, bias)
  var node = place.node, start = place.start, end = place.end, collapse = place.collapse

  var rect
  if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
    for (var i$1 = 0; i$1 < 4; i$1++) { // Retry a maximum of 4 times when nonsense rectangles are returned
      while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) { --start }
      while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) { ++end }
      if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
        { rect = node.parentNode.getBoundingClientRect() }
      else
        { rect = getUsefulRect(range(node, start, end).getClientRects(), bias) }
      if (rect.left || rect.right || start == 0) { break }
      end = start
      start = start - 1
      collapse = "right"
    }
    if (ie && ie_version < 11) { rect = maybeUpdateRectForZooming(cm.display.measure, rect) }
  } else { // If it is a widget, simply get the box for the whole widget.
    if (start > 0) { collapse = bias = "right" }
    var rects
    if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
      { rect = rects[bias == "right" ? rects.length - 1 : 0] }
    else
      { rect = node.getBoundingClientRect() }
  }
  if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
    var rSpan = node.parentNode.getClientRects()[0]
    if (rSpan)
      { rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom} }
    else
      { rect = nullRect }
  }

  var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top
  var mid = (rtop + rbot) / 2
  var heights = prepared.view.measure.heights
  var i = 0
  for (; i < heights.length - 1; i++)
    { if (mid < heights[i]) { break } }
  var top = i ? heights[i - 1] : 0, bot = heights[i]
  var result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                top: top, bottom: bot}
  if (!rect.left && !rect.right) { result.bogus = true }
  if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot }

  return result
}

// Work around problem with bounding client rects on ranges being
// returned incorrectly when zoomed on IE10 and below.
function maybeUpdateRectForZooming(measure, rect) {
  if (!window.screen || screen.logicalXDPI == null ||
      screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
    { return rect }
  var scaleX = screen.logicalXDPI / screen.deviceXDPI
  var scaleY = screen.logicalYDPI / screen.deviceYDPI
  return {left: rect.left * scaleX, right: rect.right * scaleX,
          top: rect.top * scaleY, bottom: rect.bottom * scaleY}
}

function clearLineMeasurementCacheFor(lineView) {
  if (lineView.measure) {
    lineView.measure.cache = {}
    lineView.measure.heights = null
    if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
      { lineView.measure.caches[i] = {} } }
  }
}

function clearLineMeasurementCache(cm) {
  cm.display.externalMeasure = null
  removeChildren(cm.display.lineMeasure)
  for (var i = 0; i < cm.display.view.length; i++)
    { clearLineMeasurementCacheFor(cm.display.view[i]) }
}

function clearCaches(cm) {
  clearLineMeasurementCache(cm)
  cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null
  if (!cm.options.lineWrapping) { cm.display.maxLineChanged = true }
  cm.display.lineNumChars = null
}

function pageScrollX() { return window.pageXOffset || (document.documentElement || document.body).scrollLeft }
function pageScrollY() { return window.pageYOffset || (document.documentElement || document.body).scrollTop }

// Converts a {top, bottom, left, right} box from line-local
// coordinates into another coordinate system. Context may be one of
// "line", "div" (display.lineDiv), "local"./null (editor), "window",
// or "page".
function intoCoordSystem(cm, lineObj, rect, context) {
  if (lineObj.widgets) { for (var i = 0; i < lineObj.widgets.length; ++i) { if (lineObj.widgets[i].above) {
    var size = widgetHeight(lineObj.widgets[i])
    rect.top += size; rect.bottom += size
  } } }
  if (context == "line") { return rect }
  if (!context) { context = "local" }
  var yOff = heightAtLine(lineObj)
  if (context == "local") { yOff += paddingTop(cm.display) }
  else { yOff -= cm.display.viewOffset }
  if (context == "page" || context == "window") {
    var lOff = cm.display.lineSpace.getBoundingClientRect()
    yOff += lOff.top + (context == "window" ? 0 : pageScrollY())
    var xOff = lOff.left + (context == "window" ? 0 : pageScrollX())
    rect.left += xOff; rect.right += xOff
  }
  rect.top += yOff; rect.bottom += yOff
  return rect
}

// Coverts a box from "div" coords to another coordinate system.
// Context may be "window", "page", "div", or "local"./null.
function fromCoordSystem(cm, coords, context) {
  if (context == "div") { return coords }
  var left = coords.left, top = coords.top
  // First move into "page" coordinate system
  if (context == "page") {
    left -= pageScrollX()
    top -= pageScrollY()
  } else if (context == "local" || !context) {
    var localBox = cm.display.sizer.getBoundingClientRect()
    left += localBox.left
    top += localBox.top
  }

  var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect()
  return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
}

function charCoords(cm, pos, context, lineObj, bias) {
  if (!lineObj) { lineObj = getLine(cm.doc, pos.line) }
  return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
}

// Returns a box for a given cursor position, which may have an
// 'other' property containing the position of the secondary cursor
// on a bidi boundary.
function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
  lineObj = lineObj || getLine(cm.doc, pos.line)
  if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj) }
  function get(ch, right) {
    var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight)
    if (right) { m.left = m.right; } else { m.right = m.left }
    return intoCoordSystem(cm, lineObj, m, context)
  }
  function getBidi(ch, partPos) {
    var part = order[partPos], right = part.level % 2
    if (ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level) {
      part = order[--partPos]
      ch = bidiRight(part) - (part.level % 2 ? 0 : 1)
      right = true
    } else if (ch == bidiRight(part) && partPos < order.length - 1 && part.level < order[partPos + 1].level) {
      part = order[++partPos]
      ch = bidiLeft(part) - part.level % 2
      right = false
    }
    if (right && ch == part.to && ch > part.from) { return get(ch - 1) }
    return get(ch, right)
  }
  var order = getOrder(lineObj), ch = pos.ch
  if (!order) { return get(ch) }
  var partPos = getBidiPartAt(order, ch)
  var val = getBidi(ch, partPos)
  if (bidiOther != null) { val.other = getBidi(ch, bidiOther) }
  return val
}

// Used to cheaply estimate the coordinates for a position. Used for
// intermediate scroll updates.
function estimateCoords(cm, pos) {
  var left = 0
  pos = clipPos(cm.doc, pos)
  if (!cm.options.lineWrapping) { left = charWidth(cm.display) * pos.ch }
  var lineObj = getLine(cm.doc, pos.line)
  var top = heightAtLine(lineObj) + paddingTop(cm.display)
  return {left: left, right: left, top: top, bottom: top + lineObj.height}
}

// Positions returned by coordsChar contain some extra information.
// xRel is the relative x position of the input coordinates compared
// to the found position (so xRel > 0 means the coordinates are to
// the right of the character position, for example). When outside
// is true, that means the coordinates lie outside the line's
// vertical range.
function PosWithInfo(line, ch, outside, xRel) {
  var pos = Pos(line, ch)
  pos.xRel = xRel
  if (outside) { pos.outside = true }
  return pos
}

// Compute the character position closest to the given coordinates.
// Input must be lineSpace-local ("div" coordinate system).
function coordsChar(cm, x, y) {
  var doc = cm.doc
  y += cm.display.viewOffset
  if (y < 0) { return PosWithInfo(doc.first, 0, true, -1) }
  var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1
  if (lineN > last)
    { return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, true, 1) }
  if (x < 0) { x = 0 }

  var lineObj = getLine(doc, lineN)
  for (;;) {
    var found = coordsCharInner(cm, lineObj, lineN, x, y)
    var merged = collapsedSpanAtEnd(lineObj)
    var mergedPos = merged && merged.find(0, true)
    if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))
      { lineN = lineNo(lineObj = mergedPos.to.line) }
    else
      { return found }
  }
}

function coordsCharInner(cm, lineObj, lineNo, x, y) {
  var innerOff = y - heightAtLine(lineObj)
  var wrongLine = false, adjust = 2 * cm.display.wrapper.clientWidth
  var preparedMeasure = prepareMeasureForLine(cm, lineObj)

  function getX(ch) {
    var sp = cursorCoords(cm, Pos(lineNo, ch), "line", lineObj, preparedMeasure)
    wrongLine = true
    if (innerOff > sp.bottom) { return sp.left - adjust }
    else if (innerOff < sp.top) { return sp.left + adjust }
    else { wrongLine = false }
    return sp.left
  }

  var bidi = getOrder(lineObj), dist = lineObj.text.length
  var from = lineLeft(lineObj), to = lineRight(lineObj)
  var fromX = getX(from), fromOutside = wrongLine, toX = getX(to), toOutside = wrongLine

  if (x > toX) { return PosWithInfo(lineNo, to, toOutside, 1) }
  // Do a binary search between these bounds.
  for (;;) {
    if (bidi ? to == from || to == moveVisually(lineObj, from, 1) : to - from <= 1) {
      var ch = x < fromX || x - fromX <= toX - x ? from : to
      var outside = ch == from ? fromOutside : toOutside
      var xDiff = x - (ch == from ? fromX : toX)
      // This is a kludge to handle the case where the coordinates
      // are after a line-wrapped line. We should replace it with a
      // more general handling of cursor positions around line
      // breaks. (Issue #4078)
      if (toOutside && !bidi && !/\s/.test(lineObj.text.charAt(ch)) && xDiff > 0 &&
          ch < lineObj.text.length && preparedMeasure.view.measure.heights.length > 1) {
        var charSize = measureCharPrepared(cm, preparedMeasure, ch, "right")
        if (innerOff <= charSize.bottom && innerOff >= charSize.top && Math.abs(x - charSize.right) < xDiff) {
          outside = false
          ch++
          xDiff = x - charSize.right
        }
      }
      while (isExtendingChar(lineObj.text.charAt(ch))) { ++ch }
      var pos = PosWithInfo(lineNo, ch, outside, xDiff < -1 ? -1 : xDiff > 1 ? 1 : 0)
      return pos
    }
    var step = Math.ceil(dist / 2), middle = from + step
    if (bidi) {
      middle = from
      for (var i = 0; i < step; ++i) { middle = moveVisually(lineObj, middle, 1) }
    }
    var middleX = getX(middle)
    if (middleX > x) {to = middle; toX = middleX; if (toOutside = wrongLine) { toX += 1000; } dist = step}
    else {from = middle; fromX = middleX; fromOutside = wrongLine; dist -= step}
  }
}

var measureText
// Compute the default text height.
function textHeight(display) {
  if (display.cachedTextHeight != null) { return display.cachedTextHeight }
  if (measureText == null) {
    measureText = elt("pre")
    // Measure a bunch of lines, for browsers that compute
    // fractional heights.
    for (var i = 0; i < 49; ++i) {
      measureText.appendChild(document.createTextNode("x"))
      measureText.appendChild(elt("br"))
    }
    measureText.appendChild(document.createTextNode("x"))
  }
  removeChildrenAndAdd(display.measure, measureText)
  var height = measureText.offsetHeight / 50
  if (height > 3) { display.cachedTextHeight = height }
  removeChildren(display.measure)
  return height || 1
}

// Compute the default character width.
function charWidth(display) {
  if (display.cachedCharWidth != null) { return display.cachedCharWidth }
  var anchor = elt("span", "xxxxxxxxxx")
  var pre = elt("pre", [anchor])
  removeChildrenAndAdd(display.measure, pre)
  var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10
  if (width > 2) { display.cachedCharWidth = width }
  return width || 10
}

// Do a bulk-read of the DOM positions and sizes needed to draw the
// view, so that we don't interleave reading and writing to the DOM.
function getDimensions(cm) {
  var d = cm.display, left = {}, width = {}
  var gutterLeft = d.gutters.clientLeft
  for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
    left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft
    width[cm.options.gutters[i]] = n.clientWidth
  }
  return {fixedPos: compensateForHScroll(d),
          gutterTotalWidth: d.gutters.offsetWidth,
          gutterLeft: left,
          gutterWidth: width,
          wrapperWidth: d.wrapper.clientWidth}
}

// Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
// but using getBoundingClientRect to get a sub-pixel-accurate
// result.
function compensateForHScroll(display) {
  return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
}

// Returns a function that estimates the height of a line, to use as
// first approximation until the line becomes visible (and is thus
// properly measurable).
function estimateHeight(cm) {
  var th = textHeight(cm.display), wrapping = cm.options.lineWrapping
  var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3)
  return function (line) {
    if (lineIsHidden(cm.doc, line)) { return 0 }

    var widgetsHeight = 0
    if (line.widgets) { for (var i = 0; i < line.widgets.length; i++) {
      if (line.widgets[i].height) { widgetsHeight += line.widgets[i].height }
    } }

    if (wrapping)
      { return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th }
    else
      { return widgetsHeight + th }
  }
}

function estimateLineHeights(cm) {
  var doc = cm.doc, est = estimateHeight(cm)
  doc.iter(function (line) {
    var estHeight = est(line)
    if (estHeight != line.height) { updateLineHeight(line, estHeight) }
  })
}

// Given a mouse event, find the corresponding position. If liberal
// is false, it checks whether a gutter or scrollbar was clicked,
// and returns null if it was. forRect is used by rectangular
// selections, and tries to estimate a character position even for
// coordinates beyond the right of the text.
function posFromMouse(cm, e, liberal, forRect) {
  var display = cm.display
  if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") { return null }

  var x, y, space = display.lineSpace.getBoundingClientRect()
  // Fails unpredictably on IE[67] when mouse is dragged around quickly.
  try { x = e.clientX - space.left; y = e.clientY - space.top }
  catch (e) { return null }
  var coords = coordsChar(cm, x, y), line
  if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
    var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length
    coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff))
  }
  return coords
}

// Find the view element corresponding to a given line. Return null
// when the line isn't visible.
function findViewIndex(cm, n) {
  if (n >= cm.display.viewTo) { return null }
  n -= cm.display.viewFrom
  if (n < 0) { return null }
  var view = cm.display.view
  for (var i = 0; i < view.length; i++) {
    n -= view[i].size
    if (n < 0) { return i }
  }
}

function updateSelection(cm) {
  cm.display.input.showSelection(cm.display.input.prepareSelection())
}

function prepareSelection(cm, primary) {
  var doc = cm.doc, result = {}
  var curFragment = result.cursors = document.createDocumentFragment()
  var selFragment = result.selection = document.createDocumentFragment()

  for (var i = 0; i < doc.sel.ranges.length; i++) {
    if (primary === false && i == doc.sel.primIndex) { continue }
    var range = doc.sel.ranges[i]
    if (range.from().line >= cm.display.viewTo || range.to().line < cm.display.viewFrom) { continue }
    var collapsed = range.empty()
    if (collapsed || cm.options.showCursorWhenSelecting)
      { drawSelectionCursor(cm, range.head, curFragment) }
    if (!collapsed)
      { drawSelectionRange(cm, range, selFragment) }
  }
  return result
}

// Draws a cursor for the given range
function drawSelectionCursor(cm, head, output) {
  var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine)

  var cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"))
  cursor.style.left = pos.left + "px"
  cursor.style.top = pos.top + "px"
  cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px"

  if (pos.other) {
    // Secondary cursor, shown when on a 'jump' in bi-directional text
    var otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"))
    otherCursor.style.display = ""
    otherCursor.style.left = pos.other.left + "px"
    otherCursor.style.top = pos.other.top + "px"
    otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px"
  }
}

// Draws the given range as a highlighted selection
function drawSelectionRange(cm, range, output) {
  var display = cm.display, doc = cm.doc
  var fragment = document.createDocumentFragment()
  var padding = paddingH(cm.display), leftSide = padding.left
  var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right

  function add(left, top, width, bottom) {
    if (top < 0) { top = 0 }
    top = Math.round(top)
    bottom = Math.round(bottom)
    fragment.appendChild(elt("div", null, "CodeMirror-selected", ("position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px")))
  }

  function drawForLine(line, fromArg, toArg) {
    var lineObj = getLine(doc, line)
    var lineLen = lineObj.text.length
    var start, end
    function coords(ch, bias) {
      return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
    }

    iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ? lineLen : toArg, function (from, to, dir) {
      var leftPos = coords(from, "left"), rightPos, left, right
      if (from == to) {
        rightPos = leftPos
        left = right = leftPos.left
      } else {
        rightPos = coords(to - 1, "right")
        if (dir == "rtl") { var tmp = leftPos; leftPos = rightPos; rightPos = tmp }
        left = leftPos.left
        right = rightPos.right
      }
      if (fromArg == null && from == 0) { left = leftSide }
      if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part
        add(left, leftPos.top, null, leftPos.bottom)
        left = leftSide
        if (leftPos.bottom < rightPos.top) { add(left, leftPos.bottom, null, rightPos.top) }
      }
      if (toArg == null && to == lineLen) { right = rightSide }
      if (!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)
        { start = leftPos }
      if (!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)
        { end = rightPos }
      if (left < leftSide + 1) { left = leftSide }
      add(left, rightPos.top, right - left, rightPos.bottom)
    })
    return {start: start, end: end}
  }

  var sFrom = range.from(), sTo = range.to()
  if (sFrom.line == sTo.line) {
    drawForLine(sFrom.line, sFrom.ch, sTo.ch)
  } else {
    var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line)
    var singleVLine = visualLine(fromLine) == visualLine(toLine)
    var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end
    var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start
    if (singleVLine) {
      if (leftEnd.top < rightStart.top - 2) {
        add(leftEnd.right, leftEnd.top, null, leftEnd.bottom)
        add(leftSide, rightStart.top, rightStart.left, rightStart.bottom)
      } else {
        add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom)
      }
    }
    if (leftEnd.bottom < rightStart.top)
      { add(leftSide, leftEnd.bottom, null, rightStart.top) }
  }

  output.appendChild(fragment)
}

// Cursor-blinking
function restartBlink(cm) {
  if (!cm.state.focused) { return }
  var display = cm.display
  clearInterval(display.blinker)
  var on = true
  display.cursorDiv.style.visibility = ""
  if (cm.options.cursorBlinkRate > 0)
    { display.blinker = setInterval(function () { return display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden"; },
      cm.options.cursorBlinkRate) }
  else if (cm.options.cursorBlinkRate < 0)
    { display.cursorDiv.style.visibility = "hidden" }
}

function ensureFocus(cm) {
  if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm) }
}

function delayBlurEvent(cm) {
  cm.state.delayingBlurEvent = true
  setTimeout(function () { if (cm.state.delayingBlurEvent) {
    cm.state.delayingBlurEvent = false
    onBlur(cm)
  } }, 100)
}

function onFocus(cm, e) {
  if (cm.state.delayingBlurEvent) { cm.state.delayingBlurEvent = false }

  if (cm.options.readOnly == "nocursor") { return }
  if (!cm.state.focused) {
    signal(cm, "focus", cm, e)
    cm.state.focused = true
    addClass(cm.display.wrapper, "CodeMirror-focused")
    // This test prevents this from firing when a context
    // menu is closed (since the input reset would kill the
    // select-all detection hack)
    if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
      cm.display.input.reset()
      if (webkit) { setTimeout(function () { return cm.display.input.reset(true); }, 20) } // Issue #1730
    }
    cm.display.input.receivedFocus()
  }
  restartBlink(cm)
}
function onBlur(cm, e) {
  if (cm.state.delayingBlurEvent) { return }

  if (cm.state.focused) {
    signal(cm, "blur", cm, e)
    cm.state.focused = false
    rmClass(cm.display.wrapper, "CodeMirror-focused")
  }
  clearInterval(cm.display.blinker)
  setTimeout(function () { if (!cm.state.focused) { cm.display.shift = false } }, 150)
}

// Re-align line numbers and gutter marks to compensate for
// horizontal scrolling.
function alignHorizontally(cm) {
  var display = cm.display, view = display.view
  if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) { return }
  var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft
  var gutterW = display.gutters.offsetWidth, left = comp + "px"
  for (var i = 0; i < view.length; i++) { if (!view[i].hidden) {
    if (cm.options.fixedGutter) {
      if (view[i].gutter)
        { view[i].gutter.style.left = left }
      if (view[i].gutterBackground)
        { view[i].gutterBackground.style.left = left }
    }
    var align = view[i].alignable
    if (align) { for (var j = 0; j < align.length; j++)
      { align[j].style.left = left } }
  } }
  if (cm.options.fixedGutter)
    { display.gutters.style.left = (comp + gutterW) + "px" }
}

// Used to ensure that the line number gutter is still the right
// size for the current document size. Returns true when an update
// is needed.
function maybeUpdateLineNumberWidth(cm) {
  if (!cm.options.lineNumbers) { return false }
  var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display
  if (last.length != display.lineNumChars) {
    var test = display.measure.appendChild(elt("div", [elt("div", last)],
                                               "CodeMirror-linenumber CodeMirror-gutter-elt"))
    var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW
    display.lineGutter.style.width = ""
    display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1
    display.lineNumWidth = display.lineNumInnerWidth + padding
    display.lineNumChars = display.lineNumInnerWidth ? last.length : -1
    display.lineGutter.style.width = display.lineNumWidth + "px"
    updateGutterSpace(cm)
    return true
  }
  return false
}

// Read the actual heights of the rendered lines, and update their
// stored heights to match.
function updateHeightsInViewport(cm) {
  var display = cm.display
  var prevBottom = display.lineDiv.offsetTop
  for (var i = 0; i < display.view.length; i++) {
    var cur = display.view[i], height = void 0
    if (cur.hidden) { continue }
    if (ie && ie_version < 8) {
      var bot = cur.node.offsetTop + cur.node.offsetHeight
      height = bot - prevBottom
      prevBottom = bot
    } else {
      var box = cur.node.getBoundingClientRect()
      height = box.bottom - box.top
    }
    var diff = cur.line.height - height
    if (height < 2) { height = textHeight(display) }
    if (diff > .001 || diff < -.001) {
      updateLineHeight(cur.line, height)
      updateWidgetHeight(cur.line)
      if (cur.rest) { for (var j = 0; j < cur.rest.length; j++)
        { updateWidgetHeight(cur.rest[j]) } }
    }
  }
}

// Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line) {
  if (line.widgets) { for (var i = 0; i < line.widgets.length; ++i)
    { line.widgets[i].height = line.widgets[i].node.parentNode.offsetHeight } }
}

// Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
function visibleLines(display, doc, viewport) {
  var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop
  top = Math.floor(top - paddingTop(display))
  var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight

  var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom)
  // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
  // forces those lines into the viewport (if possible).
  if (viewport && viewport.ensure) {
    var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line
    if (ensureFrom < from) {
      from = ensureFrom
      to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight)
    } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
      from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight)
      to = ensureTo
    }
  }
  return {from: from, to: Math.max(to, from + 1)}
}

// Sync the scrollable area and scrollbars, ensure the viewport
// covers the visible area.
function setScrollTop(cm, val) {
  if (Math.abs(cm.doc.scrollTop - val) < 2) { return }
  cm.doc.scrollTop = val
  if (!gecko) { updateDisplaySimple(cm, {top: val}) }
  if (cm.display.scroller.scrollTop != val) { cm.display.scroller.scrollTop = val }
  cm.display.scrollbars.setScrollTop(val)
  if (gecko) { updateDisplaySimple(cm) }
  startWorker(cm, 100)
}
// Sync scroller and scrollbar, ensure the gutter elements are
// aligned.
function setScrollLeft(cm, val, isScroller) {
  if (isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) { return }
  val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth)
  cm.doc.scrollLeft = val
  alignHorizontally(cm)
  if (cm.display.scroller.scrollLeft != val) { cm.display.scroller.scrollLeft = val }
  cm.display.scrollbars.setScrollLeft(val)
}

// Since the delta values reported on mouse wheel events are
// unstandardized between browsers and even browser versions, and
// generally horribly unpredictable, this code starts by measuring
// the scroll effect that the first few mouse wheel events have,
// and, from that, detects the way it can convert deltas to pixel
// offsets afterwards.
//
// The reason we want to know the amount a wheel event will scroll
// is that it gives us a chance to update the display before the
// actual scrolling happens, reducing flickering.

var wheelSamples = 0;
var wheelPixelsPerUnit = null;
// Fill in a browser-detected starting value on browsers where we
// know one. These don't have to be accurate -- the result of them
// being wrong would just be a slight flicker on the first wheel
// scroll (if it is large enough).
if (ie) { wheelPixelsPerUnit = -.53 }
else if (gecko) { wheelPixelsPerUnit = 15 }
else if (chrome) { wheelPixelsPerUnit = -.7 }
else if (safari) { wheelPixelsPerUnit = -1/3 }

function wheelEventDelta(e) {
  var dx = e.wheelDeltaX, dy = e.wheelDeltaY
  if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) { dx = e.detail }
  if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) { dy = e.detail }
  else if (dy == null) { dy = e.wheelDelta }
  return {x: dx, y: dy}
}
function wheelEventPixels(e) {
  var delta = wheelEventDelta(e)
  delta.x *= wheelPixelsPerUnit
  delta.y *= wheelPixelsPerUnit
  return delta
}

function onScrollWheel(cm, e) {
  var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y

  var display = cm.display, scroll = display.scroller
  // Quit if there's nothing to scroll here
  var canScrollX = scroll.scrollWidth > scroll.clientWidth
  var canScrollY = scroll.scrollHeight > scroll.clientHeight
  if (!(dx && canScrollX || dy && canScrollY)) { return }

  // Webkit browsers on OS X abort momentum scrolls when the target
  // of the scroll event is removed from the scrollable element.
  // This hack (see related code in patchDisplay) makes sure the
  // element is kept around.
  if (dy && mac && webkit) {
    outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
      for (var i = 0; i < view.length; i++) {
        if (view[i].node == cur) {
          cm.display.currentWheelTarget = cur
          break outer
        }
      }
    }
  }

  // On some browsers, horizontal scrolling will cause redraws to
  // happen before the gutter has been realigned, causing it to
  // wriggle around in a most unseemly way. When we have an
  // estimated pixels/delta value, we just handle horizontal
  // scrolling entirely here. It'll be slightly off from native, but
  // better than glitching out.
  if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
    if (dy && canScrollY)
      { setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight))) }
    setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)))
    // Only prevent default scrolling if vertical scrolling is
    // actually possible. Otherwise, it causes vertical scroll
    // jitter on OSX trackpads when deltaX is small and deltaY
    // is large (issue #3579)
    if (!dy || (dy && canScrollY))
      { e_preventDefault(e) }
    display.wheelStartX = null // Abort measurement, if in progress
    return
  }

  // 'Project' the visible viewport to cover the area that is being
  // scrolled into view (if we know enough to estimate it).
  if (dy && wheelPixelsPerUnit != null) {
    var pixels = dy * wheelPixelsPerUnit
    var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight
    if (pixels < 0) { top = Math.max(0, top + pixels - 50) }
    else { bot = Math.min(cm.doc.height, bot + pixels + 50) }
    updateDisplaySimple(cm, {top: top, bottom: bot})
  }

  if (wheelSamples < 20) {
    if (display.wheelStartX == null) {
      display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop
      display.wheelDX = dx; display.wheelDY = dy
      setTimeout(function () {
        if (display.wheelStartX == null) { return }
        var movedX = scroll.scrollLeft - display.wheelStartX
        var movedY = scroll.scrollTop - display.wheelStartY
        var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
          (movedX && display.wheelDX && movedX / display.wheelDX)
        display.wheelStartX = display.wheelStartY = null
        if (!sample) { return }
        wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1)
        ++wheelSamples
      }, 200)
    } else {
      display.wheelDX += dx; display.wheelDY += dy
    }
  }
}

// SCROLLBARS

// Prepare DOM reads needed to update the scrollbars. Done in one
// shot to minimize update/measure roundtrips.
function measureForScrollbars(cm) {
  var d = cm.display, gutterW = d.gutters.offsetWidth
  var docH = Math.round(cm.doc.height + paddingVert(cm.display))
  return {
    clientHeight: d.scroller.clientHeight,
    viewHeight: d.wrapper.clientHeight,
    scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
    viewWidth: d.wrapper.clientWidth,
    barLeft: cm.options.fixedGutter ? gutterW : 0,
    docHeight: docH,
    scrollHeight: docH + scrollGap(cm) + d.barHeight,
    nativeBarWidth: d.nativeBarWidth,
    gutterWidth: gutterW
  }
}

function NativeScrollbars(place, scroll, cm) {
  this.cm = cm
  var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar")
  var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar")
  place(vert); place(horiz)

  on(vert, "scroll", function () {
    if (vert.clientHeight) { scroll(vert.scrollTop, "vertical") }
  })
  on(horiz, "scroll", function () {
    if (horiz.clientWidth) { scroll(horiz.scrollLeft, "horizontal") }
  })

  this.checkedZeroWidth = false
  // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
  if (ie && ie_version < 8) { this.horiz.style.minHeight = this.vert.style.minWidth = "18px" }
}

NativeScrollbars.prototype = copyObj({
  update: function(measure) {
    var needsH = measure.scrollWidth > measure.clientWidth + 1
    var needsV = measure.scrollHeight > measure.clientHeight + 1
    var sWidth = measure.nativeBarWidth

    if (needsV) {
      this.vert.style.display = "block"
      this.vert.style.bottom = needsH ? sWidth + "px" : "0"
      var totalHeight = measure.viewHeight - (needsH ? sWidth : 0)
      // A bug in IE8 can cause this value to be negative, so guard it.
      this.vert.firstChild.style.height =
        Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px"
    } else {
      this.vert.style.display = ""
      this.vert.firstChild.style.height = "0"
    }

    if (needsH) {
      this.horiz.style.display = "block"
      this.horiz.style.right = needsV ? sWidth + "px" : "0"
      this.horiz.style.left = measure.barLeft + "px"
      var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0)
      this.horiz.firstChild.style.width =
        (measure.scrollWidth - measure.clientWidth + totalWidth) + "px"
    } else {
      this.horiz.style.display = ""
      this.horiz.firstChild.style.width = "0"
    }

    if (!this.checkedZeroWidth && measure.clientHeight > 0) {
      if (sWidth == 0) { this.zeroWidthHack() }
      this.checkedZeroWidth = true
    }

    return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0}
  },
  setScrollLeft: function(pos) {
    if (this.horiz.scrollLeft != pos) { this.horiz.scrollLeft = pos }
    if (this.disableHoriz) { this.enableZeroWidthBar(this.horiz, this.disableHoriz) }
  },
  setScrollTop: function(pos) {
    if (this.vert.scrollTop != pos) { this.vert.scrollTop = pos }
    if (this.disableVert) { this.enableZeroWidthBar(this.vert, this.disableVert) }
  },
  zeroWidthHack: function() {
    var w = mac && !mac_geMountainLion ? "12px" : "18px"
    this.horiz.style.height = this.vert.style.width = w
    this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none"
    this.disableHoriz = new Delayed
    this.disableVert = new Delayed
  },
  enableZeroWidthBar: function(bar, delay) {
    bar.style.pointerEvents = "auto"
    function maybeDisable() {
      // To find out whether the scrollbar is still visible, we
      // check whether the element under the pixel in the bottom
      // left corner of the scrollbar box is the scrollbar box
      // itself (when the bar is still visible) or its filler child
      // (when the bar is hidden). If it is still visible, we keep
      // it enabled, if it's hidden, we disable pointer events.
      var box = bar.getBoundingClientRect()
      var elt = document.elementFromPoint(box.left + 1, box.bottom - 1)
      if (elt != bar) { bar.style.pointerEvents = "none" }
      else { delay.set(1000, maybeDisable) }
    }
    delay.set(1000, maybeDisable)
  },
  clear: function() {
    var parent = this.horiz.parentNode
    parent.removeChild(this.horiz)
    parent.removeChild(this.vert)
  }
}, NativeScrollbars.prototype)

function NullScrollbars() {}

NullScrollbars.prototype = copyObj({
  update: function() { return {bottom: 0, right: 0} },
  setScrollLeft: function() {},
  setScrollTop: function() {},
  clear: function() {}
}, NullScrollbars.prototype)

function updateScrollbars(cm, measure) {
  if (!measure) { measure = measureForScrollbars(cm) }
  var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight
  updateScrollbarsInner(cm, measure)
  for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
    if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
      { updateHeightsInViewport(cm) }
    updateScrollbarsInner(cm, measureForScrollbars(cm))
    startWidth = cm.display.barWidth; startHeight = cm.display.barHeight
  }
}

// Re-synchronize the fake scrollbars with the actual size of the
// content.
function updateScrollbarsInner(cm, measure) {
  var d = cm.display
  var sizes = d.scrollbars.update(measure)

  d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px"
  d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px"
  d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent"

  if (sizes.right && sizes.bottom) {
    d.scrollbarFiller.style.display = "block"
    d.scrollbarFiller.style.height = sizes.bottom + "px"
    d.scrollbarFiller.style.width = sizes.right + "px"
  } else { d.scrollbarFiller.style.display = "" }
  if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
    d.gutterFiller.style.display = "block"
    d.gutterFiller.style.height = sizes.bottom + "px"
    d.gutterFiller.style.width = measure.gutterWidth + "px"
  } else { d.gutterFiller.style.display = "" }
}

var scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars}

function initScrollbars(cm) {
  if (cm.display.scrollbars) {
    cm.display.scrollbars.clear()
    if (cm.display.scrollbars.addClass)
      { rmClass(cm.display.wrapper, cm.display.scrollbars.addClass) }
  }

  cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function (node) {
    cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller)
    // Prevent clicks in the scrollbars from killing focus
    on(node, "mousedown", function () {
      if (cm.state.focused) { setTimeout(function () { return cm.display.input.focus(); }, 0) }
    })
    node.setAttribute("cm-not-content", "true")
  }, function (pos, axis) {
    if (axis == "horizontal") { setScrollLeft(cm, pos) }
    else { setScrollTop(cm, pos) }
  }, cm)
  if (cm.display.scrollbars.addClass)
    { addClass(cm.display.wrapper, cm.display.scrollbars.addClass) }
}

// SCROLLING THINGS INTO VIEW

// If an editor sits on the top or bottom of the window, partially
// scrolled out of view, this ensures that the cursor is visible.
function maybeScrollWindow(cm, coords) {
  if (signalDOMEvent(cm, "scrollCursorIntoView")) { return }

  var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null
  if (coords.top + box.top < 0) { doScroll = true }
  else if (coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) { doScroll = false }
  if (doScroll != null && !phantom) {
    var scrollNode = elt("div", "\u200b", null, ("position: absolute;\n                         top: " + (coords.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (coords.bottom - coords.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + (coords.left) + "px; width: 2px;"))
    cm.display.lineSpace.appendChild(scrollNode)
    scrollNode.scrollIntoView(doScroll)
    cm.display.lineSpace.removeChild(scrollNode)
  }
}

// Scroll a given position into view (immediately), verifying that
// it actually became visible (as line heights are accurately
// measured, the position of something may 'drift' during drawing).
function scrollPosIntoView(cm, pos, end, margin) {
  if (margin == null) { margin = 0 }
  var coords
  for (var limit = 0; limit < 5; limit++) {
    var changed = false
    coords = cursorCoords(cm, pos)
    var endCoords = !end || end == pos ? coords : cursorCoords(cm, end)
    var scrollPos = calculateScrollPos(cm, Math.min(coords.left, endCoords.left),
                                       Math.min(coords.top, endCoords.top) - margin,
                                       Math.max(coords.left, endCoords.left),
                                       Math.max(coords.bottom, endCoords.bottom) + margin)
    var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft
    if (scrollPos.scrollTop != null) {
      setScrollTop(cm, scrollPos.scrollTop)
      if (Math.abs(cm.doc.scrollTop - startTop) > 1) { changed = true }
    }
    if (scrollPos.scrollLeft != null) {
      setScrollLeft(cm, scrollPos.scrollLeft)
      if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) { changed = true }
    }
    if (!changed) { break }
  }
  return coords
}

// Scroll a given set of coordinates into view (immediately).
function scrollIntoView(cm, x1, y1, x2, y2) {
  var scrollPos = calculateScrollPos(cm, x1, y1, x2, y2)
  if (scrollPos.scrollTop != null) { setScrollTop(cm, scrollPos.scrollTop) }
  if (scrollPos.scrollLeft != null) { setScrollLeft(cm, scrollPos.scrollLeft) }
}

// Calculate a new scroll position needed to scroll the given
// rectangle into view. Returns an object with scrollTop and
// scrollLeft properties. When these are undefined, the
// vertical/horizontal position does not need to be adjusted.
function calculateScrollPos(cm, x1, y1, x2, y2) {
  var display = cm.display, snapMargin = textHeight(cm.display)
  if (y1 < 0) { y1 = 0 }
  var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop
  var screen = displayHeight(cm), result = {}
  if (y2 - y1 > screen) { y2 = y1 + screen }
  var docBottom = cm.doc.height + paddingVert(display)
  var atTop = y1 < snapMargin, atBottom = y2 > docBottom - snapMargin
  if (y1 < screentop) {
    result.scrollTop = atTop ? 0 : y1
  } else if (y2 > screentop + screen) {
    var newTop = Math.min(y1, (atBottom ? docBottom : y2) - screen)
    if (newTop != screentop) { result.scrollTop = newTop }
  }

  var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft
  var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0)
  var tooWide = x2 - x1 > screenw
  if (tooWide) { x2 = x1 + screenw }
  if (x1 < 10)
    { result.scrollLeft = 0 }
  else if (x1 < screenleft)
    { result.scrollLeft = Math.max(0, x1 - (tooWide ? 0 : 10)) }
  else if (x2 > screenw + screenleft - 3)
    { result.scrollLeft = x2 + (tooWide ? 0 : 10) - screenw }
  return result
}

// Store a relative adjustment to the scroll position in the current
// operation (to be applied when the operation finishes).
function addToScrollPos(cm, left, top) {
  if (left != null || top != null) { resolveScrollToPos(cm) }
  if (left != null)
    { cm.curOp.scrollLeft = (cm.curOp.scrollLeft == null ? cm.doc.scrollLeft : cm.curOp.scrollLeft) + left }
  if (top != null)
    { cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top }
}

// Make sure that at the end of the operation the current cursor is
// shown.
function ensureCursorVisible(cm) {
  resolveScrollToPos(cm)
  var cur = cm.getCursor(), from = cur, to = cur
  if (!cm.options.lineWrapping) {
    from = cur.ch ? Pos(cur.line, cur.ch - 1) : cur
    to = Pos(cur.line, cur.ch + 1)
  }
  cm.curOp.scrollToPos = {from: from, to: to, margin: cm.options.cursorScrollMargin, isCursor: true}
}

// When an operation has its scrollToPos property set, and another
// scroll action is applied before the end of the operation, this
// 'simulates' scrolling that position into view in a cheap way, so
// that the effect of intermediate scroll commands is not ignored.
function resolveScrollToPos(cm) {
  var range = cm.curOp.scrollToPos
  if (range) {
    cm.curOp.scrollToPos = null
    var from = estimateCoords(cm, range.from), to = estimateCoords(cm, range.to)
    var sPos = calculateScrollPos(cm, Math.min(from.left, to.left),
                                  Math.min(from.top, to.top) - range.margin,
                                  Math.max(from.right, to.right),
                                  Math.max(from.bottom, to.bottom) + range.margin)
    cm.scrollTo(sPos.scrollLeft, sPos.scrollTop)
  }
}

// Operations are used to wrap a series of changes to the editor
// state in such a way that each change won't have to update the
// cursor and display (which would be awkward, slow, and
// error-prone). Instead, display updates are batched and then all
// combined and executed at once.

var nextOpId = 0
// Start a new operation.
function startOperation(cm) {
  cm.curOp = {
    cm: cm,
    viewChanged: false,      // Flag that indicates that lines might need to be redrawn
    startHeight: cm.doc.height, // Used to detect need to update scrollbar
    forceUpdate: false,      // Used to force a redraw
    updateInput: null,       // Whether to reset the input textarea
    typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
    changeObjs: null,        // Accumulated changes, for firing change events
    cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
    cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
    selectionChanged: false, // Whether the selection needs to be redrawn
    updateMaxLine: false,    // Set when the widest line needs to be determined anew
    scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
    scrollToPos: null,       // Used to scroll to a specific position
    focus: false,
    id: ++nextOpId           // Unique ID
  }
  pushOperation(cm.curOp)
}

// Finish an operation, updating the display and signalling delayed events
function endOperation(cm) {
  var op = cm.curOp
  finishOperation(op, function (group) {
    for (var i = 0; i < group.ops.length; i++)
      { group.ops[i].cm.curOp = null }
    endOperations(group)
  })
}

// The DOM updates done when an operation finishes are batched so
// that the minimum number of relayouts are required.
function endOperations(group) {
  var ops = group.ops
  for (var i = 0; i < ops.length; i++) // Read DOM
    { endOperation_R1(ops[i]) }
  for (var i$1 = 0; i$1 < ops.length; i$1++) // Write DOM (maybe)
    { endOperation_W1(ops[i$1]) }
  for (var i$2 = 0; i$2 < ops.length; i$2++) // Read DOM
    { endOperation_R2(ops[i$2]) }
  for (var i$3 = 0; i$3 < ops.length; i$3++) // Write DOM (maybe)
    { endOperation_W2(ops[i$3]) }
  for (var i$4 = 0; i$4 < ops.length; i$4++) // Read DOM
    { endOperation_finish(ops[i$4]) }
}

function endOperation_R1(op) {
  var cm = op.cm, display = cm.display
  maybeClipScrollbars(cm)
  if (op.updateMaxLine) { findMaxLine(cm) }

  op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
    op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
                       op.scrollToPos.to.line >= display.viewTo) ||
    display.maxLineChanged && cm.options.lineWrapping
  op.update = op.mustUpdate &&
    new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate)
}

function endOperation_W1(op) {
  op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update)
}

function endOperation_R2(op) {
  var cm = op.cm, display = cm.display
  if (op.updatedDisplay) { updateHeightsInViewport(cm) }

  op.barMeasure = measureForScrollbars(cm)

  // If the max line changed since it was last measured, measure it,
  // and ensure the document's width matches it.
  // updateDisplay_W2 will use these properties to do the actual resizing
  if (display.maxLineChanged && !cm.options.lineWrapping) {
    op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3
    cm.display.sizerWidth = op.adjustWidthTo
    op.barMeasure.scrollWidth =
      Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth)
    op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm))
  }

  if (op.updatedDisplay || op.selectionChanged)
    { op.preparedSelection = display.input.prepareSelection(op.focus) }
}

function endOperation_W2(op) {
  var cm = op.cm

  if (op.adjustWidthTo != null) {
    cm.display.sizer.style.minWidth = op.adjustWidthTo + "px"
    if (op.maxScrollLeft < cm.doc.scrollLeft)
      { setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true) }
    cm.display.maxLineChanged = false
  }

  var takeFocus = op.focus && op.focus == activeElt() && (!document.hasFocus || document.hasFocus())
  if (op.preparedSelection)
    { cm.display.input.showSelection(op.preparedSelection, takeFocus) }
  if (op.updatedDisplay || op.startHeight != cm.doc.height)
    { updateScrollbars(cm, op.barMeasure) }
  if (op.updatedDisplay)
    { setDocumentHeight(cm, op.barMeasure) }

  if (op.selectionChanged) { restartBlink(cm) }

  if (cm.state.focused && op.updateInput)
    { cm.display.input.reset(op.typing) }
  if (takeFocus) { ensureFocus(op.cm) }
}

function endOperation_finish(op) {
  var cm = op.cm, display = cm.display, doc = cm.doc

  if (op.updatedDisplay) { postUpdateDisplay(cm, op.update) }

  // Abort mouse wheel delta measurement, when scrolling explicitly
  if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
    { display.wheelStartX = display.wheelStartY = null }

  // Propagate the scroll position to the actual DOM scroller
  if (op.scrollTop != null && (display.scroller.scrollTop != op.scrollTop || op.forceScroll)) {
    doc.scrollTop = Math.max(0, Math.min(display.scroller.scrollHeight - display.scroller.clientHeight, op.scrollTop))
    display.scrollbars.setScrollTop(doc.scrollTop)
    display.scroller.scrollTop = doc.scrollTop
  }
  if (op.scrollLeft != null && (display.scroller.scrollLeft != op.scrollLeft || op.forceScroll)) {
    doc.scrollLeft = Math.max(0, Math.min(display.scroller.scrollWidth - display.scroller.clientWidth, op.scrollLeft))
    display.scrollbars.setScrollLeft(doc.scrollLeft)
    display.scroller.scrollLeft = doc.scrollLeft
    alignHorizontally(cm)
  }
  // If we need to scroll a specific position into view, do so.
  if (op.scrollToPos) {
    var coords = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
                                   clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin)
    if (op.scrollToPos.isCursor && cm.state.focused) { maybeScrollWindow(cm, coords) }
  }

  // Fire events for markers that are hidden/unidden by editing or
  // undoing
  var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers
  if (hidden) { for (var i = 0; i < hidden.length; ++i)
    { if (!hidden[i].lines.length) { signal(hidden[i], "hide") } } }
  if (unhidden) { for (var i$1 = 0; i$1 < unhidden.length; ++i$1)
    { if (unhidden[i$1].lines.length) { signal(unhidden[i$1], "unhide") } } }

  if (display.wrapper.offsetHeight)
    { doc.scrollTop = cm.display.scroller.scrollTop }

  // Fire change events, and delayed event handlers
  if (op.changeObjs)
    { signal(cm, "changes", cm, op.changeObjs) }
  if (op.update)
    { op.update.finish() }
}

// Run the given function in an operation
function runInOp(cm, f) {
  if (cm.curOp) { return f() }
  startOperation(cm)
  try { return f() }
  finally { endOperation(cm) }
}
// Wraps a function in an operation. Returns the wrapped function.
function operation(cm, f) {
  return function() {
    if (cm.curOp) { return f.apply(cm, arguments) }
    startOperation(cm)
    try { return f.apply(cm, arguments) }
    finally { endOperation(cm) }
  }
}
// Used to add methods to editor and doc instances, wrapping them in
// operations.
function methodOp(f) {
  return function() {
    if (this.curOp) { return f.apply(this, arguments) }
    startOperation(this)
    try { return f.apply(this, arguments) }
    finally { endOperation(this) }
  }
}
function docMethodOp(f) {
  return function() {
    var cm = this.cm
    if (!cm || cm.curOp) { return f.apply(this, arguments) }
    startOperation(cm)
    try { return f.apply(this, arguments) }
    finally { endOperation(cm) }
  }
}

// Updates the display.view data structure for a given change to the
// document. From and to are in pre-change coordinates. Lendiff is
// the amount of lines added or subtracted by the change. This is
// used for changes that span multiple lines, or change the way
// lines are divided into visual lines. regLineChange (below)
// registers single-line changes.
function regChange(cm, from, to, lendiff) {
  if (from == null) { from = cm.doc.first }
  if (to == null) { to = cm.doc.first + cm.doc.size }
  if (!lendiff) { lendiff = 0 }

  var display = cm.display
  if (lendiff && to < display.viewTo &&
      (display.updateLineNumbers == null || display.updateLineNumbers > from))
    { display.updateLineNumbers = from }

  cm.curOp.viewChanged = true

  if (from >= display.viewTo) { // Change after
    if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
      { resetView(cm) }
  } else if (to <= display.viewFrom) { // Change before
    if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
      resetView(cm)
    } else {
      display.viewFrom += lendiff
      display.viewTo += lendiff
    }
  } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
    resetView(cm)
  } else if (from <= display.viewFrom) { // Top overlap
    var cut = viewCuttingPoint(cm, to, to + lendiff, 1)
    if (cut) {
      display.view = display.view.slice(cut.index)
      display.viewFrom = cut.lineN
      display.viewTo += lendiff
    } else {
      resetView(cm)
    }
  } else if (to >= display.viewTo) { // Bottom overlap
    var cut$1 = viewCuttingPoint(cm, from, from, -1)
    if (cut$1) {
      display.view = display.view.slice(0, cut$1.index)
      display.viewTo = cut$1.lineN
    } else {
      resetView(cm)
    }
  } else { // Gap in the middle
    var cutTop = viewCuttingPoint(cm, from, from, -1)
    var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1)
    if (cutTop && cutBot) {
      display.view = display.view.slice(0, cutTop.index)
        .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
        .concat(display.view.slice(cutBot.index))
      display.viewTo += lendiff
    } else {
      resetView(cm)
    }
  }

  var ext = display.externalMeasured
  if (ext) {
    if (to < ext.lineN)
      { ext.lineN += lendiff }
    else if (from < ext.lineN + ext.size)
      { display.externalMeasured = null }
  }
}

// Register a change to a single line. Type must be one of "text",
// "gutter", "class", "widget"
function regLineChange(cm, line, type) {
  cm.curOp.viewChanged = true
  var display = cm.display, ext = cm.display.externalMeasured
  if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
    { display.externalMeasured = null }

  if (line < display.viewFrom || line >= display.viewTo) { return }
  var lineView = display.view[findViewIndex(cm, line)]
  if (lineView.node == null) { return }
  var arr = lineView.changes || (lineView.changes = [])
  if (indexOf(arr, type) == -1) { arr.push(type) }
}

// Clear the view.
function resetView(cm) {
  cm.display.viewFrom = cm.display.viewTo = cm.doc.first
  cm.display.view = []
  cm.display.viewOffset = 0
}

function viewCuttingPoint(cm, oldN, newN, dir) {
  var index = findViewIndex(cm, oldN), diff, view = cm.display.view
  if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
    { return {index: index, lineN: newN} }
  var n = cm.display.viewFrom
  for (var i = 0; i < index; i++)
    { n += view[i].size }
  if (n != oldN) {
    if (dir > 0) {
      if (index == view.length - 1) { return null }
      diff = (n + view[index].size) - oldN
      index++
    } else {
      diff = n - oldN
    }
    oldN += diff; newN += diff
  }
  while (visualLineNo(cm.doc, newN) != newN) {
    if (index == (dir < 0 ? 0 : view.length - 1)) { return null }
    newN += dir * view[index - (dir < 0 ? 1 : 0)].size
    index += dir
  }
  return {index: index, lineN: newN}
}

// Force the view to cover a given range, adding empty view element
// or clipping off existing ones as needed.
function adjustView(cm, from, to) {
  var display = cm.display, view = display.view
  if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
    display.view = buildViewArray(cm, from, to)
    display.viewFrom = from
  } else {
    if (display.viewFrom > from)
      { display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view) }
    else if (display.viewFrom < from)
      { display.view = display.view.slice(findViewIndex(cm, from)) }
    display.viewFrom = from
    if (display.viewTo < to)
      { display.view = display.view.concat(buildViewArray(cm, display.viewTo, to)) }
    else if (display.viewTo > to)
      { display.view = display.view.slice(0, findViewIndex(cm, to)) }
  }
  display.viewTo = to
}

// Count the number of lines in the view whose DOM representation is
// out of date (or nonexistent).
function countDirtyView(cm) {
  var view = cm.display.view, dirty = 0
  for (var i = 0; i < view.length; i++) {
    var lineView = view[i]
    if (!lineView.hidden && (!lineView.node || lineView.changes)) { ++dirty }
  }
  return dirty
}

// HIGHLIGHT WORKER

function startWorker(cm, time) {
  if (cm.doc.mode.startState && cm.doc.frontier < cm.display.viewTo)
    { cm.state.highlight.set(time, bind(highlightWorker, cm)) }
}

function highlightWorker(cm) {
  var doc = cm.doc
  if (doc.frontier < doc.first) { doc.frontier = doc.first }
  if (doc.frontier >= cm.display.viewTo) { return }
  var end = +new Date + cm.options.workTime
  var state = copyState(doc.mode, getStateBefore(cm, doc.frontier))
  var changedLines = []

  doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function (line) {
    if (doc.frontier >= cm.display.viewFrom) { // Visible
      var oldStyles = line.styles, tooLong = line.text.length > cm.options.maxHighlightLength
      var highlighted = highlightLine(cm, line, tooLong ? copyState(doc.mode, state) : state, true)
      line.styles = highlighted.styles
      var oldCls = line.styleClasses, newCls = highlighted.classes
      if (newCls) { line.styleClasses = newCls }
      else if (oldCls) { line.styleClasses = null }
      var ischange = !oldStyles || oldStyles.length != line.styles.length ||
        oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass)
      for (var i = 0; !ischange && i < oldStyles.length; ++i) { ischange = oldStyles[i] != line.styles[i] }
      if (ischange) { changedLines.push(doc.frontier) }
      line.stateAfter = tooLong ? state : copyState(doc.mode, state)
    } else {
      if (line.text.length <= cm.options.maxHighlightLength)
        { processLine(cm, line.text, state) }
      line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) : null
    }
    ++doc.frontier
    if (+new Date > end) {
      startWorker(cm, cm.options.workDelay)
      return true
    }
  })
  if (changedLines.length) { runInOp(cm, function () {
    for (var i = 0; i < changedLines.length; i++)
      { regLineChange(cm, changedLines[i], "text") }
  }) }
}

// DISPLAY DRAWING

function DisplayUpdate(cm, viewport, force) {
  var display = cm.display

  this.viewport = viewport
  // Store some values that we'll need later (but don't want to force a relayout for)
  this.visible = visibleLines(display, cm.doc, viewport)
  this.editorIsHidden = !display.wrapper.offsetWidth
  this.wrapperHeight = display.wrapper.clientHeight
  this.wrapperWidth = display.wrapper.clientWidth
  this.oldDisplayWidth = displayWidth(cm)
  this.force = force
  this.dims = getDimensions(cm)
  this.events = []
}

DisplayUpdate.prototype.signal = function(emitter, type) {
  if (hasHandler(emitter, type))
    { this.events.push(arguments) }
}
DisplayUpdate.prototype.finish = function() {
  var this$1 = this;

  for (var i = 0; i < this.events.length; i++)
    { signal.apply(null, this$1.events[i]) }
}

function maybeClipScrollbars(cm) {
  var display = cm.display
  if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
    display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth
    display.heightForcer.style.height = scrollGap(cm) + "px"
    display.sizer.style.marginBottom = -display.nativeBarWidth + "px"
    display.sizer.style.borderRightWidth = scrollGap(cm) + "px"
    display.scrollbarsClipped = true
  }
}

// Does the actual updating of the line display. Bails out
// (returning false) when there is nothing to be done and forced is
// false.
function updateDisplayIfNeeded(cm, update) {
  var display = cm.display, doc = cm.doc

  if (update.editorIsHidden) {
    resetView(cm)
    return false
  }

  // Bail out if the visible area is already rendered and nothing changed.
  if (!update.force &&
      update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
      display.renderedView == display.view && countDirtyView(cm) == 0)
    { return false }

  if (maybeUpdateLineNumberWidth(cm)) {
    resetView(cm)
    update.dims = getDimensions(cm)
  }

  // Compute a suitable new viewport (from & to)
  var end = doc.first + doc.size
  var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first)
  var to = Math.min(end, update.visible.to + cm.options.viewportMargin)
  if (display.viewFrom < from && from - display.viewFrom < 20) { from = Math.max(doc.first, display.viewFrom) }
  if (display.viewTo > to && display.viewTo - to < 20) { to = Math.min(end, display.viewTo) }
  if (sawCollapsedSpans) {
    from = visualLineNo(cm.doc, from)
    to = visualLineEndNo(cm.doc, to)
  }

  var different = from != display.viewFrom || to != display.viewTo ||
    display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth
  adjustView(cm, from, to)

  display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom))
  // Position the mover div to align with the current scroll position
  cm.display.mover.style.top = display.viewOffset + "px"

  var toUpdate = countDirtyView(cm)
  if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
    { return false }

  // For big changes, we hide the enclosing element during the
  // update, since that speeds up the operations on most browsers.
  var focused = activeElt()
  if (toUpdate > 4) { display.lineDiv.style.display = "none" }
  patchDisplay(cm, display.updateLineNumbers, update.dims)
  if (toUpdate > 4) { display.lineDiv.style.display = "" }
  display.renderedView = display.view
  // There might have been a widget with a focused element that got
  // hidden or updated, if so re-focus it.
  if (focused && activeElt() != focused && focused.offsetHeight) { focused.focus() }

  // Prevent selection and cursors from interfering with the scroll
  // width and height.
  removeChildren(display.cursorDiv)
  removeChildren(display.selectionDiv)
  display.gutters.style.height = display.sizer.style.minHeight = 0

  if (different) {
    display.lastWrapHeight = update.wrapperHeight
    display.lastWrapWidth = update.wrapperWidth
    startWorker(cm, 400)
  }

  display.updateLineNumbers = null

  return true
}

function postUpdateDisplay(cm, update) {
  var viewport = update.viewport

  for (var first = true;; first = false) {
    if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
      // Clip forced viewport to actual scrollable area.
      if (viewport && viewport.top != null)
        { viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)} }
      // Updated line heights might result in the drawn area not
      // actually covering the viewport. Keep looping until it does.
      update.visible = visibleLines(cm.display, cm.doc, viewport)
      if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
        { break }
    }
    if (!updateDisplayIfNeeded(cm, update)) { break }
    updateHeightsInViewport(cm)
    var barMeasure = measureForScrollbars(cm)
    updateSelection(cm)
    updateScrollbars(cm, barMeasure)
    setDocumentHeight(cm, barMeasure)
  }

  update.signal(cm, "update", cm)
  if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
    update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo)
    cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo
  }
}

function updateDisplaySimple(cm, viewport) {
  var update = new DisplayUpdate(cm, viewport)
  if (updateDisplayIfNeeded(cm, update)) {
    updateHeightsInViewport(cm)
    postUpdateDisplay(cm, update)
    var barMeasure = measureForScrollbars(cm)
    updateSelection(cm)
    updateScrollbars(cm, barMeasure)
    setDocumentHeight(cm, barMeasure)
    update.finish()
  }
}

// Sync the actual display DOM structure with display.view, removing
// nodes for lines that are no longer in view, and creating the ones
// that are not there yet, and updating the ones that are out of
// date.
function patchDisplay(cm, updateNumbersFrom, dims) {
  var display = cm.display, lineNumbers = cm.options.lineNumbers
  var container = display.lineDiv, cur = container.firstChild

  function rm(node) {
    var next = node.nextSibling
    // Works around a throw-scroll bug in OS X Webkit
    if (webkit && mac && cm.display.currentWheelTarget == node)
      { node.style.display = "none" }
    else
      { node.parentNode.removeChild(node) }
    return next
  }

  var view = display.view, lineN = display.viewFrom
  // Loop over the elements in the view, syncing cur (the DOM nodes
  // in display.lineDiv) with the view as we go.
  for (var i = 0; i < view.length; i++) {
    var lineView = view[i]
    if (lineView.hidden) {
    } else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
      var node = buildLineElement(cm, lineView, lineN, dims)
      container.insertBefore(node, cur)
    } else { // Already drawn
      while (cur != lineView.node) { cur = rm(cur) }
      var updateNumber = lineNumbers && updateNumbersFrom != null &&
        updateNumbersFrom <= lineN && lineView.lineNumber
      if (lineView.changes) {
        if (indexOf(lineView.changes, "gutter") > -1) { updateNumber = false }
        updateLineForChanges(cm, lineView, lineN, dims)
      }
      if (updateNumber) {
        removeChildren(lineView.lineNumber)
        lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)))
      }
      cur = lineView.node.nextSibling
    }
    lineN += lineView.size
  }
  while (cur) { cur = rm(cur) }
}

function updateGutterSpace(cm) {
  var width = cm.display.gutters.offsetWidth
  cm.display.sizer.style.marginLeft = width + "px"
}

function setDocumentHeight(cm, measure) {
  cm.display.sizer.style.minHeight = measure.docHeight + "px"
  cm.display.heightForcer.style.top = measure.docHeight + "px"
  cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + scrollGap(cm)) + "px"
}

// Rebuild the gutter elements, ensure the margin to the left of the
// code matches their width.
function updateGutters(cm) {
  var gutters = cm.display.gutters, specs = cm.options.gutters
  removeChildren(gutters)
  var i = 0
  for (; i < specs.length; ++i) {
    var gutterClass = specs[i]
    var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass))
    if (gutterClass == "CodeMirror-linenumbers") {
      cm.display.lineGutter = gElt
      gElt.style.width = (cm.display.lineNumWidth || 1) + "px"
    }
  }
  gutters.style.display = i ? "" : "none"
  updateGutterSpace(cm)
}

// Make sure the gutters options contains the element
// "CodeMirror-linenumbers" when the lineNumbers option is true.
function setGuttersForLineNumbers(options) {
  var found = indexOf(options.gutters, "CodeMirror-linenumbers")
  if (found == -1 && options.lineNumbers) {
    options.gutters = options.gutters.concat(["CodeMirror-linenumbers"])
  } else if (found > -1 && !options.lineNumbers) {
    options.gutters = options.gutters.slice(0)
    options.gutters.splice(found, 1)
  }
}

// Selection objects are immutable. A new one is created every time
// the selection changes. A selection is one or more non-overlapping
// (and non-touching) ranges, sorted, and an integer that indicates
// which one is the primary selection (the one that's scrolled into
// view, that getCursor returns, etc).
function Selection(ranges, primIndex) {
  this.ranges = ranges
  this.primIndex = primIndex
}

Selection.prototype = {
  primary: function() { return this.ranges[this.primIndex] },
  equals: function(other) {
    var this$1 = this;

    if (other == this) { return true }
    if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) { return false }
    for (var i = 0; i < this.ranges.length; i++) {
      var here = this$1.ranges[i], there = other.ranges[i]
      if (cmp(here.anchor, there.anchor) != 0 || cmp(here.head, there.head) != 0) { return false }
    }
    return true
  },
  deepCopy: function() {
    var this$1 = this;

    var out = []
    for (var i = 0; i < this.ranges.length; i++)
      { out[i] = new Range(copyPos(this$1.ranges[i].anchor), copyPos(this$1.ranges[i].head)) }
    return new Selection(out, this.primIndex)
  },
  somethingSelected: function() {
    var this$1 = this;

    for (var i = 0; i < this.ranges.length; i++)
      { if (!this$1.ranges[i].empty()) { return true } }
    return false
  },
  contains: function(pos, end) {
    var this$1 = this;

    if (!end) { end = pos }
    for (var i = 0; i < this.ranges.length; i++) {
      var range = this$1.ranges[i]
      if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
        { return i }
    }
    return -1
  }
}

function Range(anchor, head) {
  this.anchor = anchor; this.head = head
}

Range.prototype = {
  from: function() { return minPos(this.anchor, this.head) },
  to: function() { return maxPos(this.anchor, this.head) },
  empty: function() {
    return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch
  }
}

// Take an unsorted, potentially overlapping set of ranges, and
// build a selection out of it. 'Consumes' ranges array (modifying
// it).
function normalizeSelection(ranges, primIndex) {
  var prim = ranges[primIndex]
  ranges.sort(function (a, b) { return cmp(a.from(), b.from()); })
  primIndex = indexOf(ranges, prim)
  for (var i = 1; i < ranges.length; i++) {
    var cur = ranges[i], prev = ranges[i - 1]
    if (cmp(prev.to(), cur.from()) >= 0) {
      var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to())
      var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head
      if (i <= primIndex) { --primIndex }
      ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to))
    }
  }
  return new Selection(ranges, primIndex)
}

function simpleSelection(anchor, head) {
  return new Selection([new Range(anchor, head || anchor)], 0)
}

// Compute the position of the end of a change (its 'to' property
// refers to the pre-change end).
function changeEnd(change) {
  if (!change.text) { return change.to }
  return Pos(change.from.line + change.text.length - 1,
             lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0))
}

// Adjust a position to refer to the post-change position of the
// same text, or the end of the change if the change covers it.
function adjustForChange(pos, change) {
  if (cmp(pos, change.from) < 0) { return pos }
  if (cmp(pos, change.to) <= 0) { return changeEnd(change) }

  var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch
  if (pos.line == change.to.line) { ch += changeEnd(change).ch - change.to.ch }
  return Pos(line, ch)
}

function computeSelAfterChange(doc, change) {
  var out = []
  for (var i = 0; i < doc.sel.ranges.length; i++) {
    var range = doc.sel.ranges[i]
    out.push(new Range(adjustForChange(range.anchor, change),
                       adjustForChange(range.head, change)))
  }
  return normalizeSelection(out, doc.sel.primIndex)
}

function offsetPos(pos, old, nw) {
  if (pos.line == old.line)
    { return Pos(nw.line, pos.ch - old.ch + nw.ch) }
  else
    { return Pos(nw.line + (pos.line - old.line), pos.ch) }
}

// Used by replaceSelections to allow moving the selection to the
// start or around the replaced test. Hint may be "start" or "around".
function computeReplacedSel(doc, changes, hint) {
  var out = []
  var oldPrev = Pos(doc.first, 0), newPrev = oldPrev
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i]
    var from = offsetPos(change.from, oldPrev, newPrev)
    var to = offsetPos(changeEnd(change), oldPrev, newPrev)
    oldPrev = change.to
    newPrev = to
    if (hint == "around") {
      var range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0
      out[i] = new Range(inv ? to : from, inv ? from : to)
    } else {
      out[i] = new Range(from, from)
    }
  }
  return new Selection(out, doc.sel.primIndex)
}

// Used to get the editor into a consistent state again when options change.

function loadMode(cm) {
  cm.doc.mode = getMode(cm.options, cm.doc.modeOption)
  resetModeState(cm)
}

function resetModeState(cm) {
  cm.doc.iter(function (line) {
    if (line.stateAfter) { line.stateAfter = null }
    if (line.styles) { line.styles = null }
  })
  cm.doc.frontier = cm.doc.first
  startWorker(cm, 100)
  cm.state.modeGen++
  if (cm.curOp) { regChange(cm) }
}

// DOCUMENT DATA STRUCTURE

// By default, updates that start and end at the beginning of a line
// are treated specially, in order to make the association of line
// widgets and marker elements with the text behave more intuitive.
function isWholeLineUpdate(doc, change) {
  return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
    (!doc.cm || doc.cm.options.wholeLineUpdateBefore)
}

// Perform a change on the document data structure.
function updateDoc(doc, change, markedSpans, estimateHeight) {
  function spansFor(n) {return markedSpans ? markedSpans[n] : null}
  function update(line, text, spans) {
    updateLine(line, text, spans, estimateHeight)
    signalLater(line, "change", line, change)
  }
  function linesFor(start, end) {
    var result = []
    for (var i = start; i < end; ++i)
      { result.push(new Line(text[i], spansFor(i), estimateHeight)) }
    return result
  }

  var from = change.from, to = change.to, text = change.text
  var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line)
  var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line

  // Adjust the line structure
  if (change.full) {
    doc.insert(0, linesFor(0, text.length))
    doc.remove(text.length, doc.size - text.length)
  } else if (isWholeLineUpdate(doc, change)) {
    // This is a whole-line replace. Treated specially to make
    // sure line objects move the way they are supposed to.
    var added = linesFor(0, text.length - 1)
    update(lastLine, lastLine.text, lastSpans)
    if (nlines) { doc.remove(from.line, nlines) }
    if (added.length) { doc.insert(from.line, added) }
  } else if (firstLine == lastLine) {
    if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans)
    } else {
      var added$1 = linesFor(1, text.length - 1)
      added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight))
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0))
      doc.insert(from.line + 1, added$1)
    }
  } else if (text.length == 1) {
    update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0))
    doc.remove(from.line + 1, nlines)
  } else {
    update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0))
    update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans)
    var added$2 = linesFor(1, text.length - 1)
    if (nlines > 1) { doc.remove(from.line + 1, nlines - 1) }
    doc.insert(from.line + 1, added$2)
  }

  signalLater(doc, "change", doc, change)
}

// Call f for all linked documents.
function linkedDocs(doc, f, sharedHistOnly) {
  function propagate(doc, skip, sharedHist) {
    if (doc.linked) { for (var i = 0; i < doc.linked.length; ++i) {
      var rel = doc.linked[i]
      if (rel.doc == skip) { continue }
      var shared = sharedHist && rel.sharedHist
      if (sharedHistOnly && !shared) { continue }
      f(rel.doc, shared)
      propagate(rel.doc, doc, shared)
    } }
  }
  propagate(doc, null, true)
}

// Attach a document to an editor.
function attachDoc(cm, doc) {
  if (doc.cm) { throw new Error("This document is already in use.") }
  cm.doc = doc
  doc.cm = cm
  estimateLineHeights(cm)
  loadMode(cm)
  if (!cm.options.lineWrapping) { findMaxLine(cm) }
  cm.options.mode = doc.modeOption
  regChange(cm)
}

function History(startGen) {
  // Arrays of change events and selections. Doing something adds an
  // event to done and clears undo. Undoing moves events from done
  // to undone, redoing moves them in the other direction.
  this.done = []; this.undone = []
  this.undoDepth = Infinity
  // Used to track when changes can be merged into a single undo
  // event
  this.lastModTime = this.lastSelTime = 0
  this.lastOp = this.lastSelOp = null
  this.lastOrigin = this.lastSelOrigin = null
  // Used by the isClean() method
  this.generation = this.maxGeneration = startGen || 1
}

// Create a history change event from an updateDoc-style change
// object.
function historyChangeFromChange(doc, change) {
  var histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)}
  attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1)
  linkedDocs(doc, function (doc) { return attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1); }, true)
  return histChange
}

// Pop all selection events off the end of a history array. Stop at
// a change event.
function clearSelectionEvents(array) {
  while (array.length) {
    var last = lst(array)
    if (last.ranges) { array.pop() }
    else { break }
  }
}

// Find the top change event in the history. Pop off selection
// events that are in the way.
function lastChangeEvent(hist, force) {
  if (force) {
    clearSelectionEvents(hist.done)
    return lst(hist.done)
  } else if (hist.done.length && !lst(hist.done).ranges) {
    return lst(hist.done)
  } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
    hist.done.pop()
    return lst(hist.done)
  }
}

// Register a change in the history. Merges changes that are within
// a single operation, or are close together with an origin that
// allows merging (starting with "+") into a single event.
function addChangeToHistory(doc, change, selAfter, opId) {
  var hist = doc.history
  hist.undone.length = 0
  var time = +new Date, cur
  var last

  if ((hist.lastOp == opId ||
       hist.lastOrigin == change.origin && change.origin &&
       ((change.origin.charAt(0) == "+" && doc.cm && hist.lastModTime > time - doc.cm.options.historyEventDelay) ||
        change.origin.charAt(0) == "*")) &&
      (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
    // Merge this change into the last event
    last = lst(cur.changes)
    if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
      // Optimized case for simple insertion -- don't want to add
      // new changesets for every character typed
      last.to = changeEnd(change)
    } else {
      // Add new sub-event
      cur.changes.push(historyChangeFromChange(doc, change))
    }
  } else {
    // Can not be merged, start a new event.
    var before = lst(hist.done)
    if (!before || !before.ranges)
      { pushSelectionToHistory(doc.sel, hist.done) }
    cur = {changes: [historyChangeFromChange(doc, change)],
           generation: hist.generation}
    hist.done.push(cur)
    while (hist.done.length > hist.undoDepth) {
      hist.done.shift()
      if (!hist.done[0].ranges) { hist.done.shift() }
    }
  }
  hist.done.push(selAfter)
  hist.generation = ++hist.maxGeneration
  hist.lastModTime = hist.lastSelTime = time
  hist.lastOp = hist.lastSelOp = opId
  hist.lastOrigin = hist.lastSelOrigin = change.origin

  if (!last) { signal(doc, "historyAdded") }
}

function selectionEventCanBeMerged(doc, origin, prev, sel) {
  var ch = origin.charAt(0)
  return ch == "*" ||
    ch == "+" &&
    prev.ranges.length == sel.ranges.length &&
    prev.somethingSelected() == sel.somethingSelected() &&
    new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500)
}

// Called whenever the selection changes, sets the new selection as
// the pending selection in the history, and pushes the old pending
// selection into the 'done' array when it was significantly
// different (in number of selected ranges, emptiness, or time).
function addSelectionToHistory(doc, sel, opId, options) {
  var hist = doc.history, origin = options && options.origin

  // A new event is started when the previous origin does not match
  // the current, or the origins don't allow matching. Origins
  // starting with * are always merged, those starting with + are
  // merged when similar and close together in time.
  if (opId == hist.lastSelOp ||
      (origin && hist.lastSelOrigin == origin &&
       (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
        selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
    { hist.done[hist.done.length - 1] = sel }
  else
    { pushSelectionToHistory(sel, hist.done) }

  hist.lastSelTime = +new Date
  hist.lastSelOrigin = origin
  hist.lastSelOp = opId
  if (options && options.clearRedo !== false)
    { clearSelectionEvents(hist.undone) }
}

function pushSelectionToHistory(sel, dest) {
  var top = lst(dest)
  if (!(top && top.ranges && top.equals(sel)))
    { dest.push(sel) }
}

// Used to store marked span information in the history.
function attachLocalSpans(doc, change, from, to) {
  var existing = change["spans_" + doc.id], n = 0
  doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function (line) {
    if (line.markedSpans)
      { (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans }
    ++n
  })
}

// When un/re-doing restores text containing marked spans, those
// that have been explicitly cleared should not be restored.
function removeClearedSpans(spans) {
  if (!spans) { return null }
  var out
  for (var i = 0; i < spans.length; ++i) {
    if (spans[i].marker.explicitlyCleared) { if (!out) { out = spans.slice(0, i) } }
    else if (out) { out.push(spans[i]) }
  }
  return !out ? spans : out.length ? out : null
}

// Retrieve and filter the old marked spans stored in a change event.
function getOldSpans(doc, change) {
  var found = change["spans_" + doc.id]
  if (!found) { return null }
  var nw = []
  for (var i = 0; i < change.text.length; ++i)
    { nw.push(removeClearedSpans(found[i])) }
  return nw
}

// Used for un/re-doing changes from the history. Combines the
// result of computing the existing spans with the set of spans that
// existed in the history (so that deleting around a span and then
// undoing brings back the span).
function mergeOldSpans(doc, change) {
  var old = getOldSpans(doc, change)
  var stretched = stretchSpansOverChange(doc, change)
  if (!old) { return stretched }
  if (!stretched) { return old }

  for (var i = 0; i < old.length; ++i) {
    var oldCur = old[i], stretchCur = stretched[i]
    if (oldCur && stretchCur) {
      spans: for (var j = 0; j < stretchCur.length; ++j) {
        var span = stretchCur[j]
        for (var k = 0; k < oldCur.length; ++k)
          { if (oldCur[k].marker == span.marker) { continue spans } }
        oldCur.push(span)
      }
    } else if (stretchCur) {
      old[i] = stretchCur
    }
  }
  return old
}

// Used both to provide a JSON-safe object in .getHistory, and, when
// detaching a document, to split the history in two
function copyHistoryArray(events, newGroup, instantiateSel) {
  var copy = []
  for (var i = 0; i < events.length; ++i) {
    var event = events[i]
    if (event.ranges) {
      copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event)
      continue
    }
    var changes = event.changes, newChanges = []
    copy.push({changes: newChanges})
    for (var j = 0; j < changes.length; ++j) {
      var change = changes[j], m = void 0
      newChanges.push({from: change.from, to: change.to, text: change.text})
      if (newGroup) { for (var prop in change) { if (m = prop.match(/^spans_(\d+)$/)) {
        if (indexOf(newGroup, Number(m[1])) > -1) {
          lst(newChanges)[prop] = change[prop]
          delete change[prop]
        }
      } } }
    }
  }
  return copy
}

// The 'scroll' parameter given to many of these indicated whether
// the new cursor position should be scrolled into view after
// modifying the selection.

// If shift is held or the extend flag is set, extends a range to
// include a given position (and optionally a second position).
// Otherwise, simply returns the range between the given positions.
// Used for cursor motion and such.
function extendRange(doc, range, head, other) {
  if (doc.cm && doc.cm.display.shift || doc.extend) {
    var anchor = range.anchor
    if (other) {
      var posBefore = cmp(head, anchor) < 0
      if (posBefore != (cmp(other, anchor) < 0)) {
        anchor = head
        head = other
      } else if (posBefore != (cmp(head, other) < 0)) {
        head = other
      }
    }
    return new Range(anchor, head)
  } else {
    return new Range(other || head, head)
  }
}

// Extend the primary selection range, discard the rest.
function extendSelection(doc, head, other, options) {
  setSelection(doc, new Selection([extendRange(doc, doc.sel.primary(), head, other)], 0), options)
}

// Extend all selections (pos is an array of selections with length
// equal the number of selections)
function extendSelections(doc, heads, options) {
  var out = []
  for (var i = 0; i < doc.sel.ranges.length; i++)
    { out[i] = extendRange(doc, doc.sel.ranges[i], heads[i], null) }
  var newSel = normalizeSelection(out, doc.sel.primIndex)
  setSelection(doc, newSel, options)
}

// Updates a single range in the selection.
function replaceOneSelection(doc, i, range, options) {
  var ranges = doc.sel.ranges.slice(0)
  ranges[i] = range
  setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options)
}

// Reset the selection to a single range.
function setSimpleSelection(doc, anchor, head, options) {
  setSelection(doc, simpleSelection(anchor, head), options)
}

// Give beforeSelectionChange handlers a change to influence a
// selection update.
function filterSelectionChange(doc, sel, options) {
  var obj = {
    ranges: sel.ranges,
    update: function(ranges) {
      var this$1 = this;

      this.ranges = []
      for (var i = 0; i < ranges.length; i++)
        { this$1.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                   clipPos(doc, ranges[i].head)) }
    },
    origin: options && options.origin
  }
  signal(doc, "beforeSelectionChange", doc, obj)
  if (doc.cm) { signal(doc.cm, "beforeSelectionChange", doc.cm, obj) }
  if (obj.ranges != sel.ranges) { return normalizeSelection(obj.ranges, obj.ranges.length - 1) }
  else { return sel }
}

function setSelectionReplaceHistory(doc, sel, options) {
  var done = doc.history.done, last = lst(done)
  if (last && last.ranges) {
    done[done.length - 1] = sel
    setSelectionNoUndo(doc, sel, options)
  } else {
    setSelection(doc, sel, options)
  }
}

// Set a new selection.
function setSelection(doc, sel, options) {
  setSelectionNoUndo(doc, sel, options)
  addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options)
}

function setSelectionNoUndo(doc, sel, options) {
  if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
    { sel = filterSelectionChange(doc, sel, options) }

  var bias = options && options.bias ||
    (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1)
  setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true))

  if (!(options && options.scroll === false) && doc.cm)
    { ensureCursorVisible(doc.cm) }
}

function setSelectionInner(doc, sel) {
  if (sel.equals(doc.sel)) { return }

  doc.sel = sel

  if (doc.cm) {
    doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true
    signalCursorActivity(doc.cm)
  }
  signalLater(doc, "cursorActivity", doc)
}

// Verify that the selection does not partially select any atomic
// marked ranges.
function reCheckSelection(doc) {
  setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false), sel_dontScroll)
}

// Return a selection that does not partially select any atomic
// ranges.
function skipAtomicInSelection(doc, sel, bias, mayClear) {
  var out
  for (var i = 0; i < sel.ranges.length; i++) {
    var range = sel.ranges[i]
    var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i]
    var newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear)
    var newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear)
    if (out || newAnchor != range.anchor || newHead != range.head) {
      if (!out) { out = sel.ranges.slice(0, i) }
      out[i] = new Range(newAnchor, newHead)
    }
  }
  return out ? normalizeSelection(out, sel.primIndex) : sel
}

function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
  var line = getLine(doc, pos.line)
  if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
    var sp = line.markedSpans[i], m = sp.marker
    if ((sp.from == null || (m.inclusiveLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
        (sp.to == null || (m.inclusiveRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
      if (mayClear) {
        signal(m, "beforeCursorEnter")
        if (m.explicitlyCleared) {
          if (!line.markedSpans) { break }
          else {--i; continue}
        }
      }
      if (!m.atomic) { continue }

      if (oldPos) {
        var near = m.find(dir < 0 ? 1 : -1), diff = void 0
        if (dir < 0 ? m.inclusiveRight : m.inclusiveLeft)
          { near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null) }
        if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
          { return skipAtomicInner(doc, near, pos, dir, mayClear) }
      }

      var far = m.find(dir < 0 ? -1 : 1)
      if (dir < 0 ? m.inclusiveLeft : m.inclusiveRight)
        { far = movePos(doc, far, dir, far.line == pos.line ? line : null) }
      return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
    }
  } }
  return pos
}

// Ensure a given position is not inside an atomic range.
function skipAtomic(doc, pos, oldPos, bias, mayClear) {
  var dir = bias || 1
  var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
      skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true))
  if (!found) {
    doc.cantEdit = true
    return Pos(doc.first, 0)
  }
  return found
}

function movePos(doc, pos, dir, line) {
  if (dir < 0 && pos.ch == 0) {
    if (pos.line > doc.first) { return clipPos(doc, Pos(pos.line - 1)) }
    else { return null }
  } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
    if (pos.line < doc.first + doc.size - 1) { return Pos(pos.line + 1, 0) }
    else { return null }
  } else {
    return new Pos(pos.line, pos.ch + dir)
  }
}

function selectAll(cm) {
  cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll)
}

// UPDATING

// Allow "beforeChange" event handlers to influence a change
function filterChange(doc, change, update) {
  var obj = {
    canceled: false,
    from: change.from,
    to: change.to,
    text: change.text,
    origin: change.origin,
    cancel: function () { return obj.canceled = true; }
  }
  if (update) { obj.update = function (from, to, text, origin) {
    if (from) { obj.from = clipPos(doc, from) }
    if (to) { obj.to = clipPos(doc, to) }
    if (text) { obj.text = text }
    if (origin !== undefined) { obj.origin = origin }
  } }
  signal(doc, "beforeChange", doc, obj)
  if (doc.cm) { signal(doc.cm, "beforeChange", doc.cm, obj) }

  if (obj.canceled) { return null }
  return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin}
}

// Apply a change to a document, and add it to the document's
// history, and propagating it to all linked documents.
function makeChange(doc, change, ignoreReadOnly) {
  if (doc.cm) {
    if (!doc.cm.curOp) { return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly) }
    if (doc.cm.state.suppressEdits) { return }
  }

  if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
    change = filterChange(doc, change, true)
    if (!change) { return }
  }

  // Possibly split or suppress the update based on the presence
  // of read-only spans in its range.
  var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to)
  if (split) {
    for (var i = split.length - 1; i >= 0; --i)
      { makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text}) }
  } else {
    makeChangeInner(doc, change)
  }
}

function makeChangeInner(doc, change) {
  if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) { return }
  var selAfter = computeSelAfterChange(doc, change)
  addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN)

  makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change))
  var rebased = []

  linkedDocs(doc, function (doc, sharedHist) {
    if (!sharedHist && indexOf(rebased, doc.history) == -1) {
      rebaseHist(doc.history, change)
      rebased.push(doc.history)
    }
    makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change))
  })
}

// Revert a change stored in a document's history.
function makeChangeFromHistory(doc, type, allowSelectionOnly) {
  if (doc.cm && doc.cm.state.suppressEdits && !allowSelectionOnly) { return }

  var hist = doc.history, event, selAfter = doc.sel
  var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done

  // Verify that there is a useable event (so that ctrl-z won't
  // needlessly clear selection events)
  var i = 0
  for (; i < source.length; i++) {
    event = source[i]
    if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
      { break }
  }
  if (i == source.length) { return }
  hist.lastOrigin = hist.lastSelOrigin = null

  for (;;) {
    event = source.pop()
    if (event.ranges) {
      pushSelectionToHistory(event, dest)
      if (allowSelectionOnly && !event.equals(doc.sel)) {
        setSelection(doc, event, {clearRedo: false})
        return
      }
      selAfter = event
    }
    else { break }
  }

  // Build up a reverse change object to add to the opposite history
  // stack (redo when undoing, and vice versa).
  var antiChanges = []
  pushSelectionToHistory(selAfter, dest)
  dest.push({changes: antiChanges, generation: hist.generation})
  hist.generation = event.generation || ++hist.maxGeneration

  var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")

  var loop = function ( i ) {
    var change = event.changes[i]
    change.origin = type
    if (filter && !filterChange(doc, change, false)) {
      source.length = 0
      return {}
    }

    antiChanges.push(historyChangeFromChange(doc, change))

    var after = i ? computeSelAfterChange(doc, change) : lst(source)
    makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change))
    if (!i && doc.cm) { doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)}) }
    var rebased = []

    // Propagate to the linked documents
    linkedDocs(doc, function (doc, sharedHist) {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change)
        rebased.push(doc.history)
      }
      makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change))
    })
  };

  for (var i$1 = event.changes.length - 1; i$1 >= 0; --i$1) {
    var returned = loop( i$1 );

    if ( returned ) return returned.v;
  }
}

// Sub-views need their line numbers shifted when text is added
// above or below them in the parent document.
function shiftDoc(doc, distance) {
  if (distance == 0) { return }
  doc.first += distance
  doc.sel = new Selection(map(doc.sel.ranges, function (range) { return new Range(
    Pos(range.anchor.line + distance, range.anchor.ch),
    Pos(range.head.line + distance, range.head.ch)
  ); }), doc.sel.primIndex)
  if (doc.cm) {
    regChange(doc.cm, doc.first, doc.first - distance, distance)
    for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
      { regLineChange(doc.cm, l, "gutter") }
  }
}

// More lower-level change function, handling only a single document
// (not linked ones).
function makeChangeSingleDoc(doc, change, selAfter, spans) {
  if (doc.cm && !doc.cm.curOp)
    { return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans) }

  if (change.to.line < doc.first) {
    shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line))
    return
  }
  if (change.from.line > doc.lastLine()) { return }

  // Clip the change to the size of this doc
  if (change.from.line < doc.first) {
    var shift = change.text.length - 1 - (doc.first - change.from.line)
    shiftDoc(doc, shift)
    change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
              text: [lst(change.text)], origin: change.origin}
  }
  var last = doc.lastLine()
  if (change.to.line > last) {
    change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
              text: [change.text[0]], origin: change.origin}
  }

  change.removed = getBetween(doc, change.from, change.to)

  if (!selAfter) { selAfter = computeSelAfterChange(doc, change) }
  if (doc.cm) { makeChangeSingleDocInEditor(doc.cm, change, spans) }
  else { updateDoc(doc, change, spans) }
  setSelectionNoUndo(doc, selAfter, sel_dontScroll)
}

// Handle the interaction of a change to a document with the editor
// that this document is part of.
function makeChangeSingleDocInEditor(cm, change, spans) {
  var doc = cm.doc, display = cm.display, from = change.from, to = change.to

  var recomputeMaxLength = false, checkWidthStart = from.line
  if (!cm.options.lineWrapping) {
    checkWidthStart = lineNo(visualLine(getLine(doc, from.line)))
    doc.iter(checkWidthStart, to.line + 1, function (line) {
      if (line == display.maxLine) {
        recomputeMaxLength = true
        return true
      }
    })
  }

  if (doc.sel.contains(change.from, change.to) > -1)
    { signalCursorActivity(cm) }

  updateDoc(doc, change, spans, estimateHeight(cm))

  if (!cm.options.lineWrapping) {
    doc.iter(checkWidthStart, from.line + change.text.length, function (line) {
      var len = lineLength(line)
      if (len > display.maxLineLength) {
        display.maxLine = line
        display.maxLineLength = len
        display.maxLineChanged = true
        recomputeMaxLength = false
      }
    })
    if (recomputeMaxLength) { cm.curOp.updateMaxLine = true }
  }

  // Adjust frontier, schedule worker
  doc.frontier = Math.min(doc.frontier, from.line)
  startWorker(cm, 400)

  var lendiff = change.text.length - (to.line - from.line) - 1
  // Remember that these lines changed, for updating the display
  if (change.full)
    { regChange(cm) }
  else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
    { regLineChange(cm, from.line, "text") }
  else
    { regChange(cm, from.line, to.line + 1, lendiff) }

  var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change")
  if (changeHandler || changesHandler) {
    var obj = {
      from: from, to: to,
      text: change.text,
      removed: change.removed,
      origin: change.origin
    }
    if (changeHandler) { signalLater(cm, "change", cm, obj) }
    if (changesHandler) { (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj) }
  }
  cm.display.selForContextMenu = null
}

function replaceRange(doc, code, from, to, origin) {
  if (!to) { to = from }
  if (cmp(to, from) < 0) { var tmp = to; to = from; from = tmp }
  if (typeof code == "string") { code = doc.splitLines(code) }
  makeChange(doc, {from: from, to: to, text: code, origin: origin})
}

// Rebasing/resetting history to deal with externally-sourced changes

function rebaseHistSelSingle(pos, from, to, diff) {
  if (to < pos.line) {
    pos.line += diff
  } else if (from < pos.line) {
    pos.line = from
    pos.ch = 0
  }
}

// Tries to rebase an array of history events given a change in the
// document. If the change touches the same lines as the event, the
// event, and everything 'behind' it, is discarded. If the change is
// before the event, the event's positions are updated. Uses a
// copy-on-write scheme for the positions, to avoid having to
// reallocate them all on every rebase, but also avoid problems with
// shared position objects being unsafely updated.
function rebaseHistArray(array, from, to, diff) {
  for (var i = 0; i < array.length; ++i) {
    var sub = array[i], ok = true
    if (sub.ranges) {
      if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true }
      for (var j = 0; j < sub.ranges.length; j++) {
        rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff)
        rebaseHistSelSingle(sub.ranges[j].head, from, to, diff)
      }
      continue
    }
    for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
      var cur = sub.changes[j$1]
      if (to < cur.from.line) {
        cur.from = Pos(cur.from.line + diff, cur.from.ch)
        cur.to = Pos(cur.to.line + diff, cur.to.ch)
      } else if (from <= cur.to.line) {
        ok = false
        break
      }
    }
    if (!ok) {
      array.splice(0, i + 1)
      i = 0
    }
  }
}

function rebaseHist(hist, change) {
  var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1
  rebaseHistArray(hist.done, from, to, diff)
  rebaseHistArray(hist.undone, from, to, diff)
}

// Utility for applying a change to a line by handle or number,
// returning the number and optionally registering the line as
// changed.
function changeLine(doc, handle, changeType, op) {
  var no = handle, line = handle
  if (typeof handle == "number") { line = getLine(doc, clipLine(doc, handle)) }
  else { no = lineNo(handle) }
  if (no == null) { return null }
  if (op(line, no) && doc.cm) { regLineChange(doc.cm, no, changeType) }
  return line
}

// The document is represented as a BTree consisting of leaves, with
// chunk of lines in them, and branches, with up to ten leaves or
// other branch nodes below them. The top node is always a branch
// node, and is the document object itself (meaning it has
// additional methods and properties).
//
// All nodes have parent links. The tree is used both to go from
// line numbers to line objects, and to go from objects to numbers.
// It also indexes by height, and is used to convert between height
// and line object, and to find the total height of the document.
//
// See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

function LeafChunk(lines) {
  var this$1 = this;

  this.lines = lines
  this.parent = null
  var height = 0
  for (var i = 0; i < lines.length; ++i) {
    lines[i].parent = this$1
    height += lines[i].height
  }
  this.height = height
}

LeafChunk.prototype = {
  chunkSize: function() { return this.lines.length },
  // Remove the n lines at offset 'at'.
  removeInner: function(at, n) {
    var this$1 = this;

    for (var i = at, e = at + n; i < e; ++i) {
      var line = this$1.lines[i]
      this$1.height -= line.height
      cleanUpLine(line)
      signalLater(line, "delete")
    }
    this.lines.splice(at, n)
  },
  // Helper used to collapse a small branch into a single leaf.
  collapse: function(lines) {
    lines.push.apply(lines, this.lines)
  },
  // Insert the given array of lines at offset 'at', count them as
  // having the given height.
  insertInner: function(at, lines, height) {
    var this$1 = this;

    this.height += height
    this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at))
    for (var i = 0; i < lines.length; ++i) { lines[i].parent = this$1 }
  },
  // Used to iterate over a part of the tree.
  iterN: function(at, n, op) {
    var this$1 = this;

    for (var e = at + n; at < e; ++at)
      { if (op(this$1.lines[at])) { return true } }
  }
}

function BranchChunk(children) {
  var this$1 = this;

  this.children = children
  var size = 0, height = 0
  for (var i = 0; i < children.length; ++i) {
    var ch = children[i]
    size += ch.chunkSize(); height += ch.height
    ch.parent = this$1
  }
  this.size = size
  this.height = height
  this.parent = null
}

BranchChunk.prototype = {
  chunkSize: function() { return this.size },
  removeInner: function(at, n) {
    var this$1 = this;

    this.size -= n
    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at < sz) {
        var rm = Math.min(n, sz - at), oldHeight = child.height
        child.removeInner(at, rm)
        this$1.height -= oldHeight - child.height
        if (sz == rm) { this$1.children.splice(i--, 1); child.parent = null }
        if ((n -= rm) == 0) { break }
        at = 0
      } else { at -= sz }
    }
    // If the result is smaller than 25 lines, ensure that it is a
    // single leaf node.
    if (this.size - n < 25 &&
        (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
      var lines = []
      this.collapse(lines)
      this.children = [new LeafChunk(lines)]
      this.children[0].parent = this
    }
  },
  collapse: function(lines) {
    var this$1 = this;

    for (var i = 0; i < this.children.length; ++i) { this$1.children[i].collapse(lines) }
  },
  insertInner: function(at, lines, height) {
    var this$1 = this;

    this.size += lines.length
    this.height += height
    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at <= sz) {
        child.insertInner(at, lines, height)
        if (child.lines && child.lines.length > 50) {
          // To avoid memory thrashing when child.lines is huge (e.g. first view of a large file), it's never spliced.
          // Instead, small slices are taken. They're taken in order because sequential memory accesses are fastest.
          var remaining = child.lines.length % 25 + 25
          for (var pos = remaining; pos < child.lines.length;) {
            var leaf = new LeafChunk(child.lines.slice(pos, pos += 25))
            child.height -= leaf.height
            this$1.children.splice(++i, 0, leaf)
            leaf.parent = this$1
          }
          child.lines = child.lines.slice(0, remaining)
          this$1.maybeSpill()
        }
        break
      }
      at -= sz
    }
  },
  // When a node has grown, check whether it should be split.
  maybeSpill: function() {
    if (this.children.length <= 10) { return }
    var me = this
    do {
      var spilled = me.children.splice(me.children.length - 5, 5)
      var sibling = new BranchChunk(spilled)
      if (!me.parent) { // Become the parent node
        var copy = new BranchChunk(me.children)
        copy.parent = me
        me.children = [copy, sibling]
        me = copy
     } else {
        me.size -= sibling.size
        me.height -= sibling.height
        var myIndex = indexOf(me.parent.children, me)
        me.parent.children.splice(myIndex + 1, 0, sibling)
      }
      sibling.parent = me.parent
    } while (me.children.length > 10)
    me.parent.maybeSpill()
  },
  iterN: function(at, n, op) {
    var this$1 = this;

    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at < sz) {
        var used = Math.min(n, sz - at)
        if (child.iterN(at, used, op)) { return true }
        if ((n -= used) == 0) { break }
        at = 0
      } else { at -= sz }
    }
  }
}

// Line widgets are block elements displayed above or below a line.

function LineWidget(doc, node, options) {
  var this$1 = this;

  if (options) { for (var opt in options) { if (options.hasOwnProperty(opt))
    { this$1[opt] = options[opt] } } }
  this.doc = doc
  this.node = node
}
eventMixin(LineWidget)

function adjustScrollWhenAboveVisible(cm, line, diff) {
  if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
    { addToScrollPos(cm, null, diff) }
}

LineWidget.prototype.clear = function() {
  var this$1 = this;

  var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line)
  if (no == null || !ws) { return }
  for (var i = 0; i < ws.length; ++i) { if (ws[i] == this$1) { ws.splice(i--, 1) } }
  if (!ws.length) { line.widgets = null }
  var height = widgetHeight(this)
  updateLineHeight(line, Math.max(0, line.height - height))
  if (cm) { runInOp(cm, function () {
    adjustScrollWhenAboveVisible(cm, line, -height)
    regLineChange(cm, no, "widget")
  }) }
}
LineWidget.prototype.changed = function() {
  var oldH = this.height, cm = this.doc.cm, line = this.line
  this.height = null
  var diff = widgetHeight(this) - oldH
  if (!diff) { return }
  updateLineHeight(line, line.height + diff)
  if (cm) { runInOp(cm, function () {
    cm.curOp.forceUpdate = true
    adjustScrollWhenAboveVisible(cm, line, diff)
  }) }
}

function addLineWidget(doc, handle, node, options) {
  var widget = new LineWidget(doc, node, options)
  var cm = doc.cm
  if (cm && widget.noHScroll) { cm.display.alignWidgets = true }
  changeLine(doc, handle, "widget", function (line) {
    var widgets = line.widgets || (line.widgets = [])
    if (widget.insertAt == null) { widgets.push(widget) }
    else { widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget) }
    widget.line = line
    if (cm && !lineIsHidden(doc, line)) {
      var aboveVisible = heightAtLine(line) < doc.scrollTop
      updateLineHeight(line, line.height + widgetHeight(widget))
      if (aboveVisible) { addToScrollPos(cm, null, widget.height) }
      cm.curOp.forceUpdate = true
    }
    return true
  })
  return widget
}

// TEXTMARKERS

// Created with markText and setBookmark methods. A TextMarker is a
// handle that can be used to clear or find a marked position in the
// document. Line objects hold arrays (markedSpans) containing
// {from, to, marker} object pointing to such marker objects, and
// indicating that such a marker is present on that line. Multiple
// lines may point to the same marker when it spans across lines.
// The spans will have null for their from/to properties when the
// marker continues beyond the start/end of the line. Markers have
// links back to the lines they currently touch.

// Collapsed markers have unique ids, in order to be able to order
// them, which is needed for uniquely determining an outer marker
// when they overlap (they may nest, but not partially overlap).
var nextMarkerId = 0

function TextMarker(doc, type) {
  this.lines = []
  this.type = type
  this.doc = doc
  this.id = ++nextMarkerId
}
eventMixin(TextMarker)

// Clear the marker.
TextMarker.prototype.clear = function() {
  var this$1 = this;

  if (this.explicitlyCleared) { return }
  var cm = this.doc.cm, withOp = cm && !cm.curOp
  if (withOp) { startOperation(cm) }
  if (hasHandler(this, "clear")) {
    var found = this.find()
    if (found) { signalLater(this, "clear", found.from, found.to) }
  }
  var min = null, max = null
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this$1.lines[i]
    var span = getMarkedSpanFor(line.markedSpans, this$1)
    if (cm && !this$1.collapsed) { regLineChange(cm, lineNo(line), "text") }
    else if (cm) {
      if (span.to != null) { max = lineNo(line) }
      if (span.from != null) { min = lineNo(line) }
    }
    line.markedSpans = removeMarkedSpan(line.markedSpans, span)
    if (span.from == null && this$1.collapsed && !lineIsHidden(this$1.doc, line) && cm)
      { updateLineHeight(line, textHeight(cm.display)) }
  }
  if (cm && this.collapsed && !cm.options.lineWrapping) { for (var i$1 = 0; i$1 < this.lines.length; ++i$1) {
    var visual = visualLine(this$1.lines[i$1]), len = lineLength(visual)
    if (len > cm.display.maxLineLength) {
      cm.display.maxLine = visual
      cm.display.maxLineLength = len
      cm.display.maxLineChanged = true
    }
  } }

  if (min != null && cm && this.collapsed) { regChange(cm, min, max + 1) }
  this.lines.length = 0
  this.explicitlyCleared = true
  if (this.atomic && this.doc.cantEdit) {
    this.doc.cantEdit = false
    if (cm) { reCheckSelection(cm.doc) }
  }
  if (cm) { signalLater(cm, "markerCleared", cm, this) }
  if (withOp) { endOperation(cm) }
  if (this.parent) { this.parent.clear() }
}

// Find the position of the marker in the document. Returns a {from,
// to} object by default. Side can be passed to get a specific side
// -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
// Pos objects returned contain a line object, rather than a line
// number (used to prevent looking up the same line twice).
TextMarker.prototype.find = function(side, lineObj) {
  var this$1 = this;

  if (side == null && this.type == "bookmark") { side = 1 }
  var from, to
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this$1.lines[i]
    var span = getMarkedSpanFor(line.markedSpans, this$1)
    if (span.from != null) {
      from = Pos(lineObj ? line : lineNo(line), span.from)
      if (side == -1) { return from }
    }
    if (span.to != null) {
      to = Pos(lineObj ? line : lineNo(line), span.to)
      if (side == 1) { return to }
    }
  }
  return from && {from: from, to: to}
}

// Signals that the marker's widget changed, and surrounding layout
// should be recomputed.
TextMarker.prototype.changed = function() {
  var pos = this.find(-1, true), widget = this, cm = this.doc.cm
  if (!pos || !cm) { return }
  runInOp(cm, function () {
    var line = pos.line, lineN = lineNo(pos.line)
    var view = findViewForLine(cm, lineN)
    if (view) {
      clearLineMeasurementCacheFor(view)
      cm.curOp.selectionChanged = cm.curOp.forceUpdate = true
    }
    cm.curOp.updateMaxLine = true
    if (!lineIsHidden(widget.doc, line) && widget.height != null) {
      var oldHeight = widget.height
      widget.height = null
      var dHeight = widgetHeight(widget) - oldHeight
      if (dHeight)
        { updateLineHeight(line, line.height + dHeight) }
    }
  })
}

TextMarker.prototype.attachLine = function(line) {
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp
    if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
      { (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this) }
  }
  this.lines.push(line)
}
TextMarker.prototype.detachLine = function(line) {
  this.lines.splice(indexOf(this.lines, line), 1)
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp
    ;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this)
  }
}

// Create a marker, wire it up to the right lines, and
function markText(doc, from, to, options, type) {
  // Shared markers (across linked documents) are handled separately
  // (markTextShared will call out to this again, once per
  // document).
  if (options && options.shared) { return markTextShared(doc, from, to, options, type) }
  // Ensure we are in an operation.
  if (doc.cm && !doc.cm.curOp) { return operation(doc.cm, markText)(doc, from, to, options, type) }

  var marker = new TextMarker(doc, type), diff = cmp(from, to)
  if (options) { copyObj(options, marker, false) }
  // Don't connect empty markers unless clearWhenEmpty is false
  if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
    { return marker }
  if (marker.replacedWith) {
    // Showing up as a widget implies collapsed (widget replaces text)
    marker.collapsed = true
    marker.widgetNode = elt("span", [marker.replacedWith], "CodeMirror-widget")
    if (!options.handleMouseEvents) { marker.widgetNode.setAttribute("cm-ignore-events", "true") }
    if (options.insertLeft) { marker.widgetNode.insertLeft = true }
  }
  if (marker.collapsed) {
    if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
        from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
      { throw new Error("Inserting collapsed marker partially overlapping an existing one") }
    seeCollapsedSpans()
  }

  if (marker.addToHistory)
    { addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN) }

  var curLine = from.line, cm = doc.cm, updateMaxLine
  doc.iter(curLine, to.line + 1, function (line) {
    if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
      { updateMaxLine = true }
    if (marker.collapsed && curLine != from.line) { updateLineHeight(line, 0) }
    addMarkedSpan(line, new MarkedSpan(marker,
                                       curLine == from.line ? from.ch : null,
                                       curLine == to.line ? to.ch : null))
    ++curLine
  })
  // lineIsHidden depends on the presence of the spans, so needs a second pass
  if (marker.collapsed) { doc.iter(from.line, to.line + 1, function (line) {
    if (lineIsHidden(doc, line)) { updateLineHeight(line, 0) }
  }) }

  if (marker.clearOnEnter) { on(marker, "beforeCursorEnter", function () { return marker.clear(); }) }

  if (marker.readOnly) {
    seeReadOnlySpans()
    if (doc.history.done.length || doc.history.undone.length)
      { doc.clearHistory() }
  }
  if (marker.collapsed) {
    marker.id = ++nextMarkerId
    marker.atomic = true
  }
  if (cm) {
    // Sync editor state
    if (updateMaxLine) { cm.curOp.updateMaxLine = true }
    if (marker.collapsed)
      { regChange(cm, from.line, to.line + 1) }
    else if (marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)
      { for (var i = from.line; i <= to.line; i++) { regLineChange(cm, i, "text") } }
    if (marker.atomic) { reCheckSelection(cm.doc) }
    signalLater(cm, "markerAdded", cm, marker)
  }
  return marker
}

// SHARED TEXTMARKERS

// A shared marker spans multiple linked documents. It is
// implemented as a meta-marker-object controlling multiple normal
// markers.
function SharedTextMarker(markers, primary) {
  var this$1 = this;

  this.markers = markers
  this.primary = primary
  for (var i = 0; i < markers.length; ++i)
    { markers[i].parent = this$1 }
}
eventMixin(SharedTextMarker)

SharedTextMarker.prototype.clear = function() {
  var this$1 = this;

  if (this.explicitlyCleared) { return }
  this.explicitlyCleared = true
  for (var i = 0; i < this.markers.length; ++i)
    { this$1.markers[i].clear() }
  signalLater(this, "clear")
}
SharedTextMarker.prototype.find = function(side, lineObj) {
  return this.primary.find(side, lineObj)
}

function markTextShared(doc, from, to, options, type) {
  options = copyObj(options)
  options.shared = false
  var markers = [markText(doc, from, to, options, type)], primary = markers[0]
  var widget = options.widgetNode
  linkedDocs(doc, function (doc) {
    if (widget) { options.widgetNode = widget.cloneNode(true) }
    markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type))
    for (var i = 0; i < doc.linked.length; ++i)
      { if (doc.linked[i].isParent) { return } }
    primary = lst(markers)
  })
  return new SharedTextMarker(markers, primary)
}

function findSharedMarkers(doc) {
  return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function (m) { return m.parent; })
}

function copySharedMarkers(doc, markers) {
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i], pos = marker.find()
    var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to)
    if (cmp(mFrom, mTo)) {
      var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type)
      marker.markers.push(subMark)
      subMark.parent = marker
    }
  }
}

function detachSharedMarkers(markers) {
  var loop = function ( i ) {
    var marker = markers[i], linked = [marker.primary.doc]
    linkedDocs(marker.primary.doc, function (d) { return linked.push(d); })
    for (var j = 0; j < marker.markers.length; j++) {
      var subMarker = marker.markers[j]
      if (indexOf(linked, subMarker.doc) == -1) {
        subMarker.parent = null
        marker.markers.splice(j--, 1)
      }
    }
  };

  for (var i = 0; i < markers.length; i++) loop( i );
}

var nextDocId = 0
var Doc = function(text, mode, firstLine, lineSep) {
  if (!(this instanceof Doc)) { return new Doc(text, mode, firstLine, lineSep) }
  if (firstLine == null) { firstLine = 0 }

  BranchChunk.call(this, [new LeafChunk([new Line("", null)])])
  this.first = firstLine
  this.scrollTop = this.scrollLeft = 0
  this.cantEdit = false
  this.cleanGeneration = 1
  this.frontier = firstLine
  var start = Pos(firstLine, 0)
  this.sel = simpleSelection(start)
  this.history = new History(null)
  this.id = ++nextDocId
  this.modeOption = mode
  this.lineSep = lineSep
  this.extend = false

  if (typeof text == "string") { text = this.splitLines(text) }
  updateDoc(this, {from: start, to: start, text: text})
  setSelection(this, simpleSelection(start), sel_dontScroll)
}

Doc.prototype = createObj(BranchChunk.prototype, {
  constructor: Doc,
  // Iterate over the document. Supports two forms -- with only one
  // argument, it calls that for each line in the document. With
  // three, it iterates over the range given by the first two (with
  // the second being non-inclusive).
  iter: function(from, to, op) {
    if (op) { this.iterN(from - this.first, to - from, op) }
    else { this.iterN(this.first, this.first + this.size, from) }
  },

  // Non-public interface for adding and removing lines.
  insert: function(at, lines) {
    var height = 0
    for (var i = 0; i < lines.length; ++i) { height += lines[i].height }
    this.insertInner(at - this.first, lines, height)
  },
  remove: function(at, n) { this.removeInner(at - this.first, n) },

  // From here, the methods are part of the public interface. Most
  // are also available from CodeMirror (editor) instances.

  getValue: function(lineSep) {
    var lines = getLines(this, this.first, this.first + this.size)
    if (lineSep === false) { return lines }
    return lines.join(lineSep || this.lineSeparator())
  },
  setValue: docMethodOp(function(code) {
    var top = Pos(this.first, 0), last = this.first + this.size - 1
    makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                      text: this.splitLines(code), origin: "setValue", full: true}, true)
    setSelection(this, simpleSelection(top))
  }),
  replaceRange: function(code, from, to, origin) {
    from = clipPos(this, from)
    to = to ? clipPos(this, to) : from
    replaceRange(this, code, from, to, origin)
  },
  getRange: function(from, to, lineSep) {
    var lines = getBetween(this, clipPos(this, from), clipPos(this, to))
    if (lineSep === false) { return lines }
    return lines.join(lineSep || this.lineSeparator())
  },

  getLine: function(line) {var l = this.getLineHandle(line); return l && l.text},

  getLineHandle: function(line) {if (isLine(this, line)) { return getLine(this, line) }},
  getLineNumber: function(line) {return lineNo(line)},

  getLineHandleVisualStart: function(line) {
    if (typeof line == "number") { line = getLine(this, line) }
    return visualLine(line)
  },

  lineCount: function() {return this.size},
  firstLine: function() {return this.first},
  lastLine: function() {return this.first + this.size - 1},

  clipPos: function(pos) {return clipPos(this, pos)},

  getCursor: function(start) {
    var range = this.sel.primary(), pos
    if (start == null || start == "head") { pos = range.head }
    else if (start == "anchor") { pos = range.anchor }
    else if (start == "end" || start == "to" || start === false) { pos = range.to() }
    else { pos = range.from() }
    return pos
  },
  listSelections: function() { return this.sel.ranges },
  somethingSelected: function() {return this.sel.somethingSelected()},

  setCursor: docMethodOp(function(line, ch, options) {
    setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options)
  }),
  setSelection: docMethodOp(function(anchor, head, options) {
    setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options)
  }),
  extendSelection: docMethodOp(function(head, other, options) {
    extendSelection(this, clipPos(this, head), other && clipPos(this, other), options)
  }),
  extendSelections: docMethodOp(function(heads, options) {
    extendSelections(this, clipPosArray(this, heads), options)
  }),
  extendSelectionsBy: docMethodOp(function(f, options) {
    var heads = map(this.sel.ranges, f)
    extendSelections(this, clipPosArray(this, heads), options)
  }),
  setSelections: docMethodOp(function(ranges, primary, options) {
    var this$1 = this;

    if (!ranges.length) { return }
    var out = []
    for (var i = 0; i < ranges.length; i++)
      { out[i] = new Range(clipPos(this$1, ranges[i].anchor),
                         clipPos(this$1, ranges[i].head)) }
    if (primary == null) { primary = Math.min(ranges.length - 1, this.sel.primIndex) }
    setSelection(this, normalizeSelection(out, primary), options)
  }),
  addSelection: docMethodOp(function(anchor, head, options) {
    var ranges = this.sel.ranges.slice(0)
    ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)))
    setSelection(this, normalizeSelection(ranges, ranges.length - 1), options)
  }),

  getSelection: function(lineSep) {
    var this$1 = this;

    var ranges = this.sel.ranges, lines
    for (var i = 0; i < ranges.length; i++) {
      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to())
      lines = lines ? lines.concat(sel) : sel
    }
    if (lineSep === false) { return lines }
    else { return lines.join(lineSep || this.lineSeparator()) }
  },
  getSelections: function(lineSep) {
    var this$1 = this;

    var parts = [], ranges = this.sel.ranges
    for (var i = 0; i < ranges.length; i++) {
      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to())
      if (lineSep !== false) { sel = sel.join(lineSep || this$1.lineSeparator()) }
      parts[i] = sel
    }
    return parts
  },
  replaceSelection: function(code, collapse, origin) {
    var dup = []
    for (var i = 0; i < this.sel.ranges.length; i++)
      { dup[i] = code }
    this.replaceSelections(dup, collapse, origin || "+input")
  },
  replaceSelections: docMethodOp(function(code, collapse, origin) {
    var this$1 = this;

    var changes = [], sel = this.sel
    for (var i = 0; i < sel.ranges.length; i++) {
      var range = sel.ranges[i]
      changes[i] = {from: range.from(), to: range.to(), text: this$1.splitLines(code[i]), origin: origin}
    }
    var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse)
    for (var i$1 = changes.length - 1; i$1 >= 0; i$1--)
      { makeChange(this$1, changes[i$1]) }
    if (newSel) { setSelectionReplaceHistory(this, newSel) }
    else if (this.cm) { ensureCursorVisible(this.cm) }
  }),
  undo: docMethodOp(function() {makeChangeFromHistory(this, "undo")}),
  redo: docMethodOp(function() {makeChangeFromHistory(this, "redo")}),
  undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true)}),
  redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true)}),

  setExtending: function(val) {this.extend = val},
  getExtending: function() {return this.extend},

  historySize: function() {
    var hist = this.history, done = 0, undone = 0
    for (var i = 0; i < hist.done.length; i++) { if (!hist.done[i].ranges) { ++done } }
    for (var i$1 = 0; i$1 < hist.undone.length; i$1++) { if (!hist.undone[i$1].ranges) { ++undone } }
    return {undo: done, redo: undone}
  },
  clearHistory: function() {this.history = new History(this.history.maxGeneration)},

  markClean: function() {
    this.cleanGeneration = this.changeGeneration(true)
  },
  changeGeneration: function(forceSplit) {
    if (forceSplit)
      { this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null }
    return this.history.generation
  },
  isClean: function (gen) {
    return this.history.generation == (gen || this.cleanGeneration)
  },

  getHistory: function() {
    return {done: copyHistoryArray(this.history.done),
            undone: copyHistoryArray(this.history.undone)}
  },
  setHistory: function(histData) {
    var hist = this.history = new History(this.history.maxGeneration)
    hist.done = copyHistoryArray(histData.done.slice(0), null, true)
    hist.undone = copyHistoryArray(histData.undone.slice(0), null, true)
  },

  addLineClass: docMethodOp(function(handle, where, cls) {
    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
      var prop = where == "text" ? "textClass"
               : where == "background" ? "bgClass"
               : where == "gutter" ? "gutterClass" : "wrapClass"
      if (!line[prop]) { line[prop] = cls }
      else if (classTest(cls).test(line[prop])) { return false }
      else { line[prop] += " " + cls }
      return true
    })
  }),
  removeLineClass: docMethodOp(function(handle, where, cls) {
    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
      var prop = where == "text" ? "textClass"
               : where == "background" ? "bgClass"
               : where == "gutter" ? "gutterClass" : "wrapClass"
      var cur = line[prop]
      if (!cur) { return false }
      else if (cls == null) { line[prop] = null }
      else {
        var found = cur.match(classTest(cls))
        if (!found) { return false }
        var end = found.index + found[0].length
        line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null
      }
      return true
    })
  }),

  addLineWidget: docMethodOp(function(handle, node, options) {
    return addLineWidget(this, handle, node, options)
  }),
  removeLineWidget: function(widget) { widget.clear() },

  markText: function(from, to, options) {
    return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range")
  },
  setBookmark: function(pos, options) {
    var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                    insertLeft: options && options.insertLeft,
                    clearWhenEmpty: false, shared: options && options.shared,
                    handleMouseEvents: options && options.handleMouseEvents}
    pos = clipPos(this, pos)
    return markText(this, pos, pos, realOpts, "bookmark")
  },
  findMarksAt: function(pos) {
    pos = clipPos(this, pos)
    var markers = [], spans = getLine(this, pos.line).markedSpans
    if (spans) { for (var i = 0; i < spans.length; ++i) {
      var span = spans[i]
      if ((span.from == null || span.from <= pos.ch) &&
          (span.to == null || span.to >= pos.ch))
        { markers.push(span.marker.parent || span.marker) }
    } }
    return markers
  },
  findMarks: function(from, to, filter) {
    from = clipPos(this, from); to = clipPos(this, to)
    var found = [], lineNo = from.line
    this.iter(from.line, to.line + 1, function (line) {
      var spans = line.markedSpans
      if (spans) { for (var i = 0; i < spans.length; i++) {
        var span = spans[i]
        if (!(span.to != null && lineNo == from.line && from.ch >= span.to ||
              span.from == null && lineNo != from.line ||
              span.from != null && lineNo == to.line && span.from >= to.ch) &&
            (!filter || filter(span.marker)))
          { found.push(span.marker.parent || span.marker) }
      } }
      ++lineNo
    })
    return found
  },
  getAllMarks: function() {
    var markers = []
    this.iter(function (line) {
      var sps = line.markedSpans
      if (sps) { for (var i = 0; i < sps.length; ++i)
        { if (sps[i].from != null) { markers.push(sps[i].marker) } } }
    })
    return markers
  },

  posFromIndex: function(off) {
    var ch, lineNo = this.first, sepSize = this.lineSeparator().length
    this.iter(function (line) {
      var sz = line.text.length + sepSize
      if (sz > off) { ch = off; return true }
      off -= sz
      ++lineNo
    })
    return clipPos(this, Pos(lineNo, ch))
  },
  indexFromPos: function (coords) {
    coords = clipPos(this, coords)
    var index = coords.ch
    if (coords.line < this.first || coords.ch < 0) { return 0 }
    var sepSize = this.lineSeparator().length
    this.iter(this.first, coords.line, function (line) { // iter aborts when callback returns a truthy value
      index += line.text.length + sepSize
    })
    return index
  },

  copy: function(copyHistory) {
    var doc = new Doc(getLines(this, this.first, this.first + this.size),
                      this.modeOption, this.first, this.lineSep)
    doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft
    doc.sel = this.sel
    doc.extend = false
    if (copyHistory) {
      doc.history.undoDepth = this.history.undoDepth
      doc.setHistory(this.getHistory())
    }
    return doc
  },

  linkedDoc: function(options) {
    if (!options) { options = {} }
    var from = this.first, to = this.first + this.size
    if (options.from != null && options.from > from) { from = options.from }
    if (options.to != null && options.to < to) { to = options.to }
    var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep)
    if (options.sharedHist) { copy.history = this.history
    ; }(this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist})
    copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}]
    copySharedMarkers(copy, findSharedMarkers(this))
    return copy
  },
  unlinkDoc: function(other) {
    var this$1 = this;

    if (other instanceof CodeMirror) { other = other.doc }
    if (this.linked) { for (var i = 0; i < this.linked.length; ++i) {
      var link = this$1.linked[i]
      if (link.doc != other) { continue }
      this$1.linked.splice(i, 1)
      other.unlinkDoc(this$1)
      detachSharedMarkers(findSharedMarkers(this$1))
      break
    } }
    // If the histories were shared, split them again
    if (other.history == this.history) {
      var splitIds = [other.id]
      linkedDocs(other, function (doc) { return splitIds.push(doc.id); }, true)
      other.history = new History(null)
      other.history.done = copyHistoryArray(this.history.done, splitIds)
      other.history.undone = copyHistoryArray(this.history.undone, splitIds)
    }
  },
  iterLinkedDocs: function(f) {linkedDocs(this, f)},

  getMode: function() {return this.mode},
  getEditor: function() {return this.cm},

  splitLines: function(str) {
    if (this.lineSep) { return str.split(this.lineSep) }
    return splitLinesAuto(str)
  },
  lineSeparator: function() { return this.lineSep || "\n" }
})

// Public alias.
Doc.prototype.eachLine = Doc.prototype.iter

// Kludge to work around strange IE behavior where it'll sometimes
// re-fire a series of drag-related events right after the drop (#1551)
var lastDrop = 0

function onDrop(e) {
  var cm = this
  clearDragCursor(cm)
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
    { return }
  e_preventDefault(e)
  if (ie) { lastDrop = +new Date }
  var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files
  if (!pos || cm.isReadOnly()) { return }
  // Might be a file drop, in which case we simply extract the text
  // and insert it.
  if (files && files.length && window.FileReader && window.File) {
    var n = files.length, text = Array(n), read = 0
    var loadFile = function (file, i) {
      if (cm.options.allowDropFileTypes &&
          indexOf(cm.options.allowDropFileTypes, file.type) == -1)
        { return }

      var reader = new FileReader
      reader.onload = operation(cm, function () {
        var content = reader.result
        if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) { content = "" }
        text[i] = content
        if (++read == n) {
          pos = clipPos(cm.doc, pos)
          var change = {from: pos, to: pos,
                        text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                        origin: "paste"}
          makeChange(cm.doc, change)
          setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)))
        }
      })
      reader.readAsText(file)
    }
    for (var i = 0; i < n; ++i) { loadFile(files[i], i) }
  } else { // Normal drop
    // Don't do a replace if the drop happened inside of the selected text.
    if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
      cm.state.draggingText(e)
      // Ensure the editor is re-focused
      setTimeout(function () { return cm.display.input.focus(); }, 20)
      return
    }
    try {
      var text$1 = e.dataTransfer.getData("Text")
      if (text$1) {
        var selected
        if (cm.state.draggingText && !cm.state.draggingText.copy)
          { selected = cm.listSelections() }
        setSelectionNoUndo(cm.doc, simpleSelection(pos, pos))
        if (selected) { for (var i$1 = 0; i$1 < selected.length; ++i$1)
          { replaceRange(cm.doc, "", selected[i$1].anchor, selected[i$1].head, "drag") } }
        cm.replaceSelection(text$1, "around", "paste")
        cm.display.input.focus()
      }
    }
    catch(e){}
  }
}

function onDragStart(cm, e) {
  if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return }
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) { return }

  e.dataTransfer.setData("Text", cm.getSelection())
  e.dataTransfer.effectAllowed = "copyMove"

  // Use dummy image instead of default browsers image.
  // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
  if (e.dataTransfer.setDragImage && !safari) {
    var img = elt("img", null, null, "position: fixed; left: 0; top: 0;")
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
    if (presto) {
      img.width = img.height = 1
      cm.display.wrapper.appendChild(img)
      // Force a relayout, or Opera won't use our image for some obscure reason
      img._top = img.offsetTop
    }
    e.dataTransfer.setDragImage(img, 0, 0)
    if (presto) { img.parentNode.removeChild(img) }
  }
}

function onDragOver(cm, e) {
  var pos = posFromMouse(cm, e)
  if (!pos) { return }
  var frag = document.createDocumentFragment()
  drawSelectionCursor(cm, pos, frag)
  if (!cm.display.dragCursor) {
    cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors")
    cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv)
  }
  removeChildrenAndAdd(cm.display.dragCursor, frag)
}

function clearDragCursor(cm) {
  if (cm.display.dragCursor) {
    cm.display.lineSpace.removeChild(cm.display.dragCursor)
    cm.display.dragCursor = null
  }
}

// These must be handled carefully, because naively registering a
// handler for each editor will cause the editors to never be
// garbage collected.

function forEachCodeMirror(f) {
  if (!document.body.getElementsByClassName) { return }
  var byClass = document.body.getElementsByClassName("CodeMirror")
  for (var i = 0; i < byClass.length; i++) {
    var cm = byClass[i].CodeMirror
    if (cm) { f(cm) }
  }
}

var globalsRegistered = false
function ensureGlobalHandlers() {
  if (globalsRegistered) { return }
  registerGlobalHandlers()
  globalsRegistered = true
}
function registerGlobalHandlers() {
  // When the window resizes, we need to refresh active editors.
  var resizeTimer
  on(window, "resize", function () {
    if (resizeTimer == null) { resizeTimer = setTimeout(function () {
      resizeTimer = null
      forEachCodeMirror(onResize)
    }, 100) }
  })
  // When the window loses focus, we want to show the editor as blurred
  on(window, "blur", function () { return forEachCodeMirror(onBlur); })
}
// Called when the window resizes
function onResize(cm) {
  var d = cm.display
  if (d.lastWrapHeight == d.wrapper.clientHeight && d.lastWrapWidth == d.wrapper.clientWidth)
    { return }
  // Might be a text scaling operation, clear size caches.
  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null
  d.scrollbarsClipped = false
  cm.setSize()
}

var keyNames = {
  3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
  46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
  106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 127: "Delete",
  173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
  221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
  63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
}

// Number keys
for (var i = 0; i < 10; i++) { keyNames[i + 48] = keyNames[i + 96] = String(i) }
// Alphabetic keys
for (var i$1 = 65; i$1 <= 90; i$1++) { keyNames[i$1] = String.fromCharCode(i$1) }
// Function keys
for (var i$2 = 1; i$2 <= 12; i$2++) { keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2 }

var keyMap = {}

keyMap.basic = {
  "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
  "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
  "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
  "Tab": "defaultTab", "Shift-Tab": "indentAuto",
  "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
  "Esc": "singleSelection"
}
// Note that the save and find-related commands aren't defined by
// default. User code or addons can define them. Unknown commands
// are simply ignored.
keyMap.pcDefault = {
  "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
  "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
  "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
  "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
  "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
  "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
  "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
  fallthrough: "basic"
}
// Very basic readline/emacs-style bindings, which are standard on Mac.
keyMap.emacsy = {
  "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
  "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
  "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
  "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
  "Ctrl-O": "openLine"
}
keyMap.macDefault = {
  "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
  "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
  "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
  "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
  "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
  "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
  "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
  fallthrough: ["basic", "emacsy"]
}
keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault

// KEYMAP DISPATCH

function normalizeKeyName(name) {
  var parts = name.split(/-(?!$)/)
  name = parts[parts.length - 1]
  var alt, ctrl, shift, cmd
  for (var i = 0; i < parts.length - 1; i++) {
    var mod = parts[i]
    if (/^(cmd|meta|m)$/i.test(mod)) { cmd = true }
    else if (/^a(lt)?$/i.test(mod)) { alt = true }
    else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true }
    else if (/^s(hift)?$/i.test(mod)) { shift = true }
    else { throw new Error("Unrecognized modifier name: " + mod) }
  }
  if (alt) { name = "Alt-" + name }
  if (ctrl) { name = "Ctrl-" + name }
  if (cmd) { name = "Cmd-" + name }
  if (shift) { name = "Shift-" + name }
  return name
}

// This is a kludge to keep keymaps mostly working as raw objects
// (backwards compatibility) while at the same time support features
// like normalization and multi-stroke key bindings. It compiles a
// new normalized keymap, and then updates the old object to reflect
// this.
function normalizeKeyMap(keymap) {
  var copy = {}
  for (var keyname in keymap) { if (keymap.hasOwnProperty(keyname)) {
    var value = keymap[keyname]
    if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) { continue }
    if (value == "...") { delete keymap[keyname]; continue }

    var keys = map(keyname.split(" "), normalizeKeyName)
    for (var i = 0; i < keys.length; i++) {
      var val = void 0, name = void 0
      if (i == keys.length - 1) {
        name = keys.join(" ")
        val = value
      } else {
        name = keys.slice(0, i + 1).join(" ")
        val = "..."
      }
      var prev = copy[name]
      if (!prev) { copy[name] = val }
      else if (prev != val) { throw new Error("Inconsistent bindings for " + name) }
    }
    delete keymap[keyname]
  } }
  for (var prop in copy) { keymap[prop] = copy[prop] }
  return keymap
}

function lookupKey(key, map, handle, context) {
  map = getKeyMap(map)
  var found = map.call ? map.call(key, context) : map[key]
  if (found === false) { return "nothing" }
  if (found === "...") { return "multi" }
  if (found != null && handle(found)) { return "handled" }

  if (map.fallthrough) {
    if (Object.prototype.toString.call(map.fallthrough) != "[object Array]")
      { return lookupKey(key, map.fallthrough, handle, context) }
    for (var i = 0; i < map.fallthrough.length; i++) {
      var result = lookupKey(key, map.fallthrough[i], handle, context)
      if (result) { return result }
    }
  }
}

// Modifier key presses don't count as 'real' key presses for the
// purpose of keymap fallthrough.
function isModifierKey(value) {
  var name = typeof value == "string" ? value : keyNames[value.keyCode]
  return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod"
}

// Look up the name of a key as indicated by an event object.
function keyName(event, noShift) {
  if (presto && event.keyCode == 34 && event["char"]) { return false }
  var base = keyNames[event.keyCode], name = base
  if (name == null || event.altGraphKey) { return false }
  if (event.altKey && base != "Alt") { name = "Alt-" + name }
  if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") { name = "Ctrl-" + name }
  if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") { name = "Cmd-" + name }
  if (!noShift && event.shiftKey && base != "Shift") { name = "Shift-" + name }
  return name
}

function getKeyMap(val) {
  return typeof val == "string" ? keyMap[val] : val
}

// Helper for deleting text near the selection(s), used to implement
// backspace, delete, and similar functionality.
function deleteNearSelection(cm, compute) {
  var ranges = cm.doc.sel.ranges, kill = []
  // Build up a set of ranges to kill first, merging overlapping
  // ranges.
  for (var i = 0; i < ranges.length; i++) {
    var toKill = compute(ranges[i])
    while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
      var replaced = kill.pop()
      if (cmp(replaced.from, toKill.from) < 0) {
        toKill.from = replaced.from
        break
      }
    }
    kill.push(toKill)
  }
  // Next, remove those actual ranges.
  runInOp(cm, function () {
    for (var i = kill.length - 1; i >= 0; i--)
      { replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete") }
    ensureCursorVisible(cm)
  })
}

// Commands are parameter-less actions that can be performed on an
// editor, mostly used for keybindings.
var commands = {
  selectAll: selectAll,
  singleSelection: function (cm) { return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll); },
  killLine: function (cm) { return deleteNearSelection(cm, function (range) {
    if (range.empty()) {
      var len = getLine(cm.doc, range.head.line).text.length
      if (range.head.ch == len && range.head.line < cm.lastLine())
        { return {from: range.head, to: Pos(range.head.line + 1, 0)} }
      else
        { return {from: range.head, to: Pos(range.head.line, len)} }
    } else {
      return {from: range.from(), to: range.to()}
    }
  }); },
  deleteLine: function (cm) { return deleteNearSelection(cm, function (range) { return ({
    from: Pos(range.from().line, 0),
    to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
  }); }); },
  delLineLeft: function (cm) { return deleteNearSelection(cm, function (range) { return ({
    from: Pos(range.from().line, 0), to: range.from()
  }); }); },
  delWrappedLineLeft: function (cm) { return deleteNearSelection(cm, function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    var leftPos = cm.coordsChar({left: 0, top: top}, "div")
    return {from: leftPos, to: range.from()}
  }); },
  delWrappedLineRight: function (cm) { return deleteNearSelection(cm, function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    var rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
    return {from: range.from(), to: rightPos }
  }); },
  undo: function (cm) { return cm.undo(); },
  redo: function (cm) { return cm.redo(); },
  undoSelection: function (cm) { return cm.undoSelection(); },
  redoSelection: function (cm) { return cm.redoSelection(); },
  goDocStart: function (cm) { return cm.extendSelection(Pos(cm.firstLine(), 0)); },
  goDocEnd: function (cm) { return cm.extendSelection(Pos(cm.lastLine())); },
  goLineStart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStart(cm, range.head.line); },
    {origin: "+move", bias: 1}
  ); },
  goLineStartSmart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStartSmart(cm, range.head); },
    {origin: "+move", bias: 1}
  ); },
  goLineEnd: function (cm) { return cm.extendSelectionsBy(function (range) { return lineEnd(cm, range.head.line); },
    {origin: "+move", bias: -1}
  ); },
  goLineRight: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
  }, sel_move); },
  goLineLeft: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    return cm.coordsChar({left: 0, top: top}, "div")
  }, sel_move); },
  goLineLeftSmart: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    var pos = cm.coordsChar({left: 0, top: top}, "div")
    if (pos.ch < cm.getLine(pos.line).search(/\S/)) { return lineStartSmart(cm, range.head) }
    return pos
  }, sel_move); },
  goLineUp: function (cm) { return cm.moveV(-1, "line"); },
  goLineDown: function (cm) { return cm.moveV(1, "line"); },
  goPageUp: function (cm) { return cm.moveV(-1, "page"); },
  goPageDown: function (cm) { return cm.moveV(1, "page"); },
  goCharLeft: function (cm) { return cm.moveH(-1, "char"); },
  goCharRight: function (cm) { return cm.moveH(1, "char"); },
  goColumnLeft: function (cm) { return cm.moveH(-1, "column"); },
  goColumnRight: function (cm) { return cm.moveH(1, "column"); },
  goWordLeft: function (cm) { return cm.moveH(-1, "word"); },
  goGroupRight: function (cm) { return cm.moveH(1, "group"); },
  goGroupLeft: function (cm) { return cm.moveH(-1, "group"); },
  goWordRight: function (cm) { return cm.moveH(1, "word"); },
  delCharBefore: function (cm) { return cm.deleteH(-1, "char"); },
  delCharAfter: function (cm) { return cm.deleteH(1, "char"); },
  delWordBefore: function (cm) { return cm.deleteH(-1, "word"); },
  delWordAfter: function (cm) { return cm.deleteH(1, "word"); },
  delGroupBefore: function (cm) { return cm.deleteH(-1, "group"); },
  delGroupAfter: function (cm) { return cm.deleteH(1, "group"); },
  indentAuto: function (cm) { return cm.indentSelection("smart"); },
  indentMore: function (cm) { return cm.indentSelection("add"); },
  indentLess: function (cm) { return cm.indentSelection("subtract"); },
  insertTab: function (cm) { return cm.replaceSelection("\t"); },
  insertSoftTab: function (cm) {
    var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].from()
      var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize)
      spaces.push(spaceStr(tabSize - col % tabSize))
    }
    cm.replaceSelections(spaces)
  },
  defaultTab: function (cm) {
    if (cm.somethingSelected()) { cm.indentSelection("add") }
    else { cm.execCommand("insertTab") }
  },
  // Swap the two chars left and right of each selection's head.
  // Move cursor behind the two swapped characters afterwards.
  //
  // Doesn't consider line feeds a character.
  // Doesn't scan more than one line above to find a character.
  // Doesn't do anything on an empty line.
  // Doesn't do anything with non-empty selections.
  transposeChars: function (cm) { return runInOp(cm, function () {
    var ranges = cm.listSelections(), newSel = []
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) { continue }
      var cur = ranges[i].head, line = getLine(cm.doc, cur.line).text
      if (line) {
        if (cur.ch == line.length) { cur = new Pos(cur.line, cur.ch - 1) }
        if (cur.ch > 0) {
          cur = new Pos(cur.line, cur.ch + 1)
          cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
                          Pos(cur.line, cur.ch - 2), cur, "+transpose")
        } else if (cur.line > cm.doc.first) {
          var prev = getLine(cm.doc, cur.line - 1).text
          if (prev) {
            cur = new Pos(cur.line, 1)
            cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
                            prev.charAt(prev.length - 1),
                            Pos(cur.line - 1, prev.length - 1), cur, "+transpose")
          }
        }
      }
      newSel.push(new Range(cur, cur))
    }
    cm.setSelections(newSel)
  }); },
  newlineAndIndent: function (cm) { return runInOp(cm, function () {
    var sels = cm.listSelections()
    for (var i = sels.length - 1; i >= 0; i--)
      { cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input") }
    sels = cm.listSelections()
    for (var i$1 = 0; i$1 < sels.length; i$1++)
      { cm.indentLine(sels[i$1].from().line, null, true) }
    ensureCursorVisible(cm)
  }); },
  openLine: function (cm) { return cm.replaceSelection("\n", "start"); },
  toggleOverwrite: function (cm) { return cm.toggleOverwrite(); }
}


function lineStart(cm, lineN) {
  var line = getLine(cm.doc, lineN)
  var visual = visualLine(line)
  if (visual != line) { lineN = lineNo(visual) }
  var order = getOrder(visual)
  var ch = !order ? 0 : order[0].level % 2 ? lineRight(visual) : lineLeft(visual)
  return Pos(lineN, ch)
}
function lineEnd(cm, lineN) {
  var merged, line = getLine(cm.doc, lineN)
  while (merged = collapsedSpanAtEnd(line)) {
    line = merged.find(1, true).line
    lineN = null
  }
  var order = getOrder(line)
  var ch = !order ? line.text.length : order[0].level % 2 ? lineLeft(line) : lineRight(line)
  return Pos(lineN == null ? lineNo(line) : lineN, ch)
}
function lineStartSmart(cm, pos) {
  var start = lineStart(cm, pos.line)
  var line = getLine(cm.doc, start.line)
  var order = getOrder(line)
  if (!order || order[0].level == 0) {
    var firstNonWS = Math.max(0, line.text.search(/\S/))
    var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch
    return Pos(start.line, inWS ? 0 : firstNonWS)
  }
  return start
}

// Run a handler that was bound to a key.
function doHandleBinding(cm, bound, dropShift) {
  if (typeof bound == "string") {
    bound = commands[bound]
    if (!bound) { return false }
  }
  // Ensure previous input has been read, so that the handler sees a
  // consistent view of the document
  cm.display.input.ensurePolled()
  var prevShift = cm.display.shift, done = false
  try {
    if (cm.isReadOnly()) { cm.state.suppressEdits = true }
    if (dropShift) { cm.display.shift = false }
    done = bound(cm) != Pass
  } finally {
    cm.display.shift = prevShift
    cm.state.suppressEdits = false
  }
  return done
}

function lookupKeyForEditor(cm, name, handle) {
  for (var i = 0; i < cm.state.keyMaps.length; i++) {
    var result = lookupKey(name, cm.state.keyMaps[i], handle, cm)
    if (result) { return result }
  }
  return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
    || lookupKey(name, cm.options.keyMap, handle, cm)
}

var stopSeq = new Delayed
function dispatchKey(cm, name, e, handle) {
  var seq = cm.state.keySeq
  if (seq) {
    if (isModifierKey(name)) { return "handled" }
    stopSeq.set(50, function () {
      if (cm.state.keySeq == seq) {
        cm.state.keySeq = null
        cm.display.input.reset()
      }
    })
    name = seq + " " + name
  }
  var result = lookupKeyForEditor(cm, name, handle)

  if (result == "multi")
    { cm.state.keySeq = name }
  if (result == "handled")
    { signalLater(cm, "keyHandled", cm, name, e) }

  if (result == "handled" || result == "multi") {
    e_preventDefault(e)
    restartBlink(cm)
  }

  if (seq && !result && /\'$/.test(name)) {
    e_preventDefault(e)
    return true
  }
  return !!result
}

// Handle a key from the keydown event.
function handleKeyBinding(cm, e) {
  var name = keyName(e, true)
  if (!name) { return false }

  if (e.shiftKey && !cm.state.keySeq) {
    // First try to resolve full name (including 'Shift-'). Failing
    // that, see if there is a cursor-motion command (starting with
    // 'go') bound to the keyname without 'Shift-'.
    return dispatchKey(cm, "Shift-" + name, e, function (b) { return doHandleBinding(cm, b, true); })
        || dispatchKey(cm, name, e, function (b) {
             if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
               { return doHandleBinding(cm, b) }
           })
  } else {
    return dispatchKey(cm, name, e, function (b) { return doHandleBinding(cm, b); })
  }
}

// Handle a key from the keypress event
function handleCharBinding(cm, e, ch) {
  return dispatchKey(cm, "'" + ch + "'", e, function (b) { return doHandleBinding(cm, b, true); })
}

var lastStoppedKey = null
function onKeyDown(e) {
  var cm = this
  cm.curOp.focus = activeElt()
  if (signalDOMEvent(cm, e)) { return }
  // IE does strange things with escape.
  if (ie && ie_version < 11 && e.keyCode == 27) { e.returnValue = false }
  var code = e.keyCode
  cm.display.shift = code == 16 || e.shiftKey
  var handled = handleKeyBinding(cm, e)
  if (presto) {
    lastStoppedKey = handled ? code : null
    // Opera has no cut event... we try to at least catch the key combo
    if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
      { cm.replaceSelection("", null, "cut") }
  }

  // Turn mouse into crosshair when Alt is held on Mac.
  if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
    { showCrossHair(cm) }
}

function showCrossHair(cm) {
  var lineDiv = cm.display.lineDiv
  addClass(lineDiv, "CodeMirror-crosshair")

  function up(e) {
    if (e.keyCode == 18 || !e.altKey) {
      rmClass(lineDiv, "CodeMirror-crosshair")
      off(document, "keyup", up)
      off(document, "mouseover", up)
    }
  }
  on(document, "keyup", up)
  on(document, "mouseover", up)
}

function onKeyUp(e) {
  if (e.keyCode == 16) { this.doc.sel.shift = false }
  signalDOMEvent(this, e)
}

function onKeyPress(e) {
  var cm = this
  if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) { return }
  var keyCode = e.keyCode, charCode = e.charCode
  if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
  if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) { return }
  var ch = String.fromCharCode(charCode == null ? keyCode : charCode)
  // Some browsers fire keypress events for backspace
  if (ch == "\x08") { return }
  if (handleCharBinding(cm, e, ch)) { return }
  cm.display.input.onKeyPress(e)
}

// A mouse down can be a single click, double click, triple click,
// start of selection drag, start of text drag, new cursor
// (ctrl-click), rectangle drag (alt-drag), or xwin
// middle-click-paste. Or it might be a click on something we should
// not interfere with, such as a scrollbar or widget.
function onMouseDown(e) {
  var cm = this, display = cm.display
  if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) { return }
  display.shift = e.shiftKey

  if (eventInWidget(display, e)) {
    if (!webkit) {
      // Briefly turn off draggability, to allow widgets to do
      // normal dragging things.
      display.scroller.draggable = false
      setTimeout(function () { return display.scroller.draggable = true; }, 100)
    }
    return
  }
  if (clickInGutter(cm, e)) { return }
  var start = posFromMouse(cm, e)
  window.focus()

  switch (e_button(e)) {
  case 1:
    // #3261: make sure, that we're not starting a second selection
    if (cm.state.selectingText)
      { cm.state.selectingText(e) }
    else if (start)
      { leftButtonDown(cm, e, start) }
    else if (e_target(e) == display.scroller)
      { e_preventDefault(e) }
    break
  case 2:
    if (webkit) { cm.state.lastMiddleDown = +new Date }
    if (start) { extendSelection(cm.doc, start) }
    setTimeout(function () { return display.input.focus(); }, 20)
    e_preventDefault(e)
    break
  case 3:
    if (captureRightClick) { onContextMenu(cm, e) }
    else { delayBlurEvent(cm) }
    break
  }
}

var lastClick;
var lastDoubleClick;
function leftButtonDown(cm, e, start) {
  if (ie) { setTimeout(bind(ensureFocus, cm), 0) }
  else { cm.curOp.focus = activeElt() }

  var now = +new Date, type
  if (lastDoubleClick && lastDoubleClick.time > now - 400 && cmp(lastDoubleClick.pos, start) == 0) {
    type = "triple"
  } else if (lastClick && lastClick.time > now - 400 && cmp(lastClick.pos, start) == 0) {
    type = "double"
    lastDoubleClick = {time: now, pos: start}
  } else {
    type = "single"
    lastClick = {time: now, pos: start}
  }

  var sel = cm.doc.sel, modifier = mac ? e.metaKey : e.ctrlKey, contained
  if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
      type == "single" && (contained = sel.contains(start)) > -1 &&
      (cmp((contained = sel.ranges[contained]).from(), start) < 0 || start.xRel > 0) &&
      (cmp(contained.to(), start) > 0 || start.xRel < 0))
    { leftButtonStartDrag(cm, e, start, modifier) }
  else
    { leftButtonSelect(cm, e, start, type, modifier) }
}

// Start a text drag. When it ends, see if any dragging actually
// happen, and treat as a click if it didn't.
function leftButtonStartDrag(cm, e, start, modifier) {
  var display = cm.display, startTime = +new Date
  var dragEnd = operation(cm, function (e2) {
    if (webkit) { display.scroller.draggable = false }
    cm.state.draggingText = false
    off(document, "mouseup", dragEnd)
    off(display.scroller, "drop", dragEnd)
    if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
      e_preventDefault(e2)
      if (!modifier && +new Date - 200 < startTime)
        { extendSelection(cm.doc, start) }
      // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
      if (webkit || ie && ie_version == 9)
        { setTimeout(function () {document.body.focus(); display.input.focus()}, 20) }
      else
        { display.input.focus() }
    }
  })
  // Let the drag handler handle this.
  if (webkit) { display.scroller.draggable = true }
  cm.state.draggingText = dragEnd
  dragEnd.copy = mac ? e.altKey : e.ctrlKey
  // IE's approach to draggable
  if (display.scroller.dragDrop) { display.scroller.dragDrop() }
  on(document, "mouseup", dragEnd)
  on(display.scroller, "drop", dragEnd)
}

// Normal selection, as opposed to text dragging.
function leftButtonSelect(cm, e, start, type, addNew) {
  var display = cm.display, doc = cm.doc
  e_preventDefault(e)

  var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges
  if (addNew && !e.shiftKey) {
    ourIndex = doc.sel.contains(start)
    if (ourIndex > -1)
      { ourRange = ranges[ourIndex] }
    else
      { ourRange = new Range(start, start) }
  } else {
    ourRange = doc.sel.primary()
    ourIndex = doc.sel.primIndex
  }

  if (chromeOS ? e.shiftKey && e.metaKey : e.altKey) {
    type = "rect"
    if (!addNew) { ourRange = new Range(start, start) }
    start = posFromMouse(cm, e, true, true)
    ourIndex = -1
  } else if (type == "double") {
    var word = cm.findWordAt(start)
    if (cm.display.shift || doc.extend)
      { ourRange = extendRange(doc, ourRange, word.anchor, word.head) }
    else
      { ourRange = word }
  } else if (type == "triple") {
    var line = new Range(Pos(start.line, 0), clipPos(doc, Pos(start.line + 1, 0)))
    if (cm.display.shift || doc.extend)
      { ourRange = extendRange(doc, ourRange, line.anchor, line.head) }
    else
      { ourRange = line }
  } else {
    ourRange = extendRange(doc, ourRange, start)
  }

  if (!addNew) {
    ourIndex = 0
    setSelection(doc, new Selection([ourRange], 0), sel_mouse)
    startSel = doc.sel
  } else if (ourIndex == -1) {
    ourIndex = ranges.length
    setSelection(doc, normalizeSelection(ranges.concat([ourRange]), ourIndex),
                 {scroll: false, origin: "*mouse"})
  } else if (ranges.length > 1 && ranges[ourIndex].empty() && type == "single" && !e.shiftKey) {
    setSelection(doc, normalizeSelection(ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                 {scroll: false, origin: "*mouse"})
    startSel = doc.sel
  } else {
    replaceOneSelection(doc, ourIndex, ourRange, sel_mouse)
  }

  var lastPos = start
  function extendTo(pos) {
    if (cmp(lastPos, pos) == 0) { return }
    lastPos = pos

    if (type == "rect") {
      var ranges = [], tabSize = cm.options.tabSize
      var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize)
      var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize)
      var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol)
      for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
           line <= end; line++) {
        var text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize)
        if (left == right)
          { ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos))) }
        else if (text.length > leftPos)
          { ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize)))) }
      }
      if (!ranges.length) { ranges.push(new Range(start, start)) }
      setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                   {origin: "*mouse", scroll: false})
      cm.scrollIntoView(pos)
    } else {
      var oldRange = ourRange
      var anchor = oldRange.anchor, head = pos
      if (type != "single") {
        var range
        if (type == "double")
          { range = cm.findWordAt(pos) }
        else
          { range = new Range(Pos(pos.line, 0), clipPos(doc, Pos(pos.line + 1, 0))) }
        if (cmp(range.anchor, anchor) > 0) {
          head = range.head
          anchor = minPos(oldRange.from(), range.anchor)
        } else {
          head = range.anchor
          anchor = maxPos(oldRange.to(), range.head)
        }
      }
      var ranges$1 = startSel.ranges.slice(0)
      ranges$1[ourIndex] = new Range(clipPos(doc, anchor), head)
      setSelection(doc, normalizeSelection(ranges$1, ourIndex), sel_mouse)
    }
  }

  var editorSize = display.wrapper.getBoundingClientRect()
  // Used to ensure timeout re-tries don't fire when another extend
  // happened in the meantime (clearTimeout isn't reliable -- at
  // least on Chrome, the timeouts still happen even when cleared,
  // if the clear happens after their scheduled firing time).
  var counter = 0

  function extend(e) {
    var curCount = ++counter
    var cur = posFromMouse(cm, e, true, type == "rect")
    if (!cur) { return }
    if (cmp(cur, lastPos) != 0) {
      cm.curOp.focus = activeElt()
      extendTo(cur)
      var visible = visibleLines(display, doc)
      if (cur.line >= visible.to || cur.line < visible.from)
        { setTimeout(operation(cm, function () {if (counter == curCount) { extend(e) }}), 150) }
    } else {
      var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0
      if (outside) { setTimeout(operation(cm, function () {
        if (counter != curCount) { return }
        display.scroller.scrollTop += outside
        extend(e)
      }), 50) }
    }
  }

  function done(e) {
    cm.state.selectingText = false
    counter = Infinity
    e_preventDefault(e)
    display.input.focus()
    off(document, "mousemove", move)
    off(document, "mouseup", up)
    doc.history.lastSelOrigin = null
  }

  var move = operation(cm, function (e) {
    if (!e_button(e)) { done(e) }
    else { extend(e) }
  })
  var up = operation(cm, done)
  cm.state.selectingText = up
  on(document, "mousemove", move)
  on(document, "mouseup", up)
}


// Determines whether an event happened in the gutter, and fires the
// handlers for the corresponding event.
function gutterEvent(cm, e, type, prevent) {
  var mX, mY
  try { mX = e.clientX; mY = e.clientY }
  catch(e) { return false }
  if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) { return false }
  if (prevent) { e_preventDefault(e) }

  var display = cm.display
  var lineBox = display.lineDiv.getBoundingClientRect()

  if (mY > lineBox.bottom || !hasHandler(cm, type)) { return e_defaultPrevented(e) }
  mY -= lineBox.top - display.viewOffset

  for (var i = 0; i < cm.options.gutters.length; ++i) {
    var g = display.gutters.childNodes[i]
    if (g && g.getBoundingClientRect().right >= mX) {
      var line = lineAtHeight(cm.doc, mY)
      var gutter = cm.options.gutters[i]
      signal(cm, type, cm, line, gutter, e)
      return e_defaultPrevented(e)
    }
  }
}

function clickInGutter(cm, e) {
  return gutterEvent(cm, e, "gutterClick", true)
}

// CONTEXT MENU HANDLING

// To make the context menu work, we need to briefly unhide the
// textarea (making it as unobtrusive as possible) to let the
// right-click take effect on it.
function onContextMenu(cm, e) {
  if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) { return }
  if (signalDOMEvent(cm, e, "contextmenu")) { return }
  cm.display.input.onContextMenu(e)
}

function contextMenuInGutter(cm, e) {
  if (!hasHandler(cm, "gutterContextMenu")) { return false }
  return gutterEvent(cm, e, "gutterContextMenu", false)
}

function themeChanged(cm) {
  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
    cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-")
  clearCaches(cm)
}

var Init = {toString: function(){return "CodeMirror.Init"}}

var defaults = {}
var optionHandlers = {}

function defineOptions(CodeMirror) {
  var optionHandlers = CodeMirror.optionHandlers

  function option(name, deflt, handle, notOnInit) {
    CodeMirror.defaults[name] = deflt
    if (handle) { optionHandlers[name] =
      notOnInit ? function (cm, val, old) {if (old != Init) { handle(cm, val, old) }} : handle }
  }

  CodeMirror.defineOption = option

  // Passed to option handlers when there is no old value.
  CodeMirror.Init = Init

  // These two are, on init, called from the constructor because they
  // have to be initialized before the editor can start at all.
  option("value", "", function (cm, val) { return cm.setValue(val); }, true)
  option("mode", null, function (cm, val) {
    cm.doc.modeOption = val
    loadMode(cm)
  }, true)

  option("indentUnit", 2, loadMode, true)
  option("indentWithTabs", false)
  option("smartIndent", true)
  option("tabSize", 4, function (cm) {
    resetModeState(cm)
    clearCaches(cm)
    regChange(cm)
  }, true)
  option("lineSeparator", null, function (cm, val) {
    cm.doc.lineSep = val
    if (!val) { return }
    var newBreaks = [], lineNo = cm.doc.first
    cm.doc.iter(function (line) {
      for (var pos = 0;;) {
        var found = line.text.indexOf(val, pos)
        if (found == -1) { break }
        pos = found + val.length
        newBreaks.push(Pos(lineNo, found))
      }
      lineNo++
    })
    for (var i = newBreaks.length - 1; i >= 0; i--)
      { replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length)) }
  })
  option("specialChars", /[\u0000-\u001f\u007f\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, function (cm, val, old) {
    cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g")
    if (old != Init) { cm.refresh() }
  })
  option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function (cm) { return cm.refresh(); }, true)
  option("electricChars", true)
  option("inputStyle", mobile ? "contenteditable" : "textarea", function () {
    throw new Error("inputStyle can not (yet) be changed in a running editor") // FIXME
  }, true)
  option("spellcheck", false, function (cm, val) { return cm.getInputField().spellcheck = val; }, true)
  option("rtlMoveVisually", !windows)
  option("wholeLineUpdateBefore", true)

  option("theme", "default", function (cm) {
    themeChanged(cm)
    guttersChanged(cm)
  }, true)
  option("keyMap", "default", function (cm, val, old) {
    var next = getKeyMap(val)
    var prev = old != Init && getKeyMap(old)
    if (prev && prev.detach) { prev.detach(cm, next) }
    if (next.attach) { next.attach(cm, prev || null) }
  })
  option("extraKeys", null)

  option("lineWrapping", false, wrappingChanged, true)
  option("gutters", [], function (cm) {
    setGuttersForLineNumbers(cm.options)
    guttersChanged(cm)
  }, true)
  option("fixedGutter", true, function (cm, val) {
    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0"
    cm.refresh()
  }, true)
  option("coverGutterNextToScrollbar", false, function (cm) { return updateScrollbars(cm); }, true)
  option("scrollbarStyle", "native", function (cm) {
    initScrollbars(cm)
    updateScrollbars(cm)
    cm.display.scrollbars.setScrollTop(cm.doc.scrollTop)
    cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft)
  }, true)
  option("lineNumbers", false, function (cm) {
    setGuttersForLineNumbers(cm.options)
    guttersChanged(cm)
  }, true)
  option("firstLineNumber", 1, guttersChanged, true)
  option("lineNumberFormatter", function (integer) { return integer; }, guttersChanged, true)
  option("showCursorWhenSelecting", false, updateSelection, true)

  option("resetSelectionOnContextMenu", true)
  option("lineWiseCopyCut", true)

  option("readOnly", false, function (cm, val) {
    if (val == "nocursor") {
      onBlur(cm)
      cm.display.input.blur()
      cm.display.disabled = true
    } else {
      cm.display.disabled = false
    }
    cm.display.input.readOnlyChanged(val)
  })
  option("disableInput", false, function (cm, val) {if (!val) { cm.display.input.reset() }}, true)
  option("dragDrop", true, dragDropChanged)
  option("allowDropFileTypes", null)

  option("cursorBlinkRate", 530)
  option("cursorScrollMargin", 0)
  option("cursorHeight", 1, updateSelection, true)
  option("singleCursorHeightPerLine", true, updateSelection, true)
  option("workTime", 100)
  option("workDelay", 100)
  option("flattenSpans", true, resetModeState, true)
  option("addModeClass", false, resetModeState, true)
  option("pollInterval", 100)
  option("undoDepth", 200, function (cm, val) { return cm.doc.history.undoDepth = val; })
  option("historyEventDelay", 1250)
  option("viewportMargin", 10, function (cm) { return cm.refresh(); }, true)
  option("maxHighlightLength", 10000, resetModeState, true)
  option("moveInputWithCursor", true, function (cm, val) {
    if (!val) { cm.display.input.resetPosition() }
  })

  option("tabindex", null, function (cm, val) { return cm.display.input.getField().tabIndex = val || ""; })
  option("autofocus", null)
}

function guttersChanged(cm) {
  updateGutters(cm)
  regChange(cm)
  setTimeout(function () { return alignHorizontally(cm); }, 20)
}

function dragDropChanged(cm, value, old) {
  var wasOn = old && old != Init
  if (!value != !wasOn) {
    var funcs = cm.display.dragFunctions
    var toggle = value ? on : off
    toggle(cm.display.scroller, "dragstart", funcs.start)
    toggle(cm.display.scroller, "dragenter", funcs.enter)
    toggle(cm.display.scroller, "dragover", funcs.over)
    toggle(cm.display.scroller, "dragleave", funcs.leave)
    toggle(cm.display.scroller, "drop", funcs.drop)
  }
}

function wrappingChanged(cm) {
  if (cm.options.lineWrapping) {
    addClass(cm.display.wrapper, "CodeMirror-wrap")
    cm.display.sizer.style.minWidth = ""
    cm.display.sizerWidth = null
  } else {
    rmClass(cm.display.wrapper, "CodeMirror-wrap")
    findMaxLine(cm)
  }
  estimateLineHeights(cm)
  regChange(cm)
  clearCaches(cm)
  setTimeout(function () { return updateScrollbars(cm); }, 100)
}

// A CodeMirror instance represents an editor. This is the object
// that user code is usually dealing with.

function CodeMirror(place, options) {
  var this$1 = this;

  if (!(this instanceof CodeMirror)) { return new CodeMirror(place, options) }

  this.options = options = options ? copyObj(options) : {}
  // Determine effective options based on given values and defaults.
  copyObj(defaults, options, false)
  setGuttersForLineNumbers(options)

  var doc = options.value
  if (typeof doc == "string") { doc = new Doc(doc, options.mode, null, options.lineSeparator) }
  this.doc = doc

  var input = new CodeMirror.inputStyles[options.inputStyle](this)
  var display = this.display = new Display(place, doc, input)
  display.wrapper.CodeMirror = this
  updateGutters(this)
  themeChanged(this)
  if (options.lineWrapping)
    { this.display.wrapper.className += " CodeMirror-wrap" }
  if (options.autofocus && !mobile) { display.input.focus() }
  initScrollbars(this)

  this.state = {
    keyMaps: [],  // stores maps added by addKeyMap
    overlays: [], // highlighting overlays, as added by addOverlay
    modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
    overwrite: false,
    delayingBlurEvent: false,
    focused: false,
    suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
    pasteIncoming: false, cutIncoming: false, // help recognize paste/cut edits in input.poll
    selectingText: false,
    draggingText: false,
    highlight: new Delayed(), // stores highlight worker timeout
    keySeq: null,  // Unfinished key sequence
    specialChars: null
  }

  // Override magic textarea content restore that IE sometimes does
  // on our hidden textarea on reload
  if (ie && ie_version < 11) { setTimeout(function () { return this$1.display.input.reset(true); }, 20) }

  registerEventHandlers(this)
  ensureGlobalHandlers()

  startOperation(this)
  this.curOp.forceUpdate = true
  attachDoc(this, doc)

  if ((options.autofocus && !mobile) || this.hasFocus())
    { setTimeout(bind(onFocus, this), 20) }
  else
    { onBlur(this) }

  for (var opt in optionHandlers) { if (optionHandlers.hasOwnProperty(opt))
    { optionHandlers[opt](this$1, options[opt], Init) } }
  maybeUpdateLineNumberWidth(this)
  if (options.finishInit) { options.finishInit(this) }
  for (var i = 0; i < initHooks.length; ++i) { initHooks[i](this$1) }
  endOperation(this)
  // Suppress optimizelegibility in Webkit, since it breaks text
  // measuring on line wrapping boundaries.
  if (webkit && options.lineWrapping &&
      getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
    { display.lineDiv.style.textRendering = "auto" }
}

// The default configuration options.
CodeMirror.defaults = defaults
// Functions to run when options are changed.
CodeMirror.optionHandlers = optionHandlers

// Attach the necessary event handlers when initializing the editor
function registerEventHandlers(cm) {
  var d = cm.display
  on(d.scroller, "mousedown", operation(cm, onMouseDown))
  // Older IE's will not fire a second mousedown for a double click
  if (ie && ie_version < 11)
    { on(d.scroller, "dblclick", operation(cm, function (e) {
      if (signalDOMEvent(cm, e)) { return }
      var pos = posFromMouse(cm, e)
      if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) { return }
      e_preventDefault(e)
      var word = cm.findWordAt(pos)
      extendSelection(cm.doc, word.anchor, word.head)
    })) }
  else
    { on(d.scroller, "dblclick", function (e) { return signalDOMEvent(cm, e) || e_preventDefault(e); }) }
  // Some browsers fire contextmenu *after* opening the menu, at
  // which point we can't mess with it anymore. Context menu is
  // handled in onMouseDown for these browsers.
  if (!captureRightClick) { on(d.scroller, "contextmenu", function (e) { return onContextMenu(cm, e); }) }

  // Used to suppress mouse event handling when a touch happens
  var touchFinished, prevTouch = {end: 0}
  function finishTouch() {
    if (d.activeTouch) {
      touchFinished = setTimeout(function () { return d.activeTouch = null; }, 1000)
      prevTouch = d.activeTouch
      prevTouch.end = +new Date
    }
  }
  function isMouseLikeTouchEvent(e) {
    if (e.touches.length != 1) { return false }
    var touch = e.touches[0]
    return touch.radiusX <= 1 && touch.radiusY <= 1
  }
  function farAway(touch, other) {
    if (other.left == null) { return true }
    var dx = other.left - touch.left, dy = other.top - touch.top
    return dx * dx + dy * dy > 20 * 20
  }
  on(d.scroller, "touchstart", function (e) {
    if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e)) {
      clearTimeout(touchFinished)
      var now = +new Date
      d.activeTouch = {start: now, moved: false,
                       prev: now - prevTouch.end <= 300 ? prevTouch : null}
      if (e.touches.length == 1) {
        d.activeTouch.left = e.touches[0].pageX
        d.activeTouch.top = e.touches[0].pageY
      }
    }
  })
  on(d.scroller, "touchmove", function () {
    if (d.activeTouch) { d.activeTouch.moved = true }
  })
  on(d.scroller, "touchend", function (e) {
    var touch = d.activeTouch
    if (touch && !eventInWidget(d, e) && touch.left != null &&
        !touch.moved && new Date - touch.start < 300) {
      var pos = cm.coordsChar(d.activeTouch, "page"), range
      if (!touch.prev || farAway(touch, touch.prev)) // Single tap
        { range = new Range(pos, pos) }
      else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
        { range = cm.findWordAt(pos) }
      else // Triple tap
        { range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))) }
      cm.setSelection(range.anchor, range.head)
      cm.focus()
      e_preventDefault(e)
    }
    finishTouch()
  })
  on(d.scroller, "touchcancel", finishTouch)

  // Sync scrolling between fake scrollbars and real scrollable
  // area, ensure viewport is updated when scrolling.
  on(d.scroller, "scroll", function () {
    if (d.scroller.clientHeight) {
      setScrollTop(cm, d.scroller.scrollTop)
      setScrollLeft(cm, d.scroller.scrollLeft, true)
      signal(cm, "scroll", cm)
    }
  })

  // Listen to wheel events in order to try and update the viewport on time.
  on(d.scroller, "mousewheel", function (e) { return onScrollWheel(cm, e); })
  on(d.scroller, "DOMMouseScroll", function (e) { return onScrollWheel(cm, e); })

  // Prevent wrapper from ever scrolling
  on(d.wrapper, "scroll", function () { return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; })

  d.dragFunctions = {
    enter: function (e) {if (!signalDOMEvent(cm, e)) { e_stop(e) }},
    over: function (e) {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e) }},
    start: function (e) { return onDragStart(cm, e); },
    drop: operation(cm, onDrop),
    leave: function (e) {if (!signalDOMEvent(cm, e)) { clearDragCursor(cm) }}
  }

  var inp = d.input.getField()
  on(inp, "keyup", function (e) { return onKeyUp.call(cm, e); })
  on(inp, "keydown", operation(cm, onKeyDown))
  on(inp, "keypress", operation(cm, onKeyPress))
  on(inp, "focus", function (e) { return onFocus(cm, e); })
  on(inp, "blur", function (e) { return onBlur(cm, e); })
}

var initHooks = []
CodeMirror.defineInitHook = function (f) { return initHooks.push(f); }

// Indent the given line. The how parameter can be "smart",
// "add"/null, "subtract", or "prev". When aggressive is false
// (typically set to true for forced single-line indents), empty
// lines are not indented, and places where the mode returns Pass
// are left alone.
function indentLine(cm, n, how, aggressive) {
  var doc = cm.doc, state
  if (how == null) { how = "add" }
  if (how == "smart") {
    // Fall back to "prev" when the mode doesn't have an indentation
    // method.
    if (!doc.mode.indent) { how = "prev" }
    else { state = getStateBefore(cm, n) }
  }

  var tabSize = cm.options.tabSize
  var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize)
  if (line.stateAfter) { line.stateAfter = null }
  var curSpaceString = line.text.match(/^\s*/)[0], indentation
  if (!aggressive && !/\S/.test(line.text)) {
    indentation = 0
    how = "not"
  } else if (how == "smart") {
    indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text)
    if (indentation == Pass || indentation > 150) {
      if (!aggressive) { return }
      how = "prev"
    }
  }
  if (how == "prev") {
    if (n > doc.first) { indentation = countColumn(getLine(doc, n-1).text, null, tabSize) }
    else { indentation = 0 }
  } else if (how == "add") {
    indentation = curSpace + cm.options.indentUnit
  } else if (how == "subtract") {
    indentation = curSpace - cm.options.indentUnit
  } else if (typeof how == "number") {
    indentation = curSpace + how
  }
  indentation = Math.max(0, indentation)

  var indentString = "", pos = 0
  if (cm.options.indentWithTabs)
    { for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t"} }
  if (pos < indentation) { indentString += spaceStr(indentation - pos) }

  if (indentString != curSpaceString) {
    replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input")
    line.stateAfter = null
    return true
  } else {
    // Ensure that, if the cursor was in the whitespace at the start
    // of the line, it is moved to the end of that space.
    for (var i$1 = 0; i$1 < doc.sel.ranges.length; i$1++) {
      var range = doc.sel.ranges[i$1]
      if (range.head.line == n && range.head.ch < curSpaceString.length) {
        var pos$1 = Pos(n, curSpaceString.length)
        replaceOneSelection(doc, i$1, new Range(pos$1, pos$1))
        break
      }
    }
  }
}

// This will be set to a {lineWise: bool, text: [string]} object, so
// that, when pasting, we know what kind of selections the copied
// text was made out of.
var lastCopied = null

function setLastCopied(newLastCopied) {
  lastCopied = newLastCopied
}

function applyTextInput(cm, inserted, deleted, sel, origin) {
  var doc = cm.doc
  cm.display.shift = false
  if (!sel) { sel = doc.sel }

  var paste = cm.state.pasteIncoming || origin == "paste"
  var textLines = splitLinesAuto(inserted), multiPaste = null
  // When pasing N lines into N selections, insert one line per selection
  if (paste && sel.ranges.length > 1) {
    if (lastCopied && lastCopied.text.join("\n") == inserted) {
      if (sel.ranges.length % lastCopied.text.length == 0) {
        multiPaste = []
        for (var i = 0; i < lastCopied.text.length; i++)
          { multiPaste.push(doc.splitLines(lastCopied.text[i])) }
      }
    } else if (textLines.length == sel.ranges.length) {
      multiPaste = map(textLines, function (l) { return [l]; })
    }
  }

  var updateInput
  // Normal behavior is to insert the new text into every selection
  for (var i$1 = sel.ranges.length - 1; i$1 >= 0; i$1--) {
    var range = sel.ranges[i$1]
    var from = range.from(), to = range.to()
    if (range.empty()) {
      if (deleted && deleted > 0) // Handle deletion
        { from = Pos(from.line, from.ch - deleted) }
      else if (cm.state.overwrite && !paste) // Handle overwrite
        { to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length)) }
      else if (lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
        { from = to = Pos(from.line, 0) }
    }
    updateInput = cm.curOp.updateInput
    var changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i$1 % multiPaste.length] : textLines,
                       origin: origin || (paste ? "paste" : cm.state.cutIncoming ? "cut" : "+input")}
    makeChange(cm.doc, changeEvent)
    signalLater(cm, "inputRead", cm, changeEvent)
  }
  if (inserted && !paste)
    { triggerElectric(cm, inserted) }

  ensureCursorVisible(cm)
  cm.curOp.updateInput = updateInput
  cm.curOp.typing = true
  cm.state.pasteIncoming = cm.state.cutIncoming = false
}

function handlePaste(e, cm) {
  var pasted = e.clipboardData && e.clipboardData.getData("Text")
  if (pasted) {
    e.preventDefault()
    if (!cm.isReadOnly() && !cm.options.disableInput)
      { runInOp(cm, function () { return applyTextInput(cm, pasted, 0, null, "paste"); }) }
    return true
  }
}

function triggerElectric(cm, inserted) {
  // When an 'electric' character is inserted, immediately trigger a reindent
  if (!cm.options.electricChars || !cm.options.smartIndent) { return }
  var sel = cm.doc.sel

  for (var i = sel.ranges.length - 1; i >= 0; i--) {
    var range = sel.ranges[i]
    if (range.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range.head.line)) { continue }
    var mode = cm.getModeAt(range.head)
    var indented = false
    if (mode.electricChars) {
      for (var j = 0; j < mode.electricChars.length; j++)
        { if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
          indented = indentLine(cm, range.head.line, "smart")
          break
        } }
    } else if (mode.electricInput) {
      if (mode.electricInput.test(getLine(cm.doc, range.head.line).text.slice(0, range.head.ch)))
        { indented = indentLine(cm, range.head.line, "smart") }
    }
    if (indented) { signalLater(cm, "electricInput", cm, range.head.line) }
  }
}

function copyableRanges(cm) {
  var text = [], ranges = []
  for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
    var line = cm.doc.sel.ranges[i].head.line
    var lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)}
    ranges.push(lineRange)
    text.push(cm.getRange(lineRange.anchor, lineRange.head))
  }
  return {text: text, ranges: ranges}
}

function disableBrowserMagic(field, spellcheck) {
  field.setAttribute("autocorrect", "off")
  field.setAttribute("autocapitalize", "off")
  field.setAttribute("spellcheck", !!spellcheck)
}

function hiddenTextarea() {
  var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none")
  var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;")
  // The textarea is kept positioned near the cursor to prevent the
  // fact that it'll be scrolled into view on input from scrolling
  // our fake cursor out of view. On webkit, when wrap=off, paste is
  // very slow. So make the area wide instead.
  if (webkit) { te.style.width = "1000px" }
  else { te.setAttribute("wrap", "off") }
  // If border: 0; -- iOS fails to open keyboard (issue #1287)
  if (ios) { te.style.border = "1px solid black" }
  disableBrowserMagic(te)
  return div
}

// The publicly visible API. Note that methodOp(f) means
// 'wrap f in an operation, performed on its `this` parameter'.

// This is not the complete set of editor methods. Most of the
// methods defined on the Doc type are also injected into
// CodeMirror.prototype, for backwards compatibility and
// convenience.

function addEditorMethods(CodeMirror) {
  var optionHandlers = CodeMirror.optionHandlers

  var helpers = CodeMirror.helpers = {}

  CodeMirror.prototype = {
    constructor: CodeMirror,
    focus: function(){window.focus(); this.display.input.focus()},

    setOption: function(option, value) {
      var options = this.options, old = options[option]
      if (options[option] == value && option != "mode") { return }
      options[option] = value
      if (optionHandlers.hasOwnProperty(option))
        { operation(this, optionHandlers[option])(this, value, old) }
    },

    getOption: function(option) {return this.options[option]},
    getDoc: function() {return this.doc},

    addKeyMap: function(map, bottom) {
      this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map))
    },
    removeKeyMap: function(map) {
      var maps = this.state.keyMaps
      for (var i = 0; i < maps.length; ++i)
        { if (maps[i] == map || maps[i].name == map) {
          maps.splice(i, 1)
          return true
        } }
    },

    addOverlay: methodOp(function(spec, options) {
      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec)
      if (mode.startState) { throw new Error("Overlays may not be stateful.") }
      insertSorted(this.state.overlays,
                   {mode: mode, modeSpec: spec, opaque: options && options.opaque,
                    priority: (options && options.priority) || 0},
                   function (overlay) { return overlay.priority; })
      this.state.modeGen++
      regChange(this)
    }),
    removeOverlay: methodOp(function(spec) {
      var this$1 = this;

      var overlays = this.state.overlays
      for (var i = 0; i < overlays.length; ++i) {
        var cur = overlays[i].modeSpec
        if (cur == spec || typeof spec == "string" && cur.name == spec) {
          overlays.splice(i, 1)
          this$1.state.modeGen++
          regChange(this$1)
          return
        }
      }
    }),

    indentLine: methodOp(function(n, dir, aggressive) {
      if (typeof dir != "string" && typeof dir != "number") {
        if (dir == null) { dir = this.options.smartIndent ? "smart" : "prev" }
        else { dir = dir ? "add" : "subtract" }
      }
      if (isLine(this.doc, n)) { indentLine(this, n, dir, aggressive) }
    }),
    indentSelection: methodOp(function(how) {
      var this$1 = this;

      var ranges = this.doc.sel.ranges, end = -1
      for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i]
        if (!range.empty()) {
          var from = range.from(), to = range.to()
          var start = Math.max(end, from.line)
          end = Math.min(this$1.lastLine(), to.line - (to.ch ? 0 : 1)) + 1
          for (var j = start; j < end; ++j)
            { indentLine(this$1, j, how) }
          var newRanges = this$1.doc.sel.ranges
          if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
            { replaceOneSelection(this$1.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll) }
        } else if (range.head.line > end) {
          indentLine(this$1, range.head.line, how, true)
          end = range.head.line
          if (i == this$1.doc.sel.primIndex) { ensureCursorVisible(this$1) }
        }
      }
    }),

    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(pos, precise) {
      return takeToken(this, pos, precise)
    },

    getLineTokens: function(line, precise) {
      return takeToken(this, Pos(line), precise, true)
    },

    getTokenTypeAt: function(pos) {
      pos = clipPos(this.doc, pos)
      var styles = getLineStyles(this, getLine(this.doc, pos.line))
      var before = 0, after = (styles.length - 1) / 2, ch = pos.ch
      var type
      if (ch == 0) { type = styles[2] }
      else { for (;;) {
        var mid = (before + after) >> 1
        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) { after = mid }
        else if (styles[mid * 2 + 1] < ch) { before = mid + 1 }
        else { type = styles[mid * 2 + 2]; break }
      } }
      var cut = type ? type.indexOf("overlay ") : -1
      return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1)
    },

    getModeAt: function(pos) {
      var mode = this.doc.mode
      if (!mode.innerMode) { return mode }
      return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode
    },

    getHelper: function(pos, type) {
      return this.getHelpers(pos, type)[0]
    },

    getHelpers: function(pos, type) {
      var this$1 = this;

      var found = []
      if (!helpers.hasOwnProperty(type)) { return found }
      var help = helpers[type], mode = this.getModeAt(pos)
      if (typeof mode[type] == "string") {
        if (help[mode[type]]) { found.push(help[mode[type]]) }
      } else if (mode[type]) {
        for (var i = 0; i < mode[type].length; i++) {
          var val = help[mode[type][i]]
          if (val) { found.push(val) }
        }
      } else if (mode.helperType && help[mode.helperType]) {
        found.push(help[mode.helperType])
      } else if (help[mode.name]) {
        found.push(help[mode.name])
      }
      for (var i$1 = 0; i$1 < help._global.length; i$1++) {
        var cur = help._global[i$1]
        if (cur.pred(mode, this$1) && indexOf(found, cur.val) == -1)
          { found.push(cur.val) }
      }
      return found
    },

    getStateAfter: function(line, precise) {
      var doc = this.doc
      line = clipLine(doc, line == null ? doc.first + doc.size - 1: line)
      return getStateBefore(this, line + 1, precise)
    },

    cursorCoords: function(start, mode) {
      var pos, range = this.doc.sel.primary()
      if (start == null) { pos = range.head }
      else if (typeof start == "object") { pos = clipPos(this.doc, start) }
      else { pos = start ? range.from() : range.to() }
      return cursorCoords(this, pos, mode || "page")
    },

    charCoords: function(pos, mode) {
      return charCoords(this, clipPos(this.doc, pos), mode || "page")
    },

    coordsChar: function(coords, mode) {
      coords = fromCoordSystem(this, coords, mode || "page")
      return coordsChar(this, coords.left, coords.top)
    },

    lineAtHeight: function(height, mode) {
      height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top
      return lineAtHeight(this.doc, height + this.display.viewOffset)
    },
    heightAtLine: function(line, mode) {
      var end = false, lineObj
      if (typeof line == "number") {
        var last = this.doc.first + this.doc.size - 1
        if (line < this.doc.first) { line = this.doc.first }
        else if (line > last) { line = last; end = true }
        lineObj = getLine(this.doc, line)
      } else {
        lineObj = line
      }
      return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page").top +
        (end ? this.doc.height - heightAtLine(lineObj) : 0)
    },

    defaultTextHeight: function() { return textHeight(this.display) },
    defaultCharWidth: function() { return charWidth(this.display) },

    setGutterMarker: methodOp(function(line, gutterID, value) {
      return changeLine(this.doc, line, "gutter", function (line) {
        var markers = line.gutterMarkers || (line.gutterMarkers = {})
        markers[gutterID] = value
        if (!value && isEmpty(markers)) { line.gutterMarkers = null }
        return true
      })
    }),

    clearGutter: methodOp(function(gutterID) {
      var this$1 = this;

      var doc = this.doc, i = doc.first
      doc.iter(function (line) {
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
          line.gutterMarkers[gutterID] = null
          regLineChange(this$1, i, "gutter")
          if (isEmpty(line.gutterMarkers)) { line.gutterMarkers = null }
        }
        ++i
      })
    }),

    lineInfo: function(line) {
      var n
      if (typeof line == "number") {
        if (!isLine(this.doc, line)) { return null }
        n = line
        line = getLine(this.doc, line)
        if (!line) { return null }
      } else {
        n = lineNo(line)
        if (n == null) { return null }
      }
      return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
              textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
              widgets: line.widgets}
    },

    getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo}},

    addWidget: function(pos, node, scroll, vert, horiz) {
      var display = this.display
      pos = cursorCoords(this, clipPos(this.doc, pos))
      var top = pos.bottom, left = pos.left
      node.style.position = "absolute"
      node.setAttribute("cm-ignore-events", "true")
      this.display.input.setUneditable(node)
      display.sizer.appendChild(node)
      if (vert == "over") {
        top = pos.top
      } else if (vert == "above" || vert == "near") {
        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
        hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth)
        // Default to positioning above (if specified and possible); otherwise default to positioning below
        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
          { top = pos.top - node.offsetHeight }
        else if (pos.bottom + node.offsetHeight <= vspace)
          { top = pos.bottom }
        if (left + node.offsetWidth > hspace)
          { left = hspace - node.offsetWidth }
      }
      node.style.top = top + "px"
      node.style.left = node.style.right = ""
      if (horiz == "right") {
        left = display.sizer.clientWidth - node.offsetWidth
        node.style.right = "0px"
      } else {
        if (horiz == "left") { left = 0 }
        else if (horiz == "middle") { left = (display.sizer.clientWidth - node.offsetWidth) / 2 }
        node.style.left = left + "px"
      }
      if (scroll)
        { scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight) }
    },

    triggerOnKeyDown: methodOp(onKeyDown),
    triggerOnKeyPress: methodOp(onKeyPress),
    triggerOnKeyUp: onKeyUp,

    execCommand: function(cmd) {
      if (commands.hasOwnProperty(cmd))
        { return commands[cmd].call(null, this) }
    },

    triggerElectric: methodOp(function(text) { triggerElectric(this, text) }),

    findPosH: function(from, amount, unit, visually) {
      var this$1 = this;

      var dir = 1
      if (amount < 0) { dir = -1; amount = -amount }
      var cur = clipPos(this.doc, from)
      for (var i = 0; i < amount; ++i) {
        cur = findPosH(this$1.doc, cur, dir, unit, visually)
        if (cur.hitSide) { break }
      }
      return cur
    },

    moveH: methodOp(function(dir, unit) {
      var this$1 = this;

      this.extendSelectionsBy(function (range) {
        if (this$1.display.shift || this$1.doc.extend || range.empty())
          { return findPosH(this$1.doc, range.head, dir, unit, this$1.options.rtlMoveVisually) }
        else
          { return dir < 0 ? range.from() : range.to() }
      }, sel_move)
    }),

    deleteH: methodOp(function(dir, unit) {
      var sel = this.doc.sel, doc = this.doc
      if (sel.somethingSelected())
        { doc.replaceSelection("", null, "+delete") }
      else
        { deleteNearSelection(this, function (range) {
          var other = findPosH(doc, range.head, dir, unit, false)
          return dir < 0 ? {from: other, to: range.head} : {from: range.head, to: other}
        }) }
    }),

    findPosV: function(from, amount, unit, goalColumn) {
      var this$1 = this;

      var dir = 1, x = goalColumn
      if (amount < 0) { dir = -1; amount = -amount }
      var cur = clipPos(this.doc, from)
      for (var i = 0; i < amount; ++i) {
        var coords = cursorCoords(this$1, cur, "div")
        if (x == null) { x = coords.left }
        else { coords.left = x }
        cur = findPosV(this$1, coords, dir, unit)
        if (cur.hitSide) { break }
      }
      return cur
    },

    moveV: methodOp(function(dir, unit) {
      var this$1 = this;

      var doc = this.doc, goals = []
      var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected()
      doc.extendSelectionsBy(function (range) {
        if (collapse)
          { return dir < 0 ? range.from() : range.to() }
        var headPos = cursorCoords(this$1, range.head, "div")
        if (range.goalColumn != null) { headPos.left = range.goalColumn }
        goals.push(headPos.left)
        var pos = findPosV(this$1, headPos, dir, unit)
        if (unit == "page" && range == doc.sel.primary())
          { addToScrollPos(this$1, null, charCoords(this$1, pos, "div").top - headPos.top) }
        return pos
      }, sel_move)
      if (goals.length) { for (var i = 0; i < doc.sel.ranges.length; i++)
        { doc.sel.ranges[i].goalColumn = goals[i] } }
    }),

    // Find the word at the given position (as returned by coordsChar).
    findWordAt: function(pos) {
      var doc = this.doc, line = getLine(doc, pos.line).text
      var start = pos.ch, end = pos.ch
      if (line) {
        var helper = this.getHelper(pos, "wordChars")
        if ((pos.xRel < 0 || end == line.length) && start) { --start; } else { ++end }
        var startChar = line.charAt(start)
        var check = isWordChar(startChar, helper)
          ? function (ch) { return isWordChar(ch, helper); }
          : /\s/.test(startChar) ? function (ch) { return /\s/.test(ch); }
          : function (ch) { return (!/\s/.test(ch) && !isWordChar(ch)); }
        while (start > 0 && check(line.charAt(start - 1))) { --start }
        while (end < line.length && check(line.charAt(end))) { ++end }
      }
      return new Range(Pos(pos.line, start), Pos(pos.line, end))
    },

    toggleOverwrite: function(value) {
      if (value != null && value == this.state.overwrite) { return }
      if (this.state.overwrite = !this.state.overwrite)
        { addClass(this.display.cursorDiv, "CodeMirror-overwrite") }
      else
        { rmClass(this.display.cursorDiv, "CodeMirror-overwrite") }

      signal(this, "overwriteToggle", this, this.state.overwrite)
    },
    hasFocus: function() { return this.display.input.getField() == activeElt() },
    isReadOnly: function() { return !!(this.options.readOnly || this.doc.cantEdit) },

    scrollTo: methodOp(function(x, y) {
      if (x != null || y != null) { resolveScrollToPos(this) }
      if (x != null) { this.curOp.scrollLeft = x }
      if (y != null) { this.curOp.scrollTop = y }
    }),
    getScrollInfo: function() {
      var scroller = this.display.scroller
      return {left: scroller.scrollLeft, top: scroller.scrollTop,
              height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
              width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
              clientHeight: displayHeight(this), clientWidth: displayWidth(this)}
    },

    scrollIntoView: methodOp(function(range, margin) {
      if (range == null) {
        range = {from: this.doc.sel.primary().head, to: null}
        if (margin == null) { margin = this.options.cursorScrollMargin }
      } else if (typeof range == "number") {
        range = {from: Pos(range, 0), to: null}
      } else if (range.from == null) {
        range = {from: range, to: null}
      }
      if (!range.to) { range.to = range.from }
      range.margin = margin || 0

      if (range.from.line != null) {
        resolveScrollToPos(this)
        this.curOp.scrollToPos = range
      } else {
        var sPos = calculateScrollPos(this, Math.min(range.from.left, range.to.left),
                                      Math.min(range.from.top, range.to.top) - range.margin,
                                      Math.max(range.from.right, range.to.right),
                                      Math.max(range.from.bottom, range.to.bottom) + range.margin)
        this.scrollTo(sPos.scrollLeft, sPos.scrollTop)
      }
    }),

    setSize: methodOp(function(width, height) {
      var this$1 = this;

      var interpret = function (val) { return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val; }
      if (width != null) { this.display.wrapper.style.width = interpret(width) }
      if (height != null) { this.display.wrapper.style.height = interpret(height) }
      if (this.options.lineWrapping) { clearLineMeasurementCache(this) }
      var lineNo = this.display.viewFrom
      this.doc.iter(lineNo, this.display.viewTo, function (line) {
        if (line.widgets) { for (var i = 0; i < line.widgets.length; i++)
          { if (line.widgets[i].noHScroll) { regLineChange(this$1, lineNo, "widget"); break } } }
        ++lineNo
      })
      this.curOp.forceUpdate = true
      signal(this, "refresh", this)
    }),

    operation: function(f){return runInOp(this, f)},

    refresh: methodOp(function() {
      var oldHeight = this.display.cachedTextHeight
      regChange(this)
      this.curOp.forceUpdate = true
      clearCaches(this)
      this.scrollTo(this.doc.scrollLeft, this.doc.scrollTop)
      updateGutterSpace(this)
      if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
        { estimateLineHeights(this) }
      signal(this, "refresh", this)
    }),

    swapDoc: methodOp(function(doc) {
      var old = this.doc
      old.cm = null
      attachDoc(this, doc)
      clearCaches(this)
      this.display.input.reset()
      this.scrollTo(doc.scrollLeft, doc.scrollTop)
      this.curOp.forceScroll = true
      signalLater(this, "swapDoc", this, old)
      return old
    }),

    getInputField: function(){return this.display.input.getField()},
    getWrapperElement: function(){return this.display.wrapper},
    getScrollerElement: function(){return this.display.scroller},
    getGutterElement: function(){return this.display.gutters}
  }
  eventMixin(CodeMirror)

  CodeMirror.registerHelper = function(type, name, value) {
    if (!helpers.hasOwnProperty(type)) { helpers[type] = CodeMirror[type] = {_global: []} }
    helpers[type][name] = value
  }
  CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
    CodeMirror.registerHelper(type, name, value)
    helpers[type]._global.push({pred: predicate, val: value})
  }
}

// Used for horizontal relative motion. Dir is -1 or 1 (left or
// right), unit can be "char", "column" (like char, but doesn't
// cross line boundaries), "word" (across next word), or "group" (to
// the start of next group of word or non-word-non-whitespace
// chars). The visually param controls whether, in right-to-left
// text, direction 1 means to move towards the next index in the
// string, or towards the character to the right of the current
// position. The resulting position will have a hitSide=true
// property if it reached the end of the document.
function findPosH(doc, pos, dir, unit, visually) {
  var line = pos.line, ch = pos.ch, origDir = dir
  var lineObj = getLine(doc, line)
  function findNextLine() {
    var l = line + dir
    if (l < doc.first || l >= doc.first + doc.size) { return false }
    line = l
    return lineObj = getLine(doc, l)
  }
  function moveOnce(boundToLine) {
    var next = (visually ? moveVisually : moveLogically)(lineObj, ch, dir, true)
    if (next == null) {
      if (!boundToLine && findNextLine()) {
        if (visually) { ch = (dir < 0 ? lineRight : lineLeft)(lineObj) }
        else { ch = dir < 0 ? lineObj.text.length : 0 }
      } else { return false }
    } else { ch = next }
    return true
  }

  if (unit == "char") {
    moveOnce()
  } else if (unit == "column") {
    moveOnce(true)
  } else if (unit == "word" || unit == "group") {
    var sawType = null, group = unit == "group"
    var helper = doc.cm && doc.cm.getHelper(pos, "wordChars")
    for (var first = true;; first = false) {
      if (dir < 0 && !moveOnce(!first)) { break }
      var cur = lineObj.text.charAt(ch) || "\n"
      var type = isWordChar(cur, helper) ? "w"
        : group && cur == "\n" ? "n"
        : !group || /\s/.test(cur) ? null
        : "p"
      if (group && !first && !type) { type = "s" }
      if (sawType && sawType != type) {
        if (dir < 0) {dir = 1; moveOnce()}
        break
      }

      if (type) { sawType = type }
      if (dir > 0 && !moveOnce(!first)) { break }
    }
  }
  var result = skipAtomic(doc, Pos(line, ch), pos, origDir, true)
  if (!cmp(pos, result)) { result.hitSide = true }
  return result
}

// For relative vertical movement. Dir may be -1 or 1. Unit can be
// "page" or "line". The resulting position will have a hitSide=true
// property if it reached the end of the document.
function findPosV(cm, pos, dir, unit) {
  var doc = cm.doc, x = pos.left, y
  if (unit == "page") {
    var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight)
    var moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3)
    y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount

  } else if (unit == "line") {
    y = dir > 0 ? pos.bottom + 3 : pos.top - 3
  }
  var target
  for (;;) {
    target = coordsChar(cm, x, y)
    if (!target.outside) { break }
    if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break }
    y += dir * 5
  }
  return target
}

// CONTENTEDITABLE INPUT STYLE

function ContentEditableInput(cm) {
  this.cm = cm
  this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null
  this.polling = new Delayed()
  this.gracePeriod = false
}

ContentEditableInput.prototype = copyObj({
  init: function(display) {
    var input = this, cm = input.cm
    var div = input.div = display.lineDiv
    disableBrowserMagic(div, cm.options.spellcheck)

    on(div, "paste", function (e) {
      if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }
      // IE doesn't fire input events, so we schedule a read for the pasted content in this way
      if (ie_version <= 11) { setTimeout(operation(cm, function () {
        if (!input.pollContent()) { regChange(cm) }
      }), 20) }
    })

    on(div, "compositionstart", function (e) {
      var data = e.data
      input.composing = {sel: cm.doc.sel, data: data, startData: data}
      if (!data) { return }
      var prim = cm.doc.sel.primary()
      var line = cm.getLine(prim.head.line)
      var found = line.indexOf(data, Math.max(0, prim.head.ch - data.length))
      if (found > -1 && found <= prim.head.ch)
        { input.composing.sel = simpleSelection(Pos(prim.head.line, found),
                                              Pos(prim.head.line, found + data.length)) }
    })
    on(div, "compositionupdate", function (e) { return input.composing.data = e.data; })
    on(div, "compositionend", function (e) {
      var ours = input.composing
      if (!ours) { return }
      if (e.data != ours.startData && !/\u200b/.test(e.data))
        { ours.data = e.data }
      // Need a small delay to prevent other code (input event,
      // selection polling) from doing damage when fired right after
      // compositionend.
      setTimeout(function () {
        if (!ours.handled)
          { input.applyComposition(ours) }
        if (input.composing == ours)
          { input.composing = null }
      }, 50)
    })

    on(div, "touchstart", function () { return input.forceCompositionEnd(); })

    on(div, "input", function () {
      if (input.composing) { return }
      if (cm.isReadOnly() || !input.pollContent())
        { runInOp(input.cm, function () { return regChange(cm); }) }
    })

    function onCopyCut(e) {
      if (signalDOMEvent(cm, e)) { return }
      if (cm.somethingSelected()) {
        setLastCopied({lineWise: false, text: cm.getSelections()})
        if (e.type == "cut") { cm.replaceSelection("", null, "cut") }
      } else if (!cm.options.lineWiseCopyCut) {
        return
      } else {
        var ranges = copyableRanges(cm)
        setLastCopied({lineWise: true, text: ranges.text})
        if (e.type == "cut") {
          cm.operation(function () {
            cm.setSelections(ranges.ranges, 0, sel_dontScroll)
            cm.replaceSelection("", null, "cut")
          })
        }
      }
      if (e.clipboardData) {
        e.clipboardData.clearData()
        var content = lastCopied.text.join("\n")
        // iOS exposes the clipboard API, but seems to discard content inserted into it
        e.clipboardData.setData("Text", content)
        if (e.clipboardData.getData("Text") == content) {
          e.preventDefault()
          return
        }
      }
      // Old-fashioned briefly-focus-a-textarea hack
      var kludge = hiddenTextarea(), te = kludge.firstChild
      cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild)
      te.value = lastCopied.text.join("\n")
      var hadFocus = document.activeElement
      selectInput(te)
      setTimeout(function () {
        cm.display.lineSpace.removeChild(kludge)
        hadFocus.focus()
        if (hadFocus == div) { input.showPrimarySelection() }
      }, 50)
    }
    on(div, "copy", onCopyCut)
    on(div, "cut", onCopyCut)
  },

  prepareSelection: function() {
    var result = prepareSelection(this.cm, false)
    result.focus = this.cm.state.focused
    return result
  },

  showSelection: function(info, takeFocus) {
    if (!info || !this.cm.display.view.length) { return }
    if (info.focus || takeFocus) { this.showPrimarySelection() }
    this.showMultipleSelections(info)
  },

  showPrimarySelection: function() {
    var sel = window.getSelection(), prim = this.cm.doc.sel.primary()
    var curAnchor = domToPos(this.cm, sel.anchorNode, sel.anchorOffset)
    var curFocus = domToPos(this.cm, sel.focusNode, sel.focusOffset)
    if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
        cmp(minPos(curAnchor, curFocus), prim.from()) == 0 &&
        cmp(maxPos(curAnchor, curFocus), prim.to()) == 0)
      { return }

    var start = posToDOM(this.cm, prim.from())
    var end = posToDOM(this.cm, prim.to())
    if (!start && !end) { return }

    var view = this.cm.display.view
    var old = sel.rangeCount && sel.getRangeAt(0)
    if (!start) {
      start = {node: view[0].measure.map[2], offset: 0}
    } else if (!end) { // FIXME dangerously hacky
      var measure = view[view.length - 1].measure
      var map = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map
      end = {node: map[map.length - 1], offset: map[map.length - 2] - map[map.length - 3]}
    }

    var rng
    try { rng = range(start.node, start.offset, end.offset, end.node) }
    catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
    if (rng) {
      if (!gecko && this.cm.state.focused) {
        sel.collapse(start.node, start.offset)
        if (!rng.collapsed) {
          sel.removeAllRanges()
          sel.addRange(rng)
        }
      } else {
        sel.removeAllRanges()
        sel.addRange(rng)
      }
      if (old && sel.anchorNode == null) { sel.addRange(old) }
      else if (gecko) { this.startGracePeriod() }
    }
    this.rememberSelection()
  },

  startGracePeriod: function() {
    var this$1 = this;

    clearTimeout(this.gracePeriod)
    this.gracePeriod = setTimeout(function () {
      this$1.gracePeriod = false
      if (this$1.selectionChanged())
        { this$1.cm.operation(function () { return this$1.cm.curOp.selectionChanged = true; }) }
    }, 20)
  },

  showMultipleSelections: function(info) {
    removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors)
    removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection)
  },

  rememberSelection: function() {
    var sel = window.getSelection()
    this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset
    this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset
  },

  selectionInEditor: function() {
    var sel = window.getSelection()
    if (!sel.rangeCount) { return false }
    var node = sel.getRangeAt(0).commonAncestorContainer
    return contains(this.div, node)
  },

  focus: function() {
    if (this.cm.options.readOnly != "nocursor") { this.div.focus() }
  },
  blur: function() { this.div.blur() },
  getField: function() { return this.div },

  supportsTouch: function() { return true },

  receivedFocus: function() {
    var input = this
    if (this.selectionInEditor())
      { this.pollSelection() }
    else
      { runInOp(this.cm, function () { return input.cm.curOp.selectionChanged = true; }) }

    function poll() {
      if (input.cm.state.focused) {
        input.pollSelection()
        input.polling.set(input.cm.options.pollInterval, poll)
      }
    }
    this.polling.set(this.cm.options.pollInterval, poll)
  },

  selectionChanged: function() {
    var sel = window.getSelection()
    return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
      sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset
  },

  pollSelection: function() {
    if (!this.composing && !this.gracePeriod && this.selectionChanged()) {
      var sel = window.getSelection(), cm = this.cm
      this.rememberSelection()
      var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset)
      var head = domToPos(cm, sel.focusNode, sel.focusOffset)
      if (anchor && head) { runInOp(cm, function () {
        setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll)
        if (anchor.bad || head.bad) { cm.curOp.selectionChanged = true }
      }) }
    }
  },

  pollContent: function() {
    var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary()
    var from = sel.from(), to = sel.to()
    if (from.line < display.viewFrom || to.line > display.viewTo - 1) { return false }

    var fromIndex, fromLine, fromNode
    if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
      fromLine = lineNo(display.view[0].line)
      fromNode = display.view[0].node
    } else {
      fromLine = lineNo(display.view[fromIndex].line)
      fromNode = display.view[fromIndex - 1].node.nextSibling
    }
    var toIndex = findViewIndex(cm, to.line)
    var toLine, toNode
    if (toIndex == display.view.length - 1) {
      toLine = display.viewTo - 1
      toNode = display.lineDiv.lastChild
    } else {
      toLine = lineNo(display.view[toIndex + 1].line) - 1
      toNode = display.view[toIndex + 1].node.previousSibling
    }

    var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine))
    var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length))
    while (newText.length > 1 && oldText.length > 1) {
      if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine-- }
      else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++ }
      else { break }
    }

    var cutFront = 0, cutEnd = 0
    var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length)
    while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
      { ++cutFront }
    var newBot = lst(newText), oldBot = lst(oldText)
    var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
                             oldBot.length - (oldText.length == 1 ? cutFront : 0))
    while (cutEnd < maxCutEnd &&
           newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
      { ++cutEnd }

    newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd)
    newText[0] = newText[0].slice(cutFront)

    var chFrom = Pos(fromLine, cutFront)
    var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0)
    if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
      replaceRange(cm.doc, newText, chFrom, chTo, "+input")
      return true
    }
  },

  ensurePolled: function() {
    this.forceCompositionEnd()
  },
  reset: function() {
    this.forceCompositionEnd()
  },
  forceCompositionEnd: function() {
    if (!this.composing || this.composing.handled) { return }
    this.applyComposition(this.composing)
    this.composing.handled = true
    this.div.blur()
    this.div.focus()
  },
  applyComposition: function(composing) {
    if (this.cm.isReadOnly())
      { operation(this.cm, regChange)(this.cm) }
    else if (composing.data && composing.data != composing.startData)
      { operation(this.cm, applyTextInput)(this.cm, composing.data, 0, composing.sel) }
  },

  setUneditable: function(node) {
    node.contentEditable = "false"
  },

  onKeyPress: function(e) {
    e.preventDefault()
    if (!this.cm.isReadOnly())
      { operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0) }
  },

  readOnlyChanged: function(val) {
    this.div.contentEditable = String(val != "nocursor")
  },

  onContextMenu: nothing,
  resetPosition: nothing,

  needsContentAttribute: true
  }, ContentEditableInput.prototype)

function posToDOM(cm, pos) {
  var view = findViewForLine(cm, pos.line)
  if (!view || view.hidden) { return null }
  var line = getLine(cm.doc, pos.line)
  var info = mapFromLineView(view, line, pos.line)

  var order = getOrder(line), side = "left"
  if (order) {
    var partPos = getBidiPartAt(order, pos.ch)
    side = partPos % 2 ? "right" : "left"
  }
  var result = nodeAndOffsetInLineMap(info.map, pos.ch, side)
  result.offset = result.collapse == "right" ? result.end : result.start
  return result
}

function badPos(pos, bad) { if (bad) { pos.bad = true; } return pos }

function domTextBetween(cm, from, to, fromLine, toLine) {
  var text = "", closing = false, lineSep = cm.doc.lineSeparator()
  function recognizeMarker(id) { return function (marker) { return marker.id == id; } }
  function walk(node) {
    if (node.nodeType == 1) {
      var cmText = node.getAttribute("cm-text")
      if (cmText != null) {
        if (cmText == "") { cmText = node.textContent.replace(/\u200b/g, "") }
        text += cmText
        return
      }
      var markerID = node.getAttribute("cm-marker"), range
      if (markerID) {
        var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID))
        if (found.length && (range = found[0].find()))
          { text += getBetween(cm.doc, range.from, range.to).join(lineSep) }
        return
      }
      if (node.getAttribute("contenteditable") == "false") { return }
      for (var i = 0; i < node.childNodes.length; i++)
        { walk(node.childNodes[i]) }
      if (/^(pre|div|p)$/i.test(node.nodeName))
        { closing = true }
    } else if (node.nodeType == 3) {
      var val = node.nodeValue
      if (!val) { return }
      if (closing) {
        text += lineSep
        closing = false
      }
      text += val
    }
  }
  for (;;) {
    walk(from)
    if (from == to) { break }
    from = from.nextSibling
  }
  return text
}

function domToPos(cm, node, offset) {
  var lineNode
  if (node == cm.display.lineDiv) {
    lineNode = cm.display.lineDiv.childNodes[offset]
    if (!lineNode) { return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true) }
    node = null; offset = 0
  } else {
    for (lineNode = node;; lineNode = lineNode.parentNode) {
      if (!lineNode || lineNode == cm.display.lineDiv) { return null }
      if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) { break }
    }
  }
  for (var i = 0; i < cm.display.view.length; i++) {
    var lineView = cm.display.view[i]
    if (lineView.node == lineNode)
      { return locateNodeInLineView(lineView, node, offset) }
  }
}

function locateNodeInLineView(lineView, node, offset) {
  var wrapper = lineView.text.firstChild, bad = false
  if (!node || !contains(wrapper, node)) { return badPos(Pos(lineNo(lineView.line), 0), true) }
  if (node == wrapper) {
    bad = true
    node = wrapper.childNodes[offset]
    offset = 0
    if (!node) {
      var line = lineView.rest ? lst(lineView.rest) : lineView.line
      return badPos(Pos(lineNo(line), line.text.length), bad)
    }
  }

  var textNode = node.nodeType == 3 ? node : null, topNode = node
  if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
    textNode = node.firstChild
    if (offset) { offset = textNode.nodeValue.length }
  }
  while (topNode.parentNode != wrapper) { topNode = topNode.parentNode }
  var measure = lineView.measure, maps = measure.maps

  function find(textNode, topNode, offset) {
    for (var i = -1; i < (maps ? maps.length : 0); i++) {
      var map = i < 0 ? measure.map : maps[i]
      for (var j = 0; j < map.length; j += 3) {
        var curNode = map[j + 2]
        if (curNode == textNode || curNode == topNode) {
          var line = lineNo(i < 0 ? lineView.line : lineView.rest[i])
          var ch = map[j] + offset
          if (offset < 0 || curNode != textNode) { ch = map[j + (offset ? 1 : 0)] }
          return Pos(line, ch)
        }
      }
    }
  }
  var found = find(textNode, topNode, offset)
  if (found) { return badPos(found, bad) }

  // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
  for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
    found = find(after, after.firstChild, 0)
    if (found)
      { return badPos(Pos(found.line, found.ch - dist), bad) }
    else
      { dist += after.textContent.length }
  }
  for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
    found = find(before, before.firstChild, -1)
    if (found)
      { return badPos(Pos(found.line, found.ch + dist$1), bad) }
    else
      { dist$1 += before.textContent.length }
  }
}

// TEXTAREA INPUT STYLE

function TextareaInput(cm) {
  this.cm = cm
  // See input.poll and input.reset
  this.prevInput = ""

  // Flag that indicates whether we expect input to appear real soon
  // now (after some event like 'keypress' or 'input') and are
  // polling intensively.
  this.pollingFast = false
  // Self-resetting timeout for the poller
  this.polling = new Delayed()
  // Tracks when input.reset has punted to just putting a short
  // string into the textarea instead of the full selection.
  this.inaccurateSelection = false
  // Used to work around IE issue with selection being forgotten when focus moves away from textarea
  this.hasSelection = false
  this.composing = null
}

TextareaInput.prototype = copyObj({
  init: function(display) {
    var this$1 = this;

    var input = this, cm = this.cm

    // Wraps and hides input textarea
    var div = this.wrapper = hiddenTextarea()
    // The semihidden textarea that is focused when the editor is
    // focused, and receives input.
    var te = this.textarea = div.firstChild
    display.wrapper.insertBefore(div, display.wrapper.firstChild)

    // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
    if (ios) { te.style.width = "0px" }

    on(te, "input", function () {
      if (ie && ie_version >= 9 && this$1.hasSelection) { this$1.hasSelection = null }
      input.poll()
    })

    on(te, "paste", function (e) {
      if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }

      cm.state.pasteIncoming = true
      input.fastPoll()
    })

    function prepareCopyCut(e) {
      if (signalDOMEvent(cm, e)) { return }
      if (cm.somethingSelected()) {
        setLastCopied({lineWise: false, text: cm.getSelections()})
        if (input.inaccurateSelection) {
          input.prevInput = ""
          input.inaccurateSelection = false
          te.value = lastCopied.text.join("\n")
          selectInput(te)
        }
      } else if (!cm.options.lineWiseCopyCut) {
        return
      } else {
        var ranges = copyableRanges(cm)
        setLastCopied({lineWise: true, text: ranges.text})
        if (e.type == "cut") {
          cm.setSelections(ranges.ranges, null, sel_dontScroll)
        } else {
          input.prevInput = ""
          te.value = ranges.text.join("\n")
          selectInput(te)
        }
      }
      if (e.type == "cut") { cm.state.cutIncoming = true }
    }
    on(te, "cut", prepareCopyCut)
    on(te, "copy", prepareCopyCut)

    on(display.scroller, "paste", function (e) {
      if (eventInWidget(display, e) || signalDOMEvent(cm, e)) { return }
      cm.state.pasteIncoming = true
      input.focus()
    })

    // Prevent normal selection in the editor (we handle our own)
    on(display.lineSpace, "selectstart", function (e) {
      if (!eventInWidget(display, e)) { e_preventDefault(e) }
    })

    on(te, "compositionstart", function () {
      var start = cm.getCursor("from")
      if (input.composing) { input.composing.range.clear() }
      input.composing = {
        start: start,
        range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
      }
    })
    on(te, "compositionend", function () {
      if (input.composing) {
        input.poll()
        input.composing.range.clear()
        input.composing = null
      }
    })
  },

  prepareSelection: function() {
    // Redraw the selection and/or cursor
    var cm = this.cm, display = cm.display, doc = cm.doc
    var result = prepareSelection(cm)

    // Move the hidden textarea near the cursor to prevent scrolling artifacts
    if (cm.options.moveInputWithCursor) {
      var headPos = cursorCoords(cm, doc.sel.primary().head, "div")
      var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect()
      result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                          headPos.top + lineOff.top - wrapOff.top))
      result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                           headPos.left + lineOff.left - wrapOff.left))
    }

    return result
  },

  showSelection: function(drawn) {
    var cm = this.cm, display = cm.display
    removeChildrenAndAdd(display.cursorDiv, drawn.cursors)
    removeChildrenAndAdd(display.selectionDiv, drawn.selection)
    if (drawn.teTop != null) {
      this.wrapper.style.top = drawn.teTop + "px"
      this.wrapper.style.left = drawn.teLeft + "px"
    }
  },

  // Reset the input to correspond to the selection (or to be empty,
  // when not typing and nothing is selected)
  reset: function(typing) {
    if (this.contextMenuPending) { return }
    var minimal, selected, cm = this.cm, doc = cm.doc
    if (cm.somethingSelected()) {
      this.prevInput = ""
      var range = doc.sel.primary()
      minimal = hasCopyEvent &&
        (range.to().line - range.from().line > 100 || (selected = cm.getSelection()).length > 1000)
      var content = minimal ? "-" : selected || cm.getSelection()
      this.textarea.value = content
      if (cm.state.focused) { selectInput(this.textarea) }
      if (ie && ie_version >= 9) { this.hasSelection = content }
    } else if (!typing) {
      this.prevInput = this.textarea.value = ""
      if (ie && ie_version >= 9) { this.hasSelection = null }
    }
    this.inaccurateSelection = minimal
  },

  getField: function() { return this.textarea },

  supportsTouch: function() { return false },

  focus: function() {
    if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
      try { this.textarea.focus() }
      catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
    }
  },

  blur: function() { this.textarea.blur() },

  resetPosition: function() {
    this.wrapper.style.top = this.wrapper.style.left = 0
  },

  receivedFocus: function() { this.slowPoll() },

  // Poll for input changes, using the normal rate of polling. This
  // runs as long as the editor is focused.
  slowPoll: function() {
    var this$1 = this;

    if (this.pollingFast) { return }
    this.polling.set(this.cm.options.pollInterval, function () {
      this$1.poll()
      if (this$1.cm.state.focused) { this$1.slowPoll() }
    })
  },

  // When an event has just come in that is likely to add or change
  // something in the input textarea, we poll faster, to ensure that
  // the change appears on the screen quickly.
  fastPoll: function() {
    var missed = false, input = this
    input.pollingFast = true
    function p() {
      var changed = input.poll()
      if (!changed && !missed) {missed = true; input.polling.set(60, p)}
      else {input.pollingFast = false; input.slowPoll()}
    }
    input.polling.set(20, p)
  },

  // Read input from the textarea, and update the document to match.
  // When something is selected, it is present in the textarea, and
  // selected (unless it is huge, in which case a placeholder is
  // used). When nothing is selected, the cursor sits after previously
  // seen text (can be empty), which is stored in prevInput (we must
  // not reset the textarea when typing, because that breaks IME).
  poll: function() {
    var this$1 = this;

    var cm = this.cm, input = this.textarea, prevInput = this.prevInput
    // Since this is called a *lot*, try to bail out as cheaply as
    // possible when it is clear that nothing happened. hasSelection
    // will be the case when there is a lot of text in the textarea,
    // in which case reading its value would be expensive.
    if (this.contextMenuPending || !cm.state.focused ||
        (hasSelection(input) && !prevInput && !this.composing) ||
        cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
      { return false }

    var text = input.value
    // If nothing changed, bail.
    if (text == prevInput && !cm.somethingSelected()) { return false }
    // Work around nonsensical selection resetting in IE9/10, and
    // inexplicable appearance of private area unicode characters on
    // some key combos in Mac (#2689).
    if (ie && ie_version >= 9 && this.hasSelection === text ||
        mac && /[\uf700-\uf7ff]/.test(text)) {
      cm.display.input.reset()
      return false
    }

    if (cm.doc.sel == cm.display.selForContextMenu) {
      var first = text.charCodeAt(0)
      if (first == 0x200b && !prevInput) { prevInput = "\u200b" }
      if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo") }
    }
    // Find the part of the input that is actually new
    var same = 0, l = Math.min(prevInput.length, text.length)
    while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) { ++same }

    runInOp(cm, function () {
      applyTextInput(cm, text.slice(same), prevInput.length - same,
                     null, this$1.composing ? "*compose" : null)

      // Don't leave long text in the textarea, since it makes further polling slow
      if (text.length > 1000 || text.indexOf("\n") > -1) { input.value = this$1.prevInput = "" }
      else { this$1.prevInput = text }

      if (this$1.composing) {
        this$1.composing.range.clear()
        this$1.composing.range = cm.markText(this$1.composing.start, cm.getCursor("to"),
                                           {className: "CodeMirror-composing"})
      }
    })
    return true
  },

  ensurePolled: function() {
    if (this.pollingFast && this.poll()) { this.pollingFast = false }
  },

  onKeyPress: function() {
    if (ie && ie_version >= 9) { this.hasSelection = null }
    this.fastPoll()
  },

  onContextMenu: function(e) {
    var input = this, cm = input.cm, display = cm.display, te = input.textarea
    var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop
    if (!pos || presto) { return } // Opera is difficult.

    // Reset the current text selection only if the click is done outside of the selection
    // and 'resetSelectionOnContextMenu' option is true.
    var reset = cm.options.resetSelectionOnContextMenu
    if (reset && cm.doc.sel.contains(pos) == -1)
      { operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll) }

    var oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText
    input.wrapper.style.cssText = "position: absolute"
    var wrapperBox = input.wrapper.getBoundingClientRect()
    te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);"
    var oldScrollY
    if (webkit) { oldScrollY = window.scrollY } // Work around Chrome issue (#2712)
    display.input.focus()
    if (webkit) { window.scrollTo(null, oldScrollY) }
    display.input.reset()
    // Adds "Select all" to context menu in FF
    if (!cm.somethingSelected()) { te.value = input.prevInput = " " }
    input.contextMenuPending = true
    display.selForContextMenu = cm.doc.sel
    clearTimeout(display.detectingSelectAll)

    // Select-all will be greyed out if there's nothing to select, so
    // this adds a zero-width space so that we can later check whether
    // it got selected.
    function prepareSelectAllHack() {
      if (te.selectionStart != null) {
        var selected = cm.somethingSelected()
        var extval = "\u200b" + (selected ? te.value : "")
        te.value = "\u21da" // Used to catch context-menu undo
        te.value = extval
        input.prevInput = selected ? "" : "\u200b"
        te.selectionStart = 1; te.selectionEnd = extval.length
        // Re-set this, in case some other handler touched the
        // selection in the meantime.
        display.selForContextMenu = cm.doc.sel
      }
    }
    function rehide() {
      input.contextMenuPending = false
      input.wrapper.style.cssText = oldWrapperCSS
      te.style.cssText = oldCSS
      if (ie && ie_version < 9) { display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos) }

      // Try to detect the user choosing select-all
      if (te.selectionStart != null) {
        if (!ie || (ie && ie_version < 9)) { prepareSelectAllHack() }
        var i = 0, poll = function () {
          if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
              te.selectionEnd > 0 && input.prevInput == "\u200b")
            { operation(cm, selectAll)(cm) }
          else if (i++ < 10) { display.detectingSelectAll = setTimeout(poll, 500) }
          else { display.input.reset() }
        }
        display.detectingSelectAll = setTimeout(poll, 200)
      }
    }

    if (ie && ie_version >= 9) { prepareSelectAllHack() }
    if (captureRightClick) {
      e_stop(e)
      var mouseup = function () {
        off(window, "mouseup", mouseup)
        setTimeout(rehide, 20)
      }
      on(window, "mouseup", mouseup)
    } else {
      setTimeout(rehide, 50)
    }
  },

  readOnlyChanged: function(val) {
    if (!val) { this.reset() }
  },

  setUneditable: nothing,

  needsContentAttribute: false
}, TextareaInput.prototype)

function fromTextArea(textarea, options) {
  options = options ? copyObj(options) : {}
  options.value = textarea.value
  if (!options.tabindex && textarea.tabIndex)
    { options.tabindex = textarea.tabIndex }
  if (!options.placeholder && textarea.placeholder)
    { options.placeholder = textarea.placeholder }
  // Set autofocus to true if this textarea is focused, or if it has
  // autofocus and no other element is focused.
  if (options.autofocus == null) {
    var hasFocus = activeElt()
    options.autofocus = hasFocus == textarea ||
      textarea.getAttribute("autofocus") != null && hasFocus == document.body
  }

  function save() {textarea.value = cm.getValue()}

  var realSubmit
  if (textarea.form) {
    on(textarea.form, "submit", save)
    // Deplorable hack to make the submit method do the right thing.
    if (!options.leaveSubmitMethodAlone) {
      var form = textarea.form
      realSubmit = form.submit
      try {
        var wrappedSubmit = form.submit = function () {
          save()
          form.submit = realSubmit
          form.submit()
          form.submit = wrappedSubmit
        }
      } catch(e) {}
    }
  }

  options.finishInit = function (cm) {
    cm.save = save
    cm.getTextArea = function () { return textarea; }
    cm.toTextArea = function () {
      cm.toTextArea = isNaN // Prevent this from being ran twice
      save()
      textarea.parentNode.removeChild(cm.getWrapperElement())
      textarea.style.display = ""
      if (textarea.form) {
        off(textarea.form, "submit", save)
        if (typeof textarea.form.submit == "function")
          { textarea.form.submit = realSubmit }
      }
    }
  }

  textarea.style.display = "none"
  var cm = CodeMirror(function (node) { return textarea.parentNode.insertBefore(node, textarea.nextSibling); },
    options)
  return cm
}

function addLegacyProps(CodeMirror) {
  CodeMirror.off = off
  CodeMirror.on = on
  CodeMirror.wheelEventPixels = wheelEventPixels
  CodeMirror.Doc = Doc
  CodeMirror.splitLines = splitLinesAuto
  CodeMirror.countColumn = countColumn
  CodeMirror.findColumn = findColumn
  CodeMirror.isWordChar = isWordCharBasic
  CodeMirror.Pass = Pass
  CodeMirror.signal = signal
  CodeMirror.Line = Line
  CodeMirror.changeEnd = changeEnd
  CodeMirror.scrollbarModel = scrollbarModel
  CodeMirror.Pos = Pos
  CodeMirror.cmpPos = cmp
  CodeMirror.modes = modes
  CodeMirror.mimeModes = mimeModes
  CodeMirror.resolveMode = resolveMode
  CodeMirror.getMode = getMode
  CodeMirror.modeExtensions = modeExtensions
  CodeMirror.extendMode = extendMode
  CodeMirror.copyState = copyState
  CodeMirror.startState = startState
  CodeMirror.innerMode = innerMode
  CodeMirror.commands = commands
  CodeMirror.keyMap = keyMap
  CodeMirror.keyName = keyName
  CodeMirror.isModifierKey = isModifierKey
  CodeMirror.lookupKey = lookupKey
  CodeMirror.normalizeKeyMap = normalizeKeyMap
  CodeMirror.StringStream = StringStream
  CodeMirror.SharedTextMarker = SharedTextMarker
  CodeMirror.TextMarker = TextMarker
  CodeMirror.LineWidget = LineWidget
  CodeMirror.e_preventDefault = e_preventDefault
  CodeMirror.e_stopPropagation = e_stopPropagation
  CodeMirror.e_stop = e_stop
  CodeMirror.addClass = addClass
  CodeMirror.contains = contains
  CodeMirror.rmClass = rmClass
  CodeMirror.keyNames = keyNames
}

// EDITOR CONSTRUCTOR

defineOptions(CodeMirror)

addEditorMethods(CodeMirror)

// Set up methods on CodeMirror's prototype to redirect to the editor's document.
var dontDelegate = "iter insert remove copy getEditor constructor".split(" ")
for (var prop in Doc.prototype) { if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
  { CodeMirror.prototype[prop] = (function(method) {
    return function() {return method.apply(this.doc, arguments)}
  })(Doc.prototype[prop]) } }

eventMixin(Doc)

// INPUT HANDLING

CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput}

// MODE DEFINITION AND QUERYING

// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
CodeMirror.defineMode = function(name/*, mode, …*/) {
  if (!CodeMirror.defaults.mode && name != "null") { CodeMirror.defaults.mode = name }
  defineMode.apply(this, arguments)
}

CodeMirror.defineMIME = defineMIME

// Minimal default mode.
CodeMirror.defineMode("null", function () { return ({token: function (stream) { return stream.skipToEnd(); }}); })
CodeMirror.defineMIME("text/plain", "null")

// EXTENSIONS

CodeMirror.defineExtension = function (name, func) {
  CodeMirror.prototype[name] = func
}
CodeMirror.defineDocExtension = function (name, func) {
  Doc.prototype[name] = func
}

CodeMirror.fromTextArea = fromTextArea

addLegacyProps(CodeMirror)

CodeMirror.version = "5.20.2"

return CodeMirror;

})));
},{}],31:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("haskell", function(_config, modeConfig) {

  function switchState(source, setState, f) {
    setState(f);
    return f(source, setState);
  }

  // These should all be Unicode extended, as per the Haskell 2010 report
  var smallRE = /[a-z_]/;
  var largeRE = /[A-Z]/;
  var digitRE = /\d/;
  var hexitRE = /[0-9A-Fa-f]/;
  var octitRE = /[0-7]/;
  var idRE = /[a-z_A-Z0-9'\xa1-\uffff]/;
  var symbolRE = /[-!#$%&*+.\/<=>?@\\^|~:]/;
  var specialRE = /[(),;[\]`{}]/;
  var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer

  function normal(source, setState) {
    if (source.eatWhile(whiteCharRE)) {
      return null;
    }

    var ch = source.next();
    if (specialRE.test(ch)) {
      if (ch == '{' && source.eat('-')) {
        var t = "comment";
        if (source.eat('#')) {
          t = "meta";
        }
        return switchState(source, setState, ncomment(t, 1));
      }
      return null;
    }

    if (ch == '\'') {
      if (source.eat('\\')) {
        source.next();  // should handle other escapes here
      }
      else {
        source.next();
      }
      if (source.eat('\'')) {
        return "string";
      }
      return "string error";
    }

    if (ch == '"') {
      return switchState(source, setState, stringLiteral);
    }

    if (largeRE.test(ch)) {
      source.eatWhile(idRE);
      if (source.eat('.')) {
        return "qualifier";
      }
      return "variable-2";
    }

    if (smallRE.test(ch)) {
      source.eatWhile(idRE);
      return "variable";
    }

    if (digitRE.test(ch)) {
      if (ch == '0') {
        if (source.eat(/[xX]/)) {
          source.eatWhile(hexitRE); // should require at least 1
          return "integer";
        }
        if (source.eat(/[oO]/)) {
          source.eatWhile(octitRE); // should require at least 1
          return "number";
        }
      }
      source.eatWhile(digitRE);
      var t = "number";
      if (source.match(/^\.\d+/)) {
        t = "number";
      }
      if (source.eat(/[eE]/)) {
        t = "number";
        source.eat(/[-+]/);
        source.eatWhile(digitRE); // should require at least 1
      }
      return t;
    }

    if (ch == "." && source.eat("."))
      return "keyword";

    if (symbolRE.test(ch)) {
      if (ch == '-' && source.eat(/-/)) {
        source.eatWhile(/-/);
        if (!source.eat(symbolRE)) {
          source.skipToEnd();
          return "comment";
        }
      }
      var t = "variable";
      if (ch == ':') {
        t = "variable-2";
      }
      source.eatWhile(symbolRE);
      return t;
    }

    return "error";
  }

  function ncomment(type, nest) {
    if (nest == 0) {
      return normal;
    }
    return function(source, setState) {
      var currNest = nest;
      while (!source.eol()) {
        var ch = source.next();
        if (ch == '{' && source.eat('-')) {
          ++currNest;
        }
        else if (ch == '-' && source.eat('}')) {
          --currNest;
          if (currNest == 0) {
            setState(normal);
            return type;
          }
        }
      }
      setState(ncomment(type, currNest));
      return type;
    };
  }

  function stringLiteral(source, setState) {
    while (!source.eol()) {
      var ch = source.next();
      if (ch == '"') {
        setState(normal);
        return "string";
      }
      if (ch == '\\') {
        if (source.eol() || source.eat(whiteCharRE)) {
          setState(stringGap);
          return "string";
        }
        if (source.eat('&')) {
        }
        else {
          source.next(); // should handle other escapes here
        }
      }
    }
    setState(normal);
    return "string error";
  }

  function stringGap(source, setState) {
    if (source.eat('\\')) {
      return switchState(source, setState, stringLiteral);
    }
    source.next();
    setState(normal);
    return "error";
  }


  var wellKnownWords = (function() {
    var wkw = {};
    function setType(t) {
      return function () {
        for (var i = 0; i < arguments.length; i++)
          wkw[arguments[i]] = t;
      };
    }

    setType("keyword")(
      "case", "class", "data", "default", "deriving", "do", "else", "foreign",
      "if", "import", "in", "infix", "infixl", "infixr", "instance", "let",
      "module", "newtype", "of", "then", "type", "where", "_");

    setType("keyword")(
      "\.\.", ":", "::", "=", "\\", "<-", "->", "@", "~", "=>");

    setType("builtin")(
      "!!", "$!", "$", "&&", "+", "++", "-", ".", "/", "/=", "<", "<=", "=<<",
      "==", ">", ">=", ">>", ">>=", "^", "^^", "||", "*", "**");

    setType("builtin")(
      "Bool", "Bounded", "Char", "Double", "EQ", "Either", "Enum", "Eq",
      "False", "FilePath", "Float", "Floating", "Fractional", "Functor", "GT",
      "IO", "IOError", "Int", "Integer", "Integral", "Just", "LT", "Left",
      "Maybe", "Monad", "Nothing", "Num", "Ord", "Ordering", "Rational", "Read",
      "ReadS", "Real", "RealFloat", "RealFrac", "Right", "Show", "ShowS",
      "String", "True");

    setType("builtin")(
      "abs", "acos", "acosh", "all", "and", "any", "appendFile", "asTypeOf",
      "asin", "asinh", "atan", "atan2", "atanh", "break", "catch", "ceiling",
      "compare", "concat", "concatMap", "const", "cos", "cosh", "curry",
      "cycle", "decodeFloat", "div", "divMod", "drop", "dropWhile", "either",
      "elem", "encodeFloat", "enumFrom", "enumFromThen", "enumFromThenTo",
      "enumFromTo", "error", "even", "exp", "exponent", "fail", "filter",
      "flip", "floatDigits", "floatRadix", "floatRange", "floor", "fmap",
      "foldl", "foldl1", "foldr", "foldr1", "fromEnum", "fromInteger",
      "fromIntegral", "fromRational", "fst", "gcd", "getChar", "getContents",
      "getLine", "head", "id", "init", "interact", "ioError", "isDenormalized",
      "isIEEE", "isInfinite", "isNaN", "isNegativeZero", "iterate", "last",
      "lcm", "length", "lex", "lines", "log", "logBase", "lookup", "map",
      "mapM", "mapM_", "max", "maxBound", "maximum", "maybe", "min", "minBound",
      "minimum", "mod", "negate", "not", "notElem", "null", "odd", "or",
      "otherwise", "pi", "pred", "print", "product", "properFraction",
      "putChar", "putStr", "putStrLn", "quot", "quotRem", "read", "readFile",
      "readIO", "readList", "readLn", "readParen", "reads", "readsPrec",
      "realToFrac", "recip", "rem", "repeat", "replicate", "return", "reverse",
      "round", "scaleFloat", "scanl", "scanl1", "scanr", "scanr1", "seq",
      "sequence", "sequence_", "show", "showChar", "showList", "showParen",
      "showString", "shows", "showsPrec", "significand", "signum", "sin",
      "sinh", "snd", "span", "splitAt", "sqrt", "subtract", "succ", "sum",
      "tail", "take", "takeWhile", "tan", "tanh", "toEnum", "toInteger",
      "toRational", "truncate", "uncurry", "undefined", "unlines", "until",
      "unwords", "unzip", "unzip3", "userError", "words", "writeFile", "zip",
      "zip3", "zipWith", "zipWith3");

    var override = modeConfig.overrideKeywords;
    if (override) for (var word in override) if (override.hasOwnProperty(word))
      wkw[word] = override[word];

    return wkw;
  })();



  return {
    startState: function ()  { return { f: normal }; },
    copyState:  function (s) { return { f: s.f }; },

    token: function(stream, state) {
      var t = state.f(stream, function(s) { state.f = s; });
      var w = stream.current();
      return wellKnownWords.hasOwnProperty(w) ? wellKnownWords[w] : t;
    },

    blockCommentStart: "{-",
    blockCommentEnd: "-}",
    lineComment: "--"
  };

});

CodeMirror.defineMIME("text/x-haskell", "haskell");

});

},{"../../lib/codemirror":30}],32:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

function expressionAllowed(stream, state, backUp) {
  return /^(?:operator|sof|keyword c|case|new|[\[{}\(,;:]|=>)$/.test(state.lastType) ||
    (state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0))))
}

CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonldMode = parserConfig.jsonld;
  var jsonMode = parserConfig.json || jsonldMode;
  var isTS = parserConfig.typescript;
  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    var jsKeywords = {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": C, "break": C, "continue": C, "new": kw("new"), "delete": C, "throw": C, "debugger": C,
      "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C,
      "await": C, "async": kw("async")
    };

    // Extend the 'normal' keywords with the TypeScript language extensions
    if (isTS) {
      var type = {type: "variable", style: "variable-3"};
      var tsKeywords = {
        // object-like things
        "interface": kw("class"),
        "implements": C,
        "namespace": C,
        "module": kw("module"),
        "enum": kw("module"),
        "type": kw("type"),

        // scope modifiers
        "public": kw("modifier"),
        "private": kw("modifier"),
        "protected": kw("modifier"),
        "abstract": kw("modifier"),

        // operators
        "as": operator,

        // types
        "string": type, "number": type, "boolean": type, "any": type
      };

      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr];
      }
    }

    return jsKeywords;
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^]/;
  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

  function readRegexp(stream) {
    var escaped = false, next, inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;
        else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/o/i)) {
      stream.eatWhile(/[0-7]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/b/i)) {
      stream.eatWhile(/[01]/i);
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (expressionAllowed(stream, state, 1)) {
        readRegexp(stream);
        stream.match(/^\b(([gimyu])(?![gimyu]*\2))+\b/);
        return ret("regexp", "string-2");
      } else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    } else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", "operator", stream.current());
    } else if (wordRE.test(ch)) {
      stream.eatWhile(wordRE);
      var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
      return (known && state.lastType != ".") ? ret(known.type, known.style, word) :
                     ret("variable", "variable", word);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
        state.tokenize = tokenBase;
        return ret("jsonld-keyword", "meta");
      }
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenQuasi(stream, state) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }

  var brackets = "([{}])";
  // This is a crude lookahead trick to try and notice that we're
  // parsing the argument patterns for a fat-arrow function before we
  // actually hit the arrow token. It only works if the arrow is on
  // the same line as the arguments and there's no strange noise
  // (comments) in between. Fallback is to only notice when we hit the
  // arrow, and not declare the arguments as locals for the arrow
  // body.
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;

    if (isTS) { // Try to skip TypeScript return type declarations after the arguments
      var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow))
      if (m) arrow = m.index
    }

    var depth = 0, sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) { ++pos; break; }
        if (--depth == 0) { if (ch == "(") sawSomething = true; break; }
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (wordRE.test(ch)) {
        sawSomething = true;
      } else if (/["'\/]/.test(ch)) {
        return;
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true, "jsonld-keyword": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next)
        if (v.name == varname) return true;
    }
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    function inList(list) {
      for (var v = list; v; v = v.next)
        if (v.name == varname) return true;
      return false;
    }
    var state = cx.state;
    cx.marked = "def";
    if (state.context) {
      if (inList(state.localVars)) return;
      state.localVars = {name: varname, next: state.localVars};
    } else {
      if (inList(state.globalVars)) return;
      if (parserConfig.globalVars)
        state.globalVars = {name: varname, next: state.globalVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: {name: "arguments"}};
  function pushcontext() {
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
    cx.state.localVars = defaultVars;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
        indent = outer.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function exp(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(exp);
    };
    return exp;
  }

  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value.length), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), parenExpr, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), block, poplex);
    if (type == ";") return cont();
    if (type == "if") {
      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
        cx.state.cc.pop()();
      return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
    }
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), forspec, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), parenExpr, pushlex("}", "switch"), expect("{"),
                                      block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                     statement, poplex, popcontext);
    if (type == "class") return cont(pushlex("form"), className, poplex);
    if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
    if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
    if (type == "module") return cont(pushlex("form"), pattern, pushlex("}"), expect("{"), block, poplex, poplex)
    if (type == "type") return cont(typeexpr, expect("operator"), typeexpr, expect(";"));
    if (type == "async") return cont(statement)
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    return expressionInner(type, false);
  }
  function expressionNoComma(type) {
    return expressionInner(type, true);
  }
  function parenExpr(type) {
    if (type != "(") return pass()
    return cont(pushlex(")"), expression, expect(")"), poplex)
  }
  function expressionInner(type, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(pattern, ")"), poplex, expect("=>"), body, popcontext);
      else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }

    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef, maybeop);
    if (type == "class") return cont(pushlex("form"), classExpression, poplex);
    if (type == "keyword c" || type == "async") return cont(noComma ? maybeexpressionNoComma : maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    if (type == "quasi") return pass(quasi, maybeop);
    if (type == "new") return cont(maybeTarget(noComma));
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }
  function maybeexpressionNoComma(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expressionNoComma);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value)) return cont(me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") { return pass(quasi, me); }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
  }
  function quasi(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasi);
    return cont(expression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasi);
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expressionNoComma);
  }
  function maybeTarget(noComma) {
    return function(type) {
      if (type == ".") return cont(noComma ? targetNoComma : target);
      else return pass(noComma ? expressionNoComma : expression);
    };
  }
  function target(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
  }
  function targetNoComma(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "async") {
      cx.marked = "property";
      return cont(objprop);
    } else if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
      return cont(afterprop);
    } else if (type == "number" || type == "string") {
      cx.marked = jsonldMode ? "property" : (cx.style + " property");
      return cont(afterprop);
    } else if (type == "jsonld-keyword") {
      return cont(afterprop);
    } else if (type == "modifier") {
      return cont(objprop)
    } else if (type == "[") {
      return cont(expression, expect("]"), afterprop);
    } else if (type == "spread") {
      return cont(expression);
    } else if (type == ":") {
      return pass(afterprop)
    }
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end) {
    function proceed(type, value) {
      if (type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(function(type, value) {
          if (type == end || value == end) return pass()
          return pass(what)
        }, proceed);
      }
      if (type == end || value == end) return cont();
      return cont(expect(end));
    }
    return function(type, value) {
      if (type == end || value == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++)
      cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type, value) {
    if (isTS) {
      if (type == ":") return cont(typeexpr);
      if (value == "?") return cont(maybetype);
    }
  }
  function typeexpr(type) {
    if (type == "variable") {cx.marked = "variable-3"; return cont(afterType);}
    if (type == "{") return cont(commasep(typeprop, "}"))
    if (type == "(") return cont(commasep(typearg, ")"), maybeReturnType)
  }
  function maybeReturnType(type) {
    if (type == "=>") return cont(typeexpr)
  }
  function typeprop(type) {
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property"
      return cont(typeprop)
    } else if (type == ":") {
      return cont(typeexpr)
    }
  }
  function typearg(type) {
    if (type == "variable") return cont(typearg)
    else if (type == ":") return cont(typeexpr)
  }
  function afterType(type, value) {
    if (value == "<") return cont(commasep(typeexpr, ">"), afterType)
    if (type == "[") return cont(expect("]"), afterType)
  }
  function vardef() {
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (type == "modifier") return cont(pattern)
    if (type == "variable") { register(value); return cont(); }
    if (type == "spread") return cont(pattern);
    if (type == "[") return contCommasep(pattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    if (type == "spread") return cont(pattern);
    if (type == "}") return pass();
    return cont(expect(":"), pattern, maybeAssign);
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
  }
  function forspec(type) {
    if (type == "(") return cont(pushlex(")"), forspec1, expect(")"), poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, expect(";"), forspec2);
    if (type == ";") return cont(forspec2);
    if (type == "variable") return cont(formaybeinof);
    return pass(expression, expect(";"), forspec2);
  }
  function formaybeinof(_type, value) {
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return cont(maybeoperatorComma, forspec2);
  }
  function forspec2(type, value) {
    if (type == ";") return cont(forspec3);
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return pass(expression, expect(";"), forspec3);
  }
  function forspec3(type) {
    if (type != ")") cont(expression);
  }
  function functiondef(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, maybetype, statement, popcontext);
  }
  function funarg(type) {
    if (type == "spread") return cont(funarg);
    return pass(pattern, maybetype, maybeAssign);
  }
  function classExpression(type, value) {
    // Class expressions may have an optional name.
    if (type == "variable") return className(type, value);
    return classNameAfter(type, value);
  }
  function className(type, value) {
    if (type == "variable") {register(value); return cont(classNameAfter);}
  }
  function classNameAfter(type, value) {
    if (value == "extends" || value == "implements") return cont(isTS ? typeexpr : expression, classNameAfter);
    if (type == "{") return cont(pushlex("}"), classBody, poplex);
  }
  function classBody(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      if ((value == "static" || value == "get" || value == "set" ||
           (isTS && (value == "public" || value == "private" || value == "protected" || value == "readonly" || value == "abstract"))) &&
          cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false)) {
        cx.marked = "keyword";
        return cont(classBody);
      }
      cx.marked = "property";
      return cont(isTS ? classfield : functiondef, classBody);
    }
    if (value == "*") {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (type == ";") return cont(classBody);
    if (type == "}") return cont();
  }
  function classfield(type, value) {
    if (value == "?") return cont(classfield)
    if (type == ":") return cont(typeexpr, maybeAssign)
    return pass(functiondef)
  }
  function afterExport(_type, value) {
    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
    return pass(statement);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    return pass(importSpec, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    if (value == "*") cx.marked = "keyword";
    return cont(maybeAs);
  }
  function maybeAs(_type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
  }
  function maybeFrom(_type, value) {
    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(commasep(expressionNoComma, "]"));
  }

  function isContinuedStatement(state, textAfter) {
    return state.lastType == "operator" || state.lastType == "," ||
      isOperatorChar.test(textAfter.charAt(0)) ||
      /[,.]/.test(textAfter.charAt(0));
  }

  // Interface

  return {
    startState: function(basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && {vars: parserConfig.localVars},
        indented: basecolumn || 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == tokenComment) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top
      // Kludge to prevent 'maybelse' from blocking lexical scope pops
      if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;
        else if (c != maybeelse) break;
      }
      while ((lexical.type == "stat" || lexical.type == "form") &&
             (firstChar == "}" || ((top = state.cc[state.cc.length - 1]) &&
                                   (top == maybeoperatorComma || top == maybeoperatorNoComma) &&
                                   !/^[,\.=+\-*:?[\(]/.test(textAfter))))
        lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info + 1 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    closeBrackets: "()[]{}''\"\"``",

    helperType: jsonMode ? "json" : "javascript",
    jsonldMode: jsonldMode,
    jsonMode: jsonMode,

    expressionAllowed: expressionAllowed,
    skipExpression: function(state) {
      var top = state.cc[state.cc.length - 1]
      if (top == expression || top == expressionNoComma) state.cc.pop()
    }
  };
});

CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/x-javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/ld+json", {name: "javascript", jsonld: true});
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

});

},{"../../lib/codemirror":30}],33:[function(require,module,exports){
var nargs = /\{([0-9a-zA-Z]+)\}/g
var slice = Array.prototype.slice

module.exports = template

function template(string) {
    var args

    if (arguments.length === 2 && typeof arguments[1] === "object") {
        args = arguments[1]
    } else {
        args = slice.call(arguments, 1)
    }

    if (!args || !args.hasOwnProperty) {
        args = {}
    }

    return string.replace(nargs, function replaceArg(match, i, index) {
        var result

        if (string[index - 1] === "{" &&
            string[index + match.length] === "}") {
            return i
        } else {
            result = args.hasOwnProperty(i) ? args[i] : null
            if (result === null || result === undefined) {
                return ""
            }

            return result
        }
    })
}

},{}],34:[function(require,module,exports){
'use strict';

var template = require('string-template');
var extend = require('xtend/mutable');
var assert = require('assert');

var isWordBoundary = /[_.-](\w|$)/g;

module.exports = TypedError;

function TypedError(args) {
    assert(args, 'TypedError: must specify options');
    assert(args.type, 'TypedError: must specify options.type');
    assert(args.message, 'TypedError: must specify options.message');

    assert(!has(args, 'fullType'),
        'TypedError: fullType field is reserved');

    var message = args.message;
    if (args.type && !args.name) {
        var errorName = camelCase(args.type) + 'Error';
        args.name = errorName[0].toUpperCase() + errorName.substr(1);
    }

    extend(createError, args);
    createError._name = args.name;

    return createError;

    function createError(opts) {
        var result = new Error();

        Object.defineProperty(result, 'type', {
            value: result.type,
            enumerable: true,
            writable: true,
            configurable: true
        });

        var options = extend({}, args, opts);
        if (!options.fullType) {
            options.fullType = options.type;
        }

        extend(result, options);
        if (opts && opts.message) {
            result.message = template(opts.message, options);
        } else if (message) {
            result.message = template(message, options);
        }

        return result;
    }
}

function camelCase(str) {
    return str.replace(isWordBoundary, upperCase);
}

function upperCase(_, x) {
    return x.toUpperCase();
}

function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

},{"assert":24,"string-template":33,"xtend/mutable":51}],35:[function(require,module,exports){
/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {
        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
        if (extra.tokenize) {
            comment.type = comment.type + 'Comment';
            if (extra.delegate) {
                comment = extra.delegate(comment);
            }
            extra.tokens.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokenValues.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokenValues.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            index = start;
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    // Using the following algorithm:
    // https://github.com/mozilla/sweet.js/wiki/design

    function advanceSlash() {
        var regex, previous, check;

        function testKeyword(value) {
            return value && (value.length > 1) && (value[0] >= 'a') && (value[0] <= 'z');
        }

        previous = extra.tokenValues[extra.tokens.length - 1];
        regex = (previous !== null);

        switch (previous) {
        case 'this':
        case ']':
            regex = false;
            break;

        case ')':
            check = extra.tokenValues[extra.openParenToken - 1];
            regex = (check === 'if' || check === 'while' || check === 'for' || check === 'with');
            break;

        case '}':
            // Dividing a function by anything makes little sense,
            // but we have to check for that.
            regex = false;
            if (testKeyword(extra.tokenValues[extra.openCurlyToken - 3])) {
                // Anonymous function, e.g. function(){} /42
                check = extra.tokenValues[extra.openCurlyToken - 4];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : false;
            } else if (testKeyword(extra.tokenValues[extra.openCurlyToken - 4])) {
                // Named function, e.g. function f(){} /42/
                check = extra.tokenValues[extra.openCurlyToken - 5];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : true;
            }
        }

        return regex ? collectRegex() : scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            if (extra.tokenValues) {
                extra.tokenValues.push((entry.type === 'Punctuator' || entry.type === 'Keyword') ? entry.value : null);
            }
            if (extra.tokenize) {
                if (!extra.range) {
                    delete entry.range;
                }
                if (!extra.loc) {
                    delete entry.loc;
                }
                if (extra.delegate) {
                    entry = extra.delegate(entry);
                }
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                innerComments,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }
            /**
             * patch innnerComments for properties empty block
             * `function a() {/** comments **\/}`
             */

            if (this.type === Syntax.BlockStatement && this.body.length === 0) {
                innerComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (this.range[1] >= comment.range[1]) {
                        innerComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                if (innerComments.length) {
                    this.innerComments = innerComments;
                    //bottomRight.push(this);
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, true);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey();
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        } else if (matchKeyword('let')) {
            if (kind === 'const' || kind === 'let') {
                tolerateUnexpectedToken(lookahead, Messages.UnexpectedToken);
            }
        }

        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            if (!strict && matchKeyword('let')) {
                return node.finishIdentifier(lex().value);
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();
        delegate = false;

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        if (matchKeyword('let') && isLexicalDeclaration()) {
            return parseLexicalDeclaration({inFor: false});
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var opt, list;

        opt = { inFor: options.inFor };
        list = [parseVariableDeclaration(opt)];

        while (match(',')) {
            lex();
            list.push(parseVariableDeclaration(opt));
        }

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [parseLexicalBinding(kind, options)];

        while (match(',')) {
            lex();
            list.push(parseLexicalBinding(kind, options));
        }

        return list;
    }


    function tokenizerState() {
        return {
            index: index,
            lineNumber: lineNumber,
            lineStart: lineStart,
            hasLineTerminator: hasLineTerminator,
            lastIndex: lastIndex,
            lastLineNumber: lastLineNumber,
            lastLineStart: lastLineStart,
            startIndex: startIndex,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lookahead: lookahead,
            tokenCount: extra.tokens ? extra.tokens.length : 0
        };
    }

    function resetTokenizerState(ts) {
        index = ts.index;
        lineNumber = ts.lineNumber;
        lineStart = ts.lineStart;
        hasLineTerminator = ts.hasLineTerminator;
        lastIndex = ts.lastIndex;
        lastLineNumber = ts.lastLineNumber;
        lastLineStart = ts.lastLineStart;
        startIndex = ts.startIndex;
        startLineNumber = ts.startLineNumber;
        startLineStart = ts.startLineStart;
        lookahead = ts.lookahead;
        if (extra.tokens) {
            extra.tokens.splice(ts.tokenCount, extra.tokens.length);
        }
    }

    function isLexicalDeclaration() {
        var lexical, ts;

        ts = tokenizerState();

        lex();
        lexical = (lookahead.type === Token.Identifier) || match('[') || match('{') ||
            matchKeyword('let') || matchKeyword('yield');

        resetTokenizerState(ts);

        return lexical;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                if (!strict && lookahead.value === 'in') {
                    init = init.finishIdentifier(kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
                    state.allowIn = false;
                    declarations = parseBindingList(kind, {inFor: true});
                    state.allowIn = previousAllowIn;

                    if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseExpression();
                        init = null;
                    } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseAssignmentExpression();
                        init = null;
                        forIn = false;
                    } else {
                        consumeSemicolon();
                        init = init.finishLexicalDeclaration(declarations, kind);
                    }
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }
        } else if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                    declaration = parseLexicalDeclaration({inFor: false});
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options, delegate) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenValues = [];
        extra.tokenize = true;
        extra.delegate = delegate;

        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            tokens = extra.tokens;
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.7.2';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],36:[function(require,module,exports){
(function(r,t){if(typeof define==="function"&&define.amd){define([],t)}else if(typeof module==="object"&&module.exports){module.exports=t()}else{r.Parsimmon=t()}})(this,function(){"use strict";var r={};function t(r){if(!(this instanceof t))return new t(r);this._=r}r.Parser=t;var n=t.prototype;function e(r,t){return{status:true,index:r,value:t,furthest:-1,expected:[]}}function u(r,t){return{status:false,index:-1,value:null,furthest:r,expected:[t]}}function a(r,t){if(!t)return r;if(r.furthest>t.furthest)return r;var n=r.furthest===t.furthest?i(r.expected,t.expected):t.expected;return{status:r.status,index:r.index,value:r.value,furthest:t.furthest,expected:n}}function i(r,t){var n=r.length;var e=t.length;if(n===0){return t}else if(e===0){return r}var u={};for(var a=0;a<n;a++){u[r[a]]=true}for(var a=0;a<e;a++){u[t[a]]=true}var i=[];for(var f in u){if(u.hasOwnProperty(f)){i.push(f)}}i.sort();return i}function f(r){if(!(r instanceof t)){throw new Error("not a parser: "+r)}}function o(r){if(typeof r!=="number"){throw new Error("not a number: "+r)}}function s(r){if(!(r instanceof RegExp)){throw new Error("not a regexp: "+r)}var t=E(r);for(var n=0;n<t.length;n++){var e=t.charAt(n);if(e!="i"&&e!="m"&&e!="u"){throw new Error('unsupported regexp flag "'+e+'": '+r)}}}function c(r){if(typeof r!=="function"){throw new Error("not a function: "+r)}}function v(r){if(typeof r!=="string"){throw new Error("not a string: "+r)}}function l(r){if(r.length===1)return r[0];return"one of "+r.join(", ")}function h(r,t){var n=t.index;var e=n.offset;if(e===r.length)return", got the end of the stream";var u=e>0?"'...":"'";var a=r.length-e>12?"...'":"'";return" at line "+n.line+" column "+n.column+", got "+u+r.slice(e,e+12)+a}var p=r.formatError=function(r,t){return"expected "+l(t.expected)+h(r,t)};n.parse=function(r){if(typeof r!=="string"){throw new Error(".parse must be called with a string as its argument")}var t=this.skip(W)._(r,0);return t.status?{status:true,value:t.value}:{status:false,index:G(r,t.furthest),expected:t.expected}};var d=r.seq=function(){var r=[].slice.call(arguments);var n=r.length;for(var u=0;u<n;u+=1){f(r[u])}return t(function(t,u){var i;var f=new Array(n);for(var o=0;o<n;o+=1){i=a(r[o]._(t,u),i);if(!i.status)return i;f[o]=i.value;u=i.index}return a(e(u,f),i)})};var g=r.seqMap=function(){var r=[].slice.call(arguments);if(r.length===0){throw new Error("seqMap needs at least one argument")}var t=r.pop();c(t);return d.apply(null,r).map(function(r){return t.apply(null,r)})};var x=r.custom=function(r){return t(r(e,u))};var m=r.alt=function(){var r=[].slice.call(arguments);var n=r.length;if(n===0)return k("zero alternates");for(var e=0;e<n;e+=1){f(r[e])}return t(function(t,n){var e;for(var u=0;u<r.length;u+=1){e=a(r[u]._(t,n),e);if(e.status)return e}return e})};var w=r.sepBy=function(t,n){return y(t,n).or(r.of([]))};var y=r.sepBy1=function(r,t){f(r);f(t);var n=t.then(r).many();return r.chain(function(r){return n.map(function(t){return[r].concat(t)})})};n.or=function(r){return m(this,r)};n.then=function(r){if(typeof r==="function"){throw new Error("chaining features of .then are no longer supported, use .chain instead")}f(r);return d(this,r).map(function(r){return r[1]})};n.many=function(){var r=this;return t(function(t,n){var u=[];var i;var f;for(;;){i=a(r._(t,n),i);if(i.status){n=i.index;u.push(i.value)}else{return a(e(n,u),i)}}})};n.times=function(r,n){if(arguments.length<2)n=r;var u=this;o(r);o(n);return t(function(t,i){var f=[];var o=i;var s;var c;for(var v=0;v<r;v+=1){s=u._(t,i);c=a(s,c);if(s.status){i=s.index;f.push(s.value)}else return c}for(;v<n;v+=1){s=u._(t,i);c=a(s,c);if(s.status){i=s.index;f.push(s.value)}else break}return a(e(i,f),c)})};n.result=function(r){return this.map(function(t){return r})};n.atMost=function(r){return this.times(0,r)};n.atLeast=function(r){var t=this;return g(this.times(r),this.many(),function(r,t){return r.concat(t)})};n.map=function(r){c(r);var n=this;return t(function(t,u){var i=n._(t,u);if(!i.status)return i;return a(e(i.index,r(i.value)),i)})};n.skip=function(r){return d(this,r).map(function(r){return r[0]})};n.mark=function(){return g(H,this,H,function(r,t,n){return{start:r,value:t,end:n}})};n.desc=function(r){var n=this;return t(function(t,e){var u=n._(t,e);if(!u.status)u.expected=[r];return u})};var _=r.string=function(r){var n=r.length;var a="'"+r+"'";v(r);return t(function(t,i){var f=t.slice(i,i+n);if(f===r){return e(i+n,f)}else{return u(i,a)}})};var E=function(r){var t=""+r;return t.slice(t.lastIndexOf("/")+1)};var O=r.regexp=function(r,n){s(r);if(arguments.length>=2){o(n)}else{n=0}var a=RegExp("^(?:"+r.source+")",E(r));var i=""+r;return t(function(r,t){var f=a.exec(r.slice(t));if(f){var o=f[0];var s=f[n];if(s!=null){return e(t+o.length,s)}}return u(t,i)})};r.regex=O;var b=r.succeed=function(r){return t(function(t,n){return e(n,r)})};var k=r.fail=function(r){return t(function(t,n){return u(n,r)})};var A=r.letter=O(/[a-z]/i).desc("a letter");var z=r.letters=O(/[a-z]*/i);var q=r.digit=O(/[0-9]/).desc("a digit");var M=r.digits=O(/[0-9]*/);var P=r.whitespace=O(/\s+/).desc("whitespace");var j=r.optWhitespace=O(/\s*/);var B=r.any=t(function(r,t){if(t>=r.length)return u(t,"any character");return e(t+1,r.charAt(t))});var R=r.all=t(function(r,t){return e(r.length,r.slice(t))});var W=r.eof=t(function(r,t){if(t<r.length)return u(t,"EOF");return e(t,null)});var F=r.test=function(r){c(r);return t(function(t,n){var a=t.charAt(n);if(n<t.length&&r(a)){return e(n+1,a)}else{return u(n,"a character matching "+r)}})};var I=r.oneOf=function(r){return F(function(t){return r.indexOf(t)>=0})};var L=r.noneOf=function(r){return F(function(t){return r.indexOf(t)<0})};var C=r.takeWhile=function(r){c(r);return t(function(t,n){var u=n;while(u<t.length&&r(t.charAt(u)))u+=1;return e(u,t.slice(n,u))})};var D=r.lazy=function(r,n){if(arguments.length<2){n=r;r=undefined}var e=t(function(r,t){e._=n()._;return e._(r,t)});if(r)e=e.desc(r);return e};var G=function(r,t){var n=r.slice(0,t).split("\n");var e=n.length;var u=n[n.length-1].length+1;return{offset:t,line:e,column:u}};var H=r.index=t(function(r,t){return e(t,G(r,t))});n.concat=n.or;n.empty=k("empty");n.of=t.of=r.of=b;n.ap=function(r){return g(this,r,function(r,t){return r(t)})};n.chain=function(r){var n=this;return t(function(t,e){var u=n._(t,e);if(!u.status)return u;var i=r(u.value);return a(i._(t,u.index),u)})};return r});

},{}],37:[function(require,module,exports){
var core = require('./lib/core');
exports = module.exports = require('./lib/async');
exports.core = core;
exports.isCore = function (x) { return core[x] };
exports.sync = require('./lib/sync');

},{"./lib/async":38,"./lib/core":41,"./lib/sync":43}],38:[function(require,module,exports){
(function (process){
var core = require('./core');
var fs = require('fs');
var path = require('path');
var caller = require('./caller.js');
var nodeModulesPaths = require('./node-modules-paths.js');
var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\//;

module.exports = function resolve (x, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!opts) opts = {};
    if (typeof x !== 'string') {
        return process.nextTick(function () {
            cb(new Error('path must be a string'));
        });
    }
    
    var isFile = opts.isFile || function (file, cb) {
        fs.stat(file, function (err, stat) {
            if (err && err.code === 'ENOENT') cb(null, false)
            else if (err) cb(err)
            else cb(null, stat.isFile() || stat.isFIFO())
        });
    };
    var readFile = opts.readFile || fs.readFile;
    
    var extensions = opts.extensions || [ '.js' ];
    var y = opts.basedir || path.dirname(caller());
    
    opts.paths = opts.paths || [];
    
    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(x)) {
        var res = path.resolve(y, x);
        if (x === '..') res += '/';
        if (/\/$/.test(x) && res === y) {
            loadAsDirectory(res, opts.package, onfile);
        }
        else loadAsFile(res, opts.package, onfile);
    }
    else loadNodeModules(x, y, function (err, n, pkg) {
        if (err) cb(err)
        else if (n) cb(null, n, pkg)
        else if (core[x]) return cb(null, x);
        else cb(new Error("Cannot find module '" + x + "' from '" + y + "'"))
    });
    
    function onfile (err, m, pkg) {
        if (err) cb(err)
        else if (m) cb(null, m, pkg)
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err)
            else if (d) cb(null, d, pkg)
            else cb(new Error("Cannot find module '" + x + "' from '" + y + "'"))
        })
    }
    
    function loadAsFile (x, pkg, cb) {
        if (typeof pkg === 'function') {
            cb = pkg;
            pkg = undefined;
        }
        
        var exts = [''].concat(extensions);
        load(exts, x, pkg)
		
		function load (exts, x, pkg) {
            if (exts.length === 0) return cb(null, undefined, pkg);
            var file = x + exts[0];
            
            if (pkg) onpkg(null, pkg)
            else loadpkg(path.dirname(file), onpkg);
            
            function onpkg (err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err)
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex (err, ex) {
                if (err) cb(err)
                else if (!ex) load(exts.slice(1), x, pkg)
                else cb(null, file, pkg)
            }
        }
    }
    
    function loadpkg (dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && /^\w:[\\\/]*$/.test(dir)) {
            return cb(null);
        }
        if (/[\\\/]node_modules[\\\/]*$/.test(dir)) return cb(null);
        
        var pkgfile = path.join(dir, 'package.json');
        isFile(pkgfile, function (err, ex) {
            // on err, ex is false
            if (!ex) return loadpkg(
                path.dirname(dir), cb
            );
            
            readFile(pkgfile, function (err, body) {
                if (err) cb(err);
                try { var pkg = JSON.parse(body) }
                catch (err) {}
                
                if (pkg && opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, pkgfile);
                }
                cb(null, pkg, dir);
            });
        });
    }
    
    function loadAsDirectory (x, fpkg, cb) {
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }
        
        var pkgfile = path.join(x, '/package.json');
        isFile(pkgfile, function (err, ex) {
            if (err) return cb(err);
            if (!ex) return loadAsFile(path.join(x, '/index'), fpkg, cb);
            
            readFile(pkgfile, function (err, body) {
                if (err) return cb(err);
                try {
                    var pkg = JSON.parse(body);
                }
                catch (err) {}
                
                if (opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, pkgfile);
                }
                
                if (pkg.main) {
                    if (pkg.main === '.' || pkg.main === './'){
                        pkg.main = 'index'
                    }
                    loadAsFile(path.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                        if (err) return cb(err);
                        if (m) return cb(null, m, pkg);
                        if (!pkg) return loadAsFile(path.join(x, '/index'), pkg, cb);

                        var dir = path.resolve(x, pkg.main);
                        loadAsDirectory(dir, pkg, function (err, n, pkg) {
                            if (err) return cb(err);
                            if (n) return cb(null, n, pkg);
                            loadAsFile(path.join(x, '/index'), pkg, cb);
                        });
                    });
                    return;
                }
                
                loadAsFile(path.join(x, '/index'), pkg, cb);
            });
        });
    }
    
    function loadNodeModules (x, start, cb) {
        (function process (dirs) {
            if (dirs.length === 0) return cb(null, undefined);
            var dir = dirs[0];
            
            var file = path.join(dir, '/', x);
            loadAsFile(file, undefined, onfile);
            
            function onfile (err, m, pkg) {
                if (err) return cb(err);
                if (m) return cb(null, m, pkg);
                loadAsDirectory(path.join(dir, '/', x), undefined, ondir);
            }
            
            function ondir (err, n, pkg) {
                if (err) return cb(err);
                if (n) return cb(null, n, pkg);
                process(dirs.slice(1));
            }
        })(nodeModulesPaths(start, opts));
    }
};

}).call(this,require('_process'))
},{"./caller.js":39,"./core":41,"./node-modules-paths.js":42,"_process":26,"fs":23,"path":25}],39:[function(require,module,exports){
module.exports = function () {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack };
    var stack = (new Error()).stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    return stack[2].getFileName();
};

},{}],40:[function(require,module,exports){
module.exports=[
    "assert",
    "buffer_ieee754",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "_debugger",
    "dgram",
    "dns",
    "domain",
    "events",
    "freelist",
    "fs",
    "http",
    "https",
    "_linklist",
    "module",
    "net",
    "os",
    "path",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "sys",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "vm",
    "zlib"
]

},{}],41:[function(require,module,exports){
module.exports = require('./core.json').reduce(function (acc, x) {
    acc[x] = true;
    return acc;
}, {});

},{"./core.json":40}],42:[function(require,module,exports){
(function (process){
var path = require('path');

module.exports = function (start, opts) {
    var modules = opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules']
    ;

    // ensure that `start` is an absolute path at this point,
    // resolving against the process' current working directory
    start = path.resolve(start);

    var prefix = '/';
    if (/^([A-Za-z]:)/.test(start)) {
        prefix = '';
    } else if (/^\\\\/.test(start)) {
        prefix = '\\\\';
    }

    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;

    var parts = start.split(splitRe);

    var dirs = [];
    for (var i = parts.length - 1; i >= 0; i--) {
        if (modules.indexOf(parts[i]) !== -1) continue;
        dirs = dirs.concat(modules.map(function(module_dir) {
            return prefix + path.join(
                path.join.apply(path, parts.slice(0, i + 1)),
                module_dir
            );
        }));
    }
    if (process.platform === 'win32'){
        dirs[dirs.length-1] = dirs[dirs.length-1].replace(":", ":\\");
    }
    return dirs.concat(opts.paths);
}

}).call(this,require('_process'))
},{"_process":26,"path":25}],43:[function(require,module,exports){
var core = require('./core');
var fs = require('fs');
var path = require('path');
var caller = require('./caller.js');
var nodeModulesPaths = require('./node-modules-paths.js');

module.exports = function (x, opts) {
    if (!opts) opts = {};
    var isFile = opts.isFile || function (file) {
        try { var stat = fs.statSync(file) }
        catch (err) { if (err && err.code === 'ENOENT') return false }
        return stat.isFile() || stat.isFIFO();
    };
    var readFileSync = opts.readFileSync || fs.readFileSync;
    
    var extensions = opts.extensions || [ '.js' ];
    var y = opts.basedir || path.dirname(caller());

    opts.paths = opts.paths || [];

    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(x)) {
        var res = path.resolve(y, x);
        if (x === '..') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return m;
    } else {
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
    }
    
    if (core[x]) return x;
    
    throw new Error("Cannot find module '" + x + "' from '" + y + "'");
    
    function loadAsFileSync (x) {
        if (isFile(x)) {
            return x;
        }
        
        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }
    
    function loadAsDirectorySync (x) {
        var pkgfile = path.join(x, '/package.json');
        if (isFile(pkgfile)) {
            var body = readFileSync(pkgfile, 'utf8');
            try {
                var pkg = JSON.parse(body);
                if (opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, x);
                }
                
                if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path.resolve(x, pkg.main));
                    if (n) return n;
                }
            }
            catch (err) {}
        }
        
        return loadAsFileSync(path.join( x, '/index'));
    }
    
    function loadNodeModulesSync (x, start) {
        var dirs = nodeModulesPaths(start, opts);
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var m = loadAsFileSync(path.join( dir, '/', x));
            if (m) return m;
            var n = loadAsDirectorySync(path.join( dir, '/', x ));
            if (n) return n;
        }
    }
};

},{"./caller.js":39,"./core":41,"./node-modules-paths.js":42,"fs":23,"path":25}],44:[function(require,module,exports){
'use strict';

var supportsColor = require('supports-color');
var ansiStyles = require('ansi-styles');

var TermColor = {
    black: buildColor('black'),
    red: buildColor('red'),
    green: buildColor('green'),
    yellow: buildColor('yellow'),
    blue: buildColor('blue'),
    magenta: buildColor('magenta'),
    cyan: buildColor('cyan'),
    white: buildColor('white'),
    gray: buildColor('gray'),
    bgBlack: buildColor('bgBlack'),
    bgRed: buildColor('bgRed'),
    bgGreen: buildColor('bgGreen'),
    bgYellow: buildColor('bgYellow'),
    bgBlue: buildColor('bgBlue'),
    bgMagenta: buildColor('bgMagenta'),
    bgCyan: buildColor('bgCyan'),
    bgWhite: buildColor('bgWhite'),
    reset: buildColor('reset'),
    bold: buildColor('bold'),
    dim: buildColor('dim'),
    italic: buildColor('italic'),
    underline: buildColor('underline'),
    inverse: buildColor('inverse'),
    hidden: buildColor('hidden'),
    strikethrough: buildColor('strikethrough')
};

TermColor.enabled = supportsColor;

module.exports = TermColor;

function buildColor(colorName) {
    return function colorFn(str) {
        if (!TermColor.enabled) {
            return str;
        }

        var code = ansiStyles[colorName];

        return code.open + str + code.close;
    };
}

},{"ansi-styles":45,"supports-color":46}],45:[function(require,module,exports){
'use strict';

var styles = module.exports = {
	modifiers: {
		reset: [0, 0],
		bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29]
	},
	colors: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		gray: [90, 39]
	},
	bgColors: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49]
	}
};

// fix humans
styles.colors.grey = styles.colors.gray;

Object.keys(styles).forEach(function (groupName) {
	var group = styles[groupName];

	Object.keys(group).forEach(function (styleName) {
		var style = group[styleName];

		styles[styleName] = group[styleName] = {
			open: '\u001b[' + style[0] + 'm',
			close: '\u001b[' + style[1] + 'm'
		};
	});

	Object.defineProperty(styles, groupName, {
		value: group,
		enumerable: false
	});
});

},{}],46:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (argv.indexOf('--no-color') !== -1 ||
		argv.indexOf('--no-colors') !== -1 ||
		argv.indexOf('--color=false') !== -1) {
		return false;
	}

	if (argv.indexOf('--color') !== -1 ||
		argv.indexOf('--colors') !== -1 ||
		argv.indexOf('--color=true') !== -1 ||
		argv.indexOf('--color=always') !== -1) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))
},{"_process":26}],47:[function(require,module,exports){
var OPtoString = Object.prototype.toString
var OPHas = Object.prototype.hasOwnProperty

var values = {
  'string': true,
  'number': true,
  'boolean': true,
  'symbol': true,
  // Kinda a lie, but returning the functions unmodified
  // leads to the least confusing behavior.
  'function': true
}

var howDoICopy = {
  '[object Object]': copyObject,
  '[object Array]': copyArray,
  '[object Error]': justDont,
  '[object Map]': copyMap,
  '[object Set]': copySet,
  '[object Date]': copyConstructor,
  '[object RegExp]': copyConstructor,
  '[object Promise]': justDont,
  '[object XMLHttpRequest]': justDont,
  '[object NodeList]': copyArray,
  '[object ArrayBuffer]': copySlice,
  '[object Int8Array]': copyConstructor,
  '[object Uint8Array]': copyConstructor,
  '[object Uint8ClampedArray]': copyConstructor,
  '[object Int16Array]': copyConstructor,
  '[object Uint16Array]': copyConstructor,
  '[object Int32Array]': copyConstructor,
  '[object Uint32Array]': copyConstructor,
  '[object Float32Array]': copyConstructor,
  '[object Float64Array]': copyConstructor
}

module.exports = universalCopy

function universalCopy (anything) {
  return deepCopy(anything, new FakeMap())
}

function deepCopy (original, seen) {
  var type = typeof original

  // Don't need to do anything for values
  // that aren't passed by reference.
  if (original == null || type in values) {
    return original
  }

  // if this object has already been copied during
  // this deep copy, use that first copy.
  var extantClone = seen.get(original)
  if (typeof extantClone !== 'undefined') {
    return extantClone
  }

  // Copy buffers correctly in pre-TypedArray node versions
  if (original.constructor &&
      original.constructor.isBuffer &&
      original.constructor.isBuffer(original)) {
    return copyConstructor(original, seen)
  }

  if (typeof Element === 'function' &&
      original instanceof Element) {
    return cloneCopy(original, seen)
  }

  var copyX = howDoICopy[toStr(original)]
  // if none of the special cases hit, copy original as a generic object.
  return (copyX || copyObject)(original, seen)
}

function copyConstructor (original, seen) {
  var copy = new original.constructor(original)
  seen.set(original, copy)
  return copy
}

function copySet (original, seen) {
  var copy = new (original.constructor || Set)
  seen.set(original, copy)
  original.forEach(function (v) {
    copy.add(deepCopy(v, seen))
  })
  return copy
}

function copyMap (original, seen) {
  var copy = new (original.constructor || Map)
  seen.set(original, copy)
  original.forEach(function (v, k) {
    copy.set(deepCopy(k, seen), deepCopy(v, seen))
  })
  return copy
}

function copySlice (original, seen) {
  var copy = original.slice(0)
  seen.set(original, copy)
  return copy
}

function copyArray (original, seen) {
  var copy = new Array(original.length)

  seen.set(original, copy)
  moveProps(original, copy, seen)
  return copy
}

function cloneCopy (original, seen) {
  var copy = original.cloneNode(true)
  seen.set(original, copy)
  return copy
}

function justDont (original, seen) {
  return original
}

function copyObject (original, seen) {
  var copy = Object.create(Object.getPrototypeOf(original))

  seen.set(original, copy)

  moveProps(original, copy, seen)

  if (Object.isFrozen(original)) Object.freeze(copy)
  if (Object.isSealed(original)) Object.seal(copy)
  if (!Object.isExtensible(original)) Object.preventExtensions(copy)

  return copy
}

function moveProps (original, copy, seen) {
  Object.getOwnPropertyNames(original).forEach(originalToCopy)

  if (typeof Object.getOwnPropertySymbols === 'function') {
    Object.getOwnPropertySymbols(original).forEach(originalToCopy)
  }

  function originalToCopy (key) {
    var descriptor = Object.getOwnPropertyDescriptor(original, key)
    if (has(descriptor, 'value')) {
      descriptor.value = deepCopy(descriptor.value, seen)
    }
    try {
      Object.defineProperty(copy, key, descriptor)
    } catch (e) {
      // When define property fails it means we shouldn't
      // have been trying to write the property we were.
      // example: the stack of an error object.
    }
  }
}

function toStr (thing) {
  return OPtoString.call(thing)
}

function has (thing, prop) {
  return OPHas.call(thing, prop)
}

// Fake map only works for the few scenarios we need it for in this module.
// it is _not_ a good Map polyfil.
function FakeMap () {
  if (typeof Map === 'function') return new Map()
  this.keys = []
  this.values = []
}
FakeMap.prototype.get = function (obj) {
  var idx = this.keys.indexOf(obj)
  if (idx !== -1) {
    return this.values[idx]
  }
}
FakeMap.prototype.set = function (key, value) {
  this.keys.push(key)
  this.values.push(value)
}

},{}],48:[function(require,module,exports){
(function (global){

var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":48}],50:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],51:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],52:[function(require,module,exports){
'use strict';

/* @jsig */

var builtinTypes = [
    'String',
    'Number',
    'Object',
    'void',
    'Boolean',
    'Array',
    'Function',
    'RegExp',
    'Date',
    'Symbol',
    '%Boolean%%Mixed',
    '%Object%%Empty',
    '%InternalFunction%%FnCall',
    '%InternalFunction%%FnApply',
    '%InternalFunction%%FnBind',
    '%InternalFunction%%ObjectCreate'
];

module.exports = builtinTypes;

},{}],53:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var RAW_TYPE_NAME = Parsimmon.regex(/[a-z0-9%]+/i);

var lexemes = {
    importWord: lexeme(Parsimmon.string('import')),
    macroWord: lexeme(Parsimmon.string('macro')),
    rowTypeVariable: lexeme(Parsimmon.string('..R')),
    openCurlyBrace: lexeme(Parsimmon.string('{')),
    closeCurlyBrace: lexeme(Parsimmon.string('}')),
    fromWord: lexeme(Parsimmon.string('from')),
    exportWord: lexeme(Parsimmon.string('export')),
    defaultWord: lexeme(Parsimmon.string('default')),
    quote: lexeme(Parsimmon.regex(/['"]/)),
    identifier: lexeme(Parsimmon.regex(/[a-z0-9\-\/]+/i)),
    assignmentIdentifier: lexeme(
        Parsimmon.regex(/[a-z0-9+*/%<=>!\|\-\/\\\~\&\^]+/i)
    ),
    moduleName: lexeme(Parsimmon.regex(/[a-z0-9_\-\/\.]+/i)),
    labelName: lexeme(Parsimmon.regex(/[a-z0-9_\?]+/i)),
    rawTypeName: RAW_TYPE_NAME,
    typeName: lexeme(RAW_TYPE_NAME),
    labelSeperator: lexeme(Parsimmon.string(':')),
    comma: lexeme(Parsimmon.string(',')),
    openAngularBrace: lexeme(Parsimmon.string('<')),
    closeAngularBrace: lexeme(Parsimmon.string('>')),
    typeWord: lexeme(Parsimmon.string('type')),
    interfaceWord: lexeme(Parsimmon.string('interface')),
    unionSeperator: lexeme(Parsimmon.string('|')),
    intersectionSeperator: lexeme(Parsimmon.string('&')),
    openRoundBrace: lexeme(Parsimmon.string('(')),
    closeRoundBrace: lexeme(Parsimmon.string(')')),
    arrow: lexeme(Parsimmon.string('=>')),
    openSquareBrace: lexeme(Parsimmon.string('[')),
    closeSquareBrace: lexeme(Parsimmon.string(']')),
    notAQuote: lexeme(Parsimmon.regex(/[^\"\']+/i)),
    number: lexeme(Parsimmon.regex(/\-?[0-9]+/i)),
    nullWord: lexeme(Parsimmon.string('null')),
    undefinedWord: lexeme(Parsimmon.string('undefined')),
    trueWord: lexeme(Parsimmon.string('true')),
    falseWord: lexeme(Parsimmon.string('false')),
    asWord: lexeme(Parsimmon.string('as')),
    openBrace: lexeme(Parsimmon.string('(')),
    closeBrace: lexeme(Parsimmon.string(')')),
    commentStart: Parsimmon.string('--'),
    altCommentStart: Parsimmon.string('//'),
    nonNewLine: Parsimmon.regex(/[^\n]/),
    blockCommentStart: Parsimmon.string('/*'),
    nonBlockCommentEnd: Parsimmon.regex(/(\*(?!\/)|[^*])/),
    blockCommentEnd: Parsimmon.string('*/')
};

module.exports = lexemes;

function lexeme(p) {
    return p.skip(Parsimmon.optWhitespace);
}

},{"parsimmon":36}],54:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

module.exports = join;

function join(expr, seperator, count) {
    count = count || 0;

    var defaultToken = count > 0 ?
        Parsimmon.fail('must join() at least 1 token') :
        Parsimmon.succeed([]);

    return expr.chain(function findOne(value) {
        return seperator
            .then(expr)
            .atLeast(count - 1).map(function makeFlat(values) {
                return [value].concat(values);
            });
    }).or(defaultToken);
}

},{"parsimmon":36}],55:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var AST = require('../ast/');
var statement = require('./statement.js');

var line = Parsimmon.optWhitespace
    .then(statement)
    .skip(Parsimmon.optWhitespace);

var program = line.many().map(function toProgram(statements) {
    return AST.program(statements);
});

module.exports = program;

},{"../ast/":10,"./statement.js":56,"parsimmon":36}],56:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var typeDefinition = require('./type-definition.js');
var typeLiteral = require('./type-literal.js');
var typeDeclaration = require('./type-declaration.js');
var join = require('./lib/join.js');

var renamedLiteral = typeLiteral
    .chain(function captureOriginal(original) {
        return lexemes.asWord
            .then(typeLiteral)
            .map(function toRenamedLiteral(literal) {
                return AST.renamedLiteral(literal, original);
            });
    });

var importStatement = Parsimmon.seqMap(

    lexemes.importWord
        .then(Parsimmon.index),

    lexemes.macroWord
        .atMost(1),

    lexemes.openCurlyBrace
        .then(join(Parsimmon.alt(
            renamedLiteral,
            typeLiteral
        ), lexemes.comma)),

    lexemes.closeCurlyBrace
        .then(lexemes.fromWord)
        .then(Parsimmon.index),

    lexemes.quote
        .then(lexemes.moduleName)
        .skip(lexemes.quote),

    function onParts(
        startIndex, macroWord, importLiterals, endIndex, identifier
    ) {
        var isMacro = macroWord.length === 1;

        var loc = {
            start: {
                column: 0,
                line: startIndex.line
            },
            end: {
                line: endIndex.line,
                column: Number.MAX_VALUE
            }
        };

        return AST.importStatement(
            identifier, importLiterals, {
                loc: loc,
                isMacro: isMacro,
                line: startIndex.line
            }
        );
    }
);

var assignment = lexemes.assignmentIdentifier
    .chain(function captureIdentifier(identifier) {
        identifier = identifier.replace(/\\\-/g, '-');

        return lexemes.labelSeperator
            .then(typeDefinition)
            .map(function toAssignment(type) {
                return AST.assignment(identifier, type);
            });
    });

var exportStatement = lexemes.exportWord
    .then(lexemes.defaultWord)
    .then(typeDefinition)
    .map(function toDefaultExport(type) {
        return AST.defaultExport(type);
    });

var commentStatement = lexemes.commentStart
    .then(lexemes.nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('--' + text.join(''));
    });

var altCommentStatement = lexemes.altCommentStart
    .then(lexemes.nonNewLine.many())
    .map(function comment(text) {
        return AST.comment('//' + text.join(''));
    });

var blockCommentStatement = lexemes.blockCommentStart
    .then(lexemes.nonBlockCommentEnd.many())
    .skip(lexemes.blockCommentEnd)
    .map(function comment(text) {
        return AST.comment('/*' + text.join('') + '*/');
    });

var statement = Parsimmon.alt(
    commentStatement,
    altCommentStatement,
    blockCommentStatement,
    importStatement,
    assignment,
    typeDeclaration,
    exportStatement
);

module.exports = statement;

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-declaration.js":57,"./type-definition.js":58,"./type-literal.js":63,"parsimmon":36}],57:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');
var assert = require('assert');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var typeDefinition = require('./type-definition.js');
var typeFunction = require('./type-function.js');
var typeLiteral = require('./type-literal.js');
var typeKeyValue = require('./type-key-value.js');
var join = require('./lib/join.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(
        typeLiteral,
        lexemes.comma
    ))
    .skip(lexemes.closeAngularBrace);

var rawTypeDeclaration = lexemes.typeWord
    .then(Parsimmon.seq(
        lexemes.identifier,
        genericExpression.times(0, 1)
    ))
    .chain(function captureIdentifiers(list) {
        var identifier = list[0];
        var generics = list[1][0] || [];

        return lexemes.labelSeperator
            .then(typeDefinition)
            .map(function toTypeDeclaration(type) {
                return AST.typeDeclaration(identifier, type,
                    generics);
            });
    });

var methodKeyValue = Parsimmon.seq(
    lexemes.labelName,
    typeFunction
).map(function createType(list) {
    var name = list[0];
    var type = list[1];

    assert(!type.thisArg, 'cannot have thisArg in method');

    var pair = AST.keyValue(name, type);
    pair.isMethod = true;
    return pair;
});

var typeKeyValues = join(Parsimmon.alt(
    typeKeyValue, methodKeyValue
), lexemes.comma);

var interfaceDeclaration = lexemes.interfaceWord
    .then(lexemes.identifier)
    .chain(function captureIdentifier(id) {
        return lexemes.openCurlyBrace
            .then(typeKeyValues)
            .skip(lexemes.closeCurlyBrace)
            .map(function capturePairs(pairs) {
                var newPairs = [];
                var namedPairs = Object.create(null);

                for (var i = 0; i < pairs.length; i++) {
                    var p = pairs[i];
                    if (!p.isMethod) {
                        newPairs.push(p);
                        continue;
                    }

                    var v = p.value;
                    assert(v.type === 'function', 'method must be function');
                    assert(!v.thisArg, 'method cannot have thisArg');

                    v.thisArg = AST.param('this', AST.literal(id));

                    if (!namedPairs[p.key]) {
                        namedPairs[p.key] = p;
                        newPairs.push(p);
                    } else {
                        var pair = namedPairs[p.key];
                        if (!pair.isOverloaded) {
                            pair.isOverloaded = true;
                            pair.value = AST.intersection([pair.value]);
                        }

                        pair.value.intersections.push(p.value);
                    }
                }

                var obj = AST.object(newPairs);

                return AST.typeDeclaration(id, obj, []);
            });
    });

module.exports = Parsimmon.alt(
    rawTypeDeclaration,
    interfaceDeclaration
);

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-definition.js":58,"./type-function.js":60,"./type-key-value.js":62,"./type-literal.js":63,"assert":24,"parsimmon":36}],58:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var innerTypes = Parsimmon.lazy(lazyAlt);

var unionType = Parsimmon.alt(
    join(innerTypes, lexemes.unionSeperator, 1)
        .map(function unpackUnions(unions) {
            if (unions.length === 1) {
                return unions[0];
            }

            return AST.union(unions);
        }),
    innerTypes
);

var intersectionType = Parsimmon.alt(
    join(unionType, lexemes.intersectionSeperator, 1)
        .map(function unpackIntersections(intersections) {
            if (intersections.length === 1) {
                return intersections[0];
            }

            return AST.intersection(intersections);
        }),
    unionType
);

var typeDefinition = intersectionType;

var typeDefinitionWithParen = Parsimmon.alt(
    typeDefinition,
    lexemes.openBrace
        .then(typeDefinition)
        .skip(lexemes.closeBrace)
);

module.exports = typeDefinitionWithParen;

var typeExpression = require('./type-expression.js');
var typeFunction = require('./type-function.js');
var typeObject = require('./type-object.js');
var typeTuple = require('./type-tuple.js');

function lazyAlt() {
    var baseExpression = Parsimmon.alt(
        typeExpression,
        typeFunction,
        typeObject,
        typeTuple
    ).skip(Parsimmon.optWhitespace);

    return Parsimmon.alt(
        baseExpression,
        lexemes.openBrace
            .then(baseExpression)
            .skip(lexemes.closeBrace)
    );
}

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-expression.js":59,"./type-function.js":60,"./type-object.js":64,"./type-tuple.js":65,"parsimmon":36}],59:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var typeGeneric = require('./type-generic.js');
var valueLiteral = require('./value-literal.js');

var typeOrValueLiteral = Parsimmon.alt(
    valueLiteral,
    typeGeneric
);

module.exports = typeOrValueLiteral;

},{"./type-generic.js":61,"./value-literal.js":66,"parsimmon":36}],60:[function(require,module,exports){
'use strict';

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');
var typeLiteral = require('./type-literal.js');
var typeDefinition = require('./type-definition.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(typeLiteral, lexemes.comma))
    .skip(lexemes.closeAngularBrace);

var paramName = lexemes.labelName
    .skip(lexemes.labelSeperator)
    .atMost(1);

var typeParam = paramName
    .chain(function captureOptional(maybeName) {
        var name = maybeName[0] || null;
        var optional = false;
        if (name) {
            optional = name[name.length - 1] === '?';
            if (optional) {
                name = name.substr(0, name.length - 1);
            }
        }

        return typeDefinition
            .map(function toParam(value) {
                return AST.param(name, value, {
                    optional: optional
                });
            });
    });

var typeParams = join(typeParam, lexemes.comma);

var typeFunction = genericExpression.times(0, 1)
    .chain(function captureGeneric(list) {
        var generics = list[0] || null;
        if (generics) {
            for (var i = 0; i < generics.length; i++) {
                generics[i] = generics[i].name;
            }
        }

        return lexemes.openRoundBrace
            .then(typeParams)
            .chain(function captureArgs(args) {
                var thisArg = null;
                if (args[0] && args[0].name === 'this') {
                    thisArg = args.shift();
                }

                return lexemes.closeRoundBrace
                    .then(lexemes.arrow)
                    .then(typeDefinition)
                    .map(function toFunctionType(def) {
                        return AST.functionType({
                            args: args,
                            thisArg: thisArg,
                            result: def,
                            generics: generics
                        });
                    });
            });
    });

module.exports = typeFunction;

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-definition.js":58,"./type-literal.js":63}],61:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var typeDefinition = require('./type-definition.js');
var lexemes = require('./lexemes.js');
var typeLiteral = require('./type-literal.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var genericExpression = lexemes.openAngularBrace
    .then(join(typeDefinition, lexemes.comma))
    .skip(lexemes.closeAngularBrace);

var genericLiteral = Parsimmon.seq(
    typeLiteral,
    genericExpression.times(0, 1)
).map(function toGeneric(list) {
    if (list[1].length === 0) {
        return list[0];
    }

    return AST.generic(list[0], list[1][0]);
});

module.exports = genericLiteral;

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-definition.js":58,"./type-literal.js":63,"parsimmon":36}],62:[function(require,module,exports){
'use strict';

var typeDefinition = require('./type-definition.js');
var lexemes = require('./lexemes.js');
var AST = require('../ast/');

var objectKey = lexemes.labelName
    .skip(lexemes.labelSeperator);

var typeKeyValue = objectKey
    .chain(function captureOptional(keyName) {
        var optional = keyName[keyName.length - 1] === '?';

        if (optional) {
            keyName = keyName.substr(0, keyName.length - 1);
        }

        return typeDefinition
            .map(function toKeyValue(keyValue) {
                return AST.keyValue(keyName, keyValue, {
                    optional: optional
                });
            });
    });

module.exports = typeKeyValue;

},{"../ast/":10,"./lexemes.js":53,"./type-definition.js":58}],63:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');

var typeLiteral = Parsimmon.seqMap(
    Parsimmon.index,

    lexemes.rawTypeName,

    Parsimmon.index
        .skip(Parsimmon.optWhitespace),

    function toLiteral(startIndex, type, endIndex) {
        var loc = {
            start: {
                column: startIndex.column - 1,
                line: startIndex.line
            },
            end: {
                column: endIndex.column - 1,
                line: endIndex.line
            }
        };

        return AST.literal(type, undefined, {
            loc: loc,
            line: startIndex.line
        });
    }
);

module.exports = typeLiteral;

},{"../ast/":10,"./lexemes.js":53,"parsimmon":36}],64:[function(require,module,exports){
'use strict';

var typeKeyValue = require('./type-key-value.js');
var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');

var singleRowType = lexemes.rowTypeVariable
    .times(0, 1);

var rowType = lexemes.comma
    .then(lexemes.rowTypeVariable)
    .times(0, 1);

var typeKeyValues = join(typeKeyValue, lexemes.comma);

var typeObject = lexemes.openCurlyBrace
    .then(typeKeyValues)
    .chain(function captureValues(values) {
        var rowTypeParser = null;
        if (values.length === 0) {
            rowTypeParser = singleRowType;
        } else {
            rowTypeParser = rowType;
        }

        return rowTypeParser
            .skip(lexemes.closeCurlyBrace)
            .map(function toObject(rowTypes) {
                return AST.object(values, null, {
                    open: rowTypes.length === 1
                });
            });
    });

module.exports = typeObject;

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-key-value.js":62}],65:[function(require,module,exports){
'use strict';

var lexemes = require('./lexemes.js');
var AST = require('../ast/');
var join = require('./lib/join.js');
var typeDefinition = require('./type-definition.js');

var typeTuple = lexemes.openSquareBrace
    .then(join(typeDefinition, lexemes.comma))
    .skip(lexemes.closeSquareBrace)
    .map(function toTuple(values) {
        return AST.tuple(values);
    });

module.exports = typeTuple;

},{"../ast/":10,"./lexemes.js":53,"./lib/join.js":54,"./type-definition.js":58}],66:[function(require,module,exports){
'use strict';

var Parsimmon = require('parsimmon');

var lexemes = require('./lexemes.js');
var AST = require('../ast/');

var valueLiterals = Parsimmon.alt(
    valueLiteral('string', lexemes.quote
        .then(lexemes.notAQuote)
        .chain(function captureString(str) {
            return lexemes.quote
                .map(function toString(quote) {
                    return quote + str + quote;
                });
        })),
    valueLiteral('number', lexemes.number),
    valueLiteral('null', lexemes.nullWord),
    valueLiteral('undefined', lexemes.undefinedWord),
    valueLiteral('boolean', lexemes.trueWord),
    valueLiteral('boolean', lexemes.falseWord)
);

module.exports = valueLiterals;

function valueLiteral(name, parser) {
    return parser.map(function toValue(value) {
        return AST.value(value, name);
    });
}

},{"../ast/":10,"./lexemes.js":53,"parsimmon":36}],67:[function(require,module,exports){
'use strict';

var extend = require('xtend');

var serializers = {
    program: serializeProgram,
    typeDeclaration: serializeTypeDeclaration,
    assignment: serializeAssignment,
    'import': serializeImportStatement,
    object: serializeObject,
    unionType: serializeUnion,
    intersectionType: serializeIntersection,
    typeLiteral: serializeLiteral,
    keyValue: serializeKeyValue,
    valueLiteral: serializeValue,
    function: serializeFunctionType,
    genericLiteral: serializeGeneric,
    tuple: serializeTuple,
    freeLiteral: serializeFreeLiteral,
    renamedLiteral: serializeRenamedLiteral,
    param: serializeParam,
    macroLiteral: serializeMacroLiteral,
    comment: serializeComment,
    defaultExport: serializeDefaultExport
};

module.exports = serialize;

function serialize(ast, opts) {
    opts = opts || { indent: 0, lineStart: 0 };

    if (ast._raw) {
        return serialize(ast._raw, opts);
    }

    var fn = serializers[ast.type];

    if (!fn) {
        throw new Error('unknown ast type: ' + ast.type);
    }

    return fn(ast, opts);
}

function serializeProgram(node, opts) {
    var tokens = [];
    for (var i = 0; i < node.statements.length; i++) {
        tokens.push(serialize(node.statements[i], opts));
    }

    var text = tokens[0];
    var isImport = node.statements[0].type === 'import';
    var oneLineType = node.statements[0].type === 'typeDeclaration' &&
        tokens[0].indexOf('\n') === -1;

    for (i = 1; i < tokens.length; i++) {
        isImport = node.statements[i].type === 'import';

        var sequentialStatements = (
            isImport ||
            (oneLineType && node.statements[i].type === 'typeDeclaration')
        );

        text += sequentialStatements ? '\n' : '\n\n';
        text += tokens[i];

        oneLineType = node.statements[i].type === 'typeDeclaration' &&
            tokens[i].indexOf('\n') === -1;
    }

    if (tokens.length > 1) {
        text += '\n';
    }

    return text;
}

function serializeTypeDeclaration(node, opts) {
    var tokens = [];
    for (var i = 0; i < node.generics.length; i++) {
        tokens.push(serialize(node.generics[i], opts));
    }

    var generics = tokens.length ?
        '<' + tokens.join(', ') + '>' : '';
    var str = 'type ' + node.identifier + generics;

    var decl = serialize(node.typeExpression, extend(opts, {
        lineStart: str.length
    }));

    return str + (decl[0] === '\n' ? ' :' : ' : ') + decl;
}

function serializeAssignment(node, opts) {
    var str = node.identifier + ' : ' +
        serialize(node.typeExpression, opts);

    if (str.split('\n')[0].length <= 65) {
        return str;
    }

    return node.identifier + ' :\n' + spaces(opts.indent + 1) +
        serialize(node.typeExpression, extend(opts, {
            indent: opts.indent + 1
        }));
}

function serializeImportStatement(node, opts) {
    var tokens;

    if (node.types.length <= 1) {
        tokens = [];
        for (var i = 0; i < node.types.length; i++) {
            tokens.push(serialize(node.types[i]));
        }

        var content = 'import { ' + tokens.join(', ') +
            ' } from "' + node.dependency + '"';

        if (content.length < 65 && content.indexOf('\n') === -1) {
            return content;
        }
    }

    tokens = [];
    for (i = 0; i < node.types.length; i++) {
        tokens.push(serialize(node.types[i], extend(opts, {
            indent: opts.indent + 1
        })));
    }

    return 'import {\n' + tokens.join(',\n') + '\n' +
        spaces(opts.indent) + '} from "' + node.dependency + '"';
}

function serializeObject(node, opts) {
    var keyValues = node.keyValues;
    var tokens;

    if (keyValues.length === 0) {
        return '{}';
    }

    /* heuristic. Pretty print single key, value on one line */
    if (keyValues.length <= 1) {
        tokens = [];
        for (var i = 0; i < keyValues.length; i++) {
            tokens.push(serialize(keyValues[i]));
        }
        var content = '{ ' + tokens.join(', ') + ' }';

        if (content.length < 65 &&
            content.indexOf('\n') === -1
        ) {
            return content;
        }
    }

    tokens = [];
    for (i = 0; i < keyValues.length; i++) {
        tokens.push(serialize(keyValues[i], extend(opts, {
            indent: opts.indent + 1
        })));
    }

    return '{\n' +
        tokens.join(',\n') + '\n' + spaces(opts.indent) + '}';
}

function prettyFormatList(tokens, seperator, opts) {
    var parts = [''];
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        var lastIndex = parts.length - 1;
        var last = parts[lastIndex];
        var len = (last + token + seperator).length;

        if (opts.lineStart) {
            len += opts.lineStart;
        }

        if (len < 65) {
            parts[lastIndex] += token + seperator;
            continue;
        }

        parts[lastIndex] = last.substr(0, last.length - 1);

        if (opts.lineStart) {
            opts.lineStart = 0;
        }

        parts[parts.length] = spaces(opts.indent + 1) +
            trimLeft(token) + seperator;
    }

    var str = parts.join('\n');
    // remove extra {seperator} at the end
    return str.substr(0, str.length - seperator.length);
}

function serializeUnion(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.unions.length; i++) {
        nodes.push(serialize(node.unions[i], opts));
    }
    var str = nodes.join(' | ');

    /* heuristic. Split across multiple lines if too long */
    if (str.split('\n')[0].length > 65) {
        if (nodes.length < 10) {
            str = prettyFormatList(nodes, ' | ', opts);
        } else {
            nodes = [];
            for (i = 0; i < node.unions.length; i++) {
                var text = spaces(opts.indent + 1) +
                    serialize(node.unions[i], extend(opts, {
                        indent: opts.indent + 1
                    }));
                nodes.push(text);
            }
            str = '\n' + nodes.join(' |\n');
        }
    }

    return str;
}

function serializeIntersection(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.intersections.length; i++) {
        nodes.push(serialize(node.intersections[i], opts));
    }

    var str = nodes.join(' & ');

    /* heuristic. Split across multiple lines if too long */
    if (str.split('\n')[0].length > 65) {
        str = prettyFormatList(nodes, ' & ', opts);
    }

    return str;
}

function serializeFreeLiteral(node, opts) {
    return node.name;
}

function serializeMacroLiteral(node, opts) {
    return node.macroName;
}

function serializeLiteral(node, opts) {
    return node.name;
}

function serializeParam(node, opts) {
    var prefix = node.name ?
        (node.name + (node.optional ? '?' : '') + ': ') :
        '';

    return prefix + serialize(node.value, opts);
}

function serializeKeyValue(node, opts) {
    return spaces(opts.indent) + node.key +
        (node.optional ? '?' : '') + ': ' +
        serialize(node.value, opts);
}

function serializeValue(node, opts) {
    return node.value;
}

function serializeFunctionType(node, opts) {
    var str = '(';
    var argNodes = node.args.slice();

    if (node.thisArg) {
        argNodes.unshift(node.thisArg);
    }

    var argStrs = [];
    for (var i = 0; i < argNodes.length; i++) {
        argStrs.push(serialize(argNodes[i], opts));
    }
    var argStr = argStrs.join(', ');

    var resultStr = serialize(node.result, opts);
    var possibleStr = str + argStrs.join(', ') + ') => ' + resultStr;

    if (possibleStr.split('\n')[0].length > 65) {
        var offset = '\n' + spaces(opts.indent + 1);
        argStrs = [];
        for (i = 0; i < argNodes.length; i++) {
            argStrs.push(serialize(argNodes[i], extend(opts, {
                indent: opts.indent + 1
            })));
        }
        argStr = offset + argStrs.join(',' + offset) + '\n';
        argStr += spaces(opts.indent);
    }

    str += argStr + ') => ' + resultStr;

    return str;
}

function serializeGeneric(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.generics.length; i++) {
        nodes.push(serialize(node.generics[i], opts));
    }

    return serialize(node.value, opts) +
        '<' + nodes.join(', ') + '>';
}

function serializeTuple(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.values.length; i++) {
        nodes.push(serialize(node.values[i], opts));
    }

    return '[' + nodes.join(', ') + ']';
}

function serializeRenamedLiteral(node, opts) {
    return spaces(opts.indent) +
        serialize(node.original) + ' as ' + node.name;
}

function serializeComment(node, opts) {
    return spaces(opts.indent) + node.text;
}

function serializeDefaultExport(node, opts) {
    return spaces(opts.indent) + 'export default ' +
        serialize(node.typeExpression);
}

function spaces(n) {
    n = n * 4;
    var str = '';
    for (var i = 0; i < n; i++) {
        str += ' ';
    }
    return str;
}

function trimLeft(str) {
    return str.replace(/^\s+/, '');
}

},{"xtend":50}],68:[function(require,module,exports){
'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

var assert = require('assert');
var path = require('path');

var JsigAST = require('../ast/');
var serialize = require('../serialize.js');
var Errors = require('./errors.js');
var isSameType = require('./lib/is-same-type.js');
var getUnionWithoutBool = require('./lib/get-union-without-bool.js');
var updateObject = require('./lib/update-object.js');
var cloneJSIG = require('./lib/clone-ast.js');
var computeSmallestUnion = require('./lib/compute-smallest-union.js');

var ARRAY_KEY_TYPE = JsigAST.literal('Number');

module.exports = ASTVerifier;

function ASTVerifier(meta, checker, fileName) {
    this.meta = meta;
    this.checker = checker;
    this.fileName = fileName;
    this.folderName = path.dirname(fileName);
}

/*eslint complexity: [2, 50] */
ASTVerifier.prototype.verifyNode = function verifyNode(node) {
    if (node.type === 'Program') {
        return this.verifyProgram(node);
    } else if (node.type === 'FunctionDeclaration') {
        return this.verifyFunctionDeclaration(node);
    } else if (node.type === 'BlockStatement') {
        return this.verifyBlockStatement(node);
    } else if (node.type === 'ExpressionStatement') {
        return this.verifyExpressionStatement(node);
    } else if (node.type === 'AssignmentExpression') {
        return this.verifyAssignmentExpression(node);
    } else if (node.type === 'MemberExpression') {
        return this.verifyMemberExpression(node);
    } else if (node.type === 'ThisExpression') {
        return this.verifyThisExpression(node);
    } else if (node.type === 'Identifier') {
        return this.verifyIdentifier(node);
    } else if (node.type === 'Literal') {
        return this.verifyLiteral(node);
    } else if (node.type === 'ArrayExpression') {
        return this.verifyArrayExpression(node);
    } else if (node.type === 'CallExpression') {
        return this.verifyCallExpression(node);
    } else if (node.type === 'BinaryExpression') {
        return this.verifyBinaryExpression(node);
    } else if (node.type === 'ReturnStatement') {
        return this.verifyReturnStatement(node);
    } else if (node.type === 'NewExpression') {
        return this.verifyNewExpression(node);
    } else if (node.type === 'VariableDeclaration') {
        return this.verifyVariableDeclaration(node);
    } else if (node.type === 'ForStatement') {
        return this.verifyForStatement(node);
    } else if (node.type === 'UpdateExpression') {
        return this.verifyUpdateExpression(node);
    } else if (node.type === 'ObjectExpression') {
        return this.verifyObjectExpression(node);
    } else if (node.type === 'IfStatement') {
        return this.verifyIfStatement(node);
    } else if (node.type === 'UnaryExpression') {
        return this.verifyUnaryExpression(node);
    } else if (node.type === 'LogicalExpression') {
        return this.verifyLogicalExpression(node);
    } else if (node.type === 'FunctionExpression') {
        return this.verifyFunctionExpression(node);
    } else if (node.type === 'ContinueStatement') {
        return this.verifyContinueStatement(node);
    } else if (node.type === 'ThrowStatement') {
        return this.verifyThrowStatement(node);
    } else if (node.type === 'ConditionalExpression') {
        return this.verifyConditionalExpression(node);
    } else if (node.type === 'WhileStatement') {
        return this.verifyWhileStatement(node);
    } else if (node.type === 'BreakStatement') {
        return this.verifyBreakStatement(node);
    } else if (node.type === 'TryStatement') {
        return this.verifyTryStatement(node);
    } else if (node.type === 'CatchClause') {
        return this.verifyCatchClause(node);
    } else {
        throw new Error('!! skipping verifyNode: ' + node.type);
    }
};

ASTVerifier.prototype.verifyProgram =
function verifyProgram(node) {
    var parts = splitFunctionDeclaration(node.body);

    var i = 0;
    for (i = 0; i < parts.functions.length; i++) {
        var name = parts.functions[i].id.name;

        if (!this.meta.currentScope.getVar(name)) {
            this.meta.currentScope.addFunction(name, parts.functions[i]);
        }
    }

    this._verifyBlockStatement(parts.statements);

    var functions = parts.functions;
    do {
        var unknownFuncs = [];
        for (i = 0; i < functions.length; i++) {
            var func = functions[i];
            if (!this.meta.currentScope.getVar(func.id.name)) {
                unknownFuncs.push(func);
                continue;
            }
            this.meta.verifyNode(func, null);
        }

        var gotSmaller = unknownFuncs.length < functions.length;
        functions = unknownFuncs;
    } while (gotSmaller);

    for (i = 0; i < functions.length; i++) {
        this.meta.verifyNode(functions[i], null);
    }

    /* If a module.exports type exists, but it has not been assigned */
    if (this.meta.hasExportDefined() &&
        !this.meta.hasFullyExportedType()
    ) {
        var exportType = this.meta.getModuleExportsType();
        var actualType = JsigAST.literal('<MissingType>', true);

        if (this.meta.getExportedFields().length > 0) {
            var fields = this.meta.getExportedFields();
            actualType = cloneJSIG(exportType);

            actualType.keyValues = [];
            for (i = 0; i < exportType.keyValues.length; i++) {
                var pair = exportType.keyValues[i];
                if (fields.indexOf(pair.key) >= 0) {
                    actualType.keyValues.push(pair);
                }
            }
        }

        this.meta.addError(Errors.MissingExports({
            expected: this.meta.serializeType(exportType),
            actual: this.meta.serializeType(actualType)
        }));
    }
};

ASTVerifier.prototype.verifyFunctionDeclaration =
function verifyFunctionDeclaration(node) {
    var funcName = getFunctionName(node);

    // console.log('verifyFunctionDeclaration', funcName);

    var err;
    if (this.meta.currentScope.getUntypedFunction(funcName)) {
        // console.log('found untyped');
        err = Errors.UnTypedFunctionFound({
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var token = this.meta.currentScope.getVar(funcName);
    if (!token) {
        err = Errors.UnTypedFunctionFound({
            funcName: funcName,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var isFunction = token.defn.type === 'function';
    if (!isFunction && token.defn.type !== 'intersectionType' &&
        token.defn.type !== 'unionType'
    ) {
        err = Errors.UnexpectedFunction({
            funcName: funcName,
            expected: this.meta.serializeType(token.defn),
            actual: this.meta.serializeType(JsigAST.literal('Function')),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    this._checkFunctionType(node, token.defn);
    return token.defn;
};

ASTVerifier.prototype.verifyBlockStatement =
function verifyBlockStatement(node) {
    this._verifyBlockStatement(node.body);
};

ASTVerifier.prototype._verifyBlockStatement =
function _verifyBlockStatement(statements) {
    for (var i = 0; i < statements.length; i++) {
        var statement = statements[i];

        if (statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'UnaryExpression' &&
            statement.expression.operator === 'typeof'
        ) {
            this._handleTypeofExpression(statement);
        }

        var statementType = this.meta.verifyNode(statement, null);

        // If we have an if statement with an early return
        // And the non-existant else block is Never type then
        // the if statement will always run and the rest
        // of the block will never run because of the early return
        if (statement.type === 'IfStatement' &&
            isNeverLiteral(statementType)
        ) {
            break;
        }
    }
};

ASTVerifier.prototype._handleTypeofExpression =
function _handleTypeofExpression(statement) {
    var exprNode = statement.expression.argument;
    var valueType = this.meta.verifyNode(exprNode, null);

    this.meta.addError(Errors.TypeofExpression({
        valueType: valueType ?
            this.meta.serializeType(valueType) :
            '<TypeError>',
        expr: this.meta.serializeAST(exprNode),
        loc: exprNode.loc,
        line: exprNode.loc.start.line
    }));
};

ASTVerifier.prototype.verifyExpressionStatement =
function verifyExpressionStatement(node) {
    return this.meta.verifyNode(node.expression, null);
};

/*eslint max-statements: [2, 100]*/
ASTVerifier.prototype.verifyAssignmentExpression =
function verifyAssignmentExpression(node) {
    if (
        node.left.type === 'Identifier' ||
        (node.left.type === 'MemberExpression' &&
            !node.left.computed)
    ) {
        this.meta.currentScope.setWritableTokenLookup();
    }
    var beforeError = this.meta.countErrors();
    var leftType = this.meta.verifyNode(node.left, null);
    var afterError = this.meta.countErrors();
    if (
        node.left.type === 'Identifier' ||
        (node.left.type === 'MemberExpression' &&
            !node.left.computed)
    ) {
        this.meta.currentScope.unsetWritableTokenLookup();
    }

    // Sanity check.
    if (!leftType) {
        if (afterError === beforeError) {
            assert(false, '!!! could not find leftType: ' +
                this.meta.serializeAST(node));
        }
        return null;
    }

    var rightType;
    beforeError = this.meta.countErrors();

    // When assigning an untyped function, try to update function
    if (node.right.type === 'Identifier' &&
        this.meta.currentScope.getUntypedFunction(node.right.name)
    ) {
        if (leftType.name === '%Export%%ModuleExports') {
            this.meta.addError(Errors.UnknownModuleExports({
                funcName: node.right.name,
                loc: node.loc,
                line: node.loc.start.line
            }));
            return null;
        }

        if (!this.meta.tryUpdateFunction(node.right.name, leftType)) {
            return null;
        }
        rightType = leftType;
    } else {
        var exprType = leftType;

        rightType = this.meta.verifyNode(node.right, exprType);
    }
    afterError = this.meta.countErrors();

    if (!rightType) {
        return null;
    }

    // Update inferred status
    if (node.left.type === 'Identifier' && !rightType.inferred) {
        var token = this.meta.currentScope.getVar(node.left.name);
        token.inferred = false;
    }

    // Handle free literal
    if (node.left.type === 'MemberExpression' &&
        node.left.object.type === 'Identifier' &&
        node.left.computed
    ) {
        var objType = this.meta.verifyNode(node.left.object, null);
        if (objType.type === 'genericLiteral' &&
            objType.generics[0] &&
            objType.generics[0].type === 'freeLiteral' &&
            objType.value.type === 'typeLiteral' &&
            objType.value.builtin && objType.value.name === 'Array'
        ) {
            var newGenerics = [rightType];
            assert(objType.generics.length === 1,
                'Array only has one generic type');

            var newType = JsigAST.generic(objType.value, newGenerics);
            this.meta.currentScope.forceUpdateVar(
                node.left.object.name, newType
            );

            leftType = rightType;
        }
    }

    // If the left side is an identifier, whos type is a value literal
    if (node.left.type === 'Identifier' &&
        leftType && leftType.type === 'valueLiteral' &&
        (leftType.name === 'boolean' || leftType.name === 'string') &&
        this.meta.isSubType(node, rightType, leftType)
    ) {
        // If we are assinging a String into a "foo" slot
        // or assigning a Boolean into a `true` slot.
        // Then just change the identifier slot to be the more
        // general type.

        this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
        leftType = rightType;
    }

    var isNullDefault = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Null%%Default'
    );
    var isVoidUninitialized = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Void%%Uninitialized'
    );
    var isOpenField = (
        leftType.type === 'typeLiteral' &&
        leftType.builtin && leftType.name === '%Mixed%%OpenField'
    );

    // Must check that right type fits in left type unless left type
    // can grow.
    // If left type is Null%%Default or Void%%Unitialized
    // then its uninitialized variable which can hold any type
    // If left type is an open field then we are assigning to
    // an untyped field an open object which can hold any type
    var canGrow = isNullDefault || isVoidUninitialized || isOpenField;
    var beforeAssignmentError = this.meta.countErrors();
    var afterAssignmentErrror = beforeAssignmentError;
    if (!canGrow) {
        this.meta.checkSubType(node, leftType, rightType);
        afterAssignmentErrror = this.meta.countErrors();
    }

    var hasKnownLeftType = afterError === beforeError;
    var assignmentSucceeded = afterAssignmentErrror === beforeAssignmentError;

    // In assignment of a value with concreteValue,
    // Must change the concreteValue
    if (assignmentSucceeded && hasKnownLeftType &&
        node.left.type === 'Identifier' &&
        leftType.type === 'typeLiteral' &&
        leftType.concreteValue !== null
    ) {
        this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
    }

    // If assignment succeeded then update the type of the variable
    if (assignmentSucceeded && hasKnownLeftType &&
        node.left.type === 'Identifier'
    ) {
        var readLeftType = this.meta.verifyNode(node.left, null);
        if (!isSameType(readLeftType, rightType)) {
            this.meta.currentScope.restrictType(node.left.name, rightType);
        }
    }

    // After assignment then unitialized variable now has concrete type
    if (isNullDefault || isVoidUninitialized) {
        if (node.left.type === 'Identifier') {
            this.meta.currentScope.forceUpdateVar(node.left.name, rightType);
        } else {
            assert(false, 'Cannot forceUpdateVar() ' + leftType.name);
        }
    }

    // If we assign to an open field we have to update the type
    // of the open object to track the new grown type
    if (isOpenField) {
        if (node.left.type === 'MemberExpression' &&
            node.left.property.type === 'Identifier' &&
            // Cannot track new type for nested objected assignment
            node.left.object.type === 'Identifier'
        ) {
            var propertyName = node.left.property.name;
            var targetType = this.meta.verifyNode(node.left.object, null);

            var newObjType = updateObject(
                targetType, [propertyName], rightType
            );
            newObjType.open = targetType.open;
            newObjType.brand = targetType.brand;

            this.meta.currentScope.forceUpdateVar(
                node.left.object.name, newObjType
            );
        } else {
            // TODO: anything to do here?
            // assert(false, 'Cannot forceUpdateVar() %Mixed%%OpenField');
        }
    }

    // When assigning to module.exports, find the known export
    // type of the module and do another checkSubType()
    if (leftType.name === '%Export%%ModuleExports') {
        assert(rightType, 'must have an export type');

        if (this.meta.hasExportDefined()) {
            var expectedType = this.meta.getModuleExportsType();

            // Do a potential conversion from Tuple -> Array
            if (expectedType.type === 'genericLiteral' &&
                expectedType.value.name === 'Array' &&
                expectedType.value.builtin &&
                rightType.type === 'tuple' &&
                rightType.inferred &&
                node.right.type === 'Identifier'
            ) {
                token = this.meta.currentScope.getVar(node.right.name);

                var self = this;
                var newArrayType = this._maybeConvertToArray(
                    token, node.right.name, rightType,
                    function verify(possibleArray) {
                        return self.meta.checkSubType(
                            node, expectedType, possibleArray
                        );
                    }
                );

                if (newArrayType) {
                    rightType = newArrayType;
                }
            }

            this.meta.checkSubType(node, expectedType, rightType);
            this.meta.setHasModuleExports(true);
        } else {
            this.meta.setModuleExportsType(rightType, node.right);
        }
    }

    // If we are assigning to exports.foo, we want to mark the field
    // as having been succesfully exported
    if (leftType.name !== '%Mixed%%UnknownExportsField' &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'Identifier' &&
        node.left.property.type === 'Identifier' &&
        node.left.object.name === 'exports' &&
        this.meta.hasExportDefined()
    ) {
        var exportsType = this.meta.verifyNode(node.left.object, null);

        if (exportsType.type === 'typeLiteral' &&
            exportsType.builtin && exportsType.name === '%Export%%ExportsObject'
        ) {
            var fieldName = node.left.property.name;
            this.meta.addExportedField(fieldName);
        }
    }

    // If we are currently inside a function scope which is
    // a constructor function and this assignment is this field
    // assignment then track it as a known field in the constructor.
    var funcScope = this.meta.currentScope.getFunctionScope();
    if (funcScope && funcScope.isConstructor &&
        node.left.type === 'MemberExpression' &&
        node.left.object.type === 'ThisExpression'
    ) {
        funcScope.addKnownField(node.left.property.name);
    }

    // If we are assigning a field to the prototype then track
    // that this field has been set against a prototype.
    if (node.left.type === 'MemberExpression' &&
        node.left.object.type === 'MemberExpression' &&
        node.left.object.property.name === 'prototype'
    ) {
        assert(node.left.object.object.type === 'Identifier',
            'expected identifier');
        var funcName = node.left.object.object.name;
        fieldName = node.left.property.name;

        assert(this.meta.currentScope.type === 'file',
            'expected to be in file scope');

        this.meta.currentScope.addPrototypeField(
            funcName, fieldName, rightType
        );
    }

    // If the right value of the assignment is an identifier then
    // mark that identifier as having been aliased.
    if (node.right.type === 'Identifier') {
        this.meta.currentScope.markVarAsAlias(
            node.right.name, null
        );
    }

    return rightType;
};

ASTVerifier.prototype.verifyMemberExpression =
function verifyMemberExpression(node) {
    var objType = this.meta.verifyNode(node.object, null);
    var propName = node.property.name;

    if (objType === null) {
        return null;
    }

    /*  For the allowUnknownRequire rule, we want to allow people
        to de-reference a field from a require callsite like

        var foo = require('bar').foo;

        This means in the member expression check we have to double
        check if we are in the variable initialization phase
        instead of being in the usage phase.

        For example

        var bar = require('bar');
        bar.foo;

        Should still be invalid because we are using bar without
        knowing what its type is.
    */
    if (objType.builtin &&
        (
            objType.name === '%Mixed%%UnknownRequire' ||
            objType.name === '%Mixed%%UnknownExports'
        ) &&
        node.object.type === 'CallExpression' &&
        node.object.callee.type === 'Identifier' &&
        node.object.callee.name === 'require'
    ) {
        var requireType = this.meta.verifyNode(node.object.callee, null);

        if (requireType.name === '%Require%%RequireFunction' &&
            requireType.builtin &&
            this.meta.checkerRules.allowUnknownRequire
        ) {
            return JsigAST.literal('%Mixed%%UnknownRequire', true);
        }
    }

    var valueType;
    if (!node.computed) {
        valueType = this._findPropertyInType(node, objType, propName);
    } else {
        var propType = this.meta.verifyNode(node.property, null);
        if (!propType) {
            return null;
        }
        valueType = this._findTypeInContainer(node, objType, propType);
    }

    return valueType;
};

ASTVerifier.prototype.verifyThisExpression =
function verifyThisExpression(node) {
    var thisType = this.meta.currentScope.getThisType();

    if (!thisType) {
        var funcName = this.meta.currentScope.funcName;
        var funcType = this.meta.currentScope.funcType;

        this.meta.addError(Errors.NonExistantThis({
            funcName: funcName,
            funcType: funcType ?
                this.meta.serializeType(funcType) : null,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    return thisType;
};

ASTVerifier.prototype.verifyIdentifier =
function verifyIdentifier(node) {
    // FFFF--- javascript. undefined is a value, not an identifier
    if (node.name === 'undefined') {
        return JsigAST.value('undefined');
    }

    var token = this.meta.currentScope.getVar(node.name);
    if (token) {
        return token.defn;
    }

    if (node.name === 'global') {
        return this.meta.currentScope.getGlobalType();
    }

    if (this.meta.currentExpressionType &&
        this.meta.currentExpressionType.type === 'function' &&
        this.meta.currentScope.getUntypedFunction(node.name)
    ) {
        var exprType = this.meta.currentExpressionType;
        var bool = this.meta.tryUpdateFunction(node.name, exprType);
        if (bool) {
            return exprType;
        }
    }

    var isUnknown = Boolean(this.meta.currentScope.getUnknownVar(node.name));

    if (isUnknown) {
        this.meta.addError(Errors.UnTypedIdentifier({
            tokenName: node.name,
            line: node.loc.start.line,
            loc: node.loc
        }));
    } else {
        this.meta.addError(Errors.UnknownIdentifier({
            tokenName: node.name,
            line: node.loc.start.line,
            loc: node.loc
        }));
    }

    return null;
};

ASTVerifier.prototype.verifyLiteral =
function verifyLiteral(node) {
    return this.meta.inferType(node);
};

ASTVerifier.prototype.verifyArrayExpression =
function verifyArrayExpression(node) {
    return this.meta.inferType(node);
};

ASTVerifier.prototype._getTypeFromFunctionCall =
function _getTypeFromFunctionCall(node) {
    var token;
    var defn;

    if (node.callee.type === 'Identifier') {
        token = this.meta.currentScope.getVar(node.callee.name);
        if (token) {
            defn = token.defn;
        } else {
            defn = this.meta.inferType(node);
        }

        var funcNode = this.meta.currentScope
            .getUntypedFunction(node.callee.name);

        var err;
        if (!defn && funcNode) {
            err = Errors.UnTypedFunctionCall({
                funcName: node.callee.name,
                callExpression: this.meta.serializeAST(node.callee),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        } else if (!defn) {
            err = Errors.UnknownIdentifier({
                tokenName: node.callee.name,
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }
    } else {
        defn = this.verifyNode(node.callee, null);
        if (!defn) {
            return null;
        }
    }

    return defn;
};

ASTVerifier.prototype._resolveInternalFnCall =
function _resolveInternalFnCall(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.call() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being call() must have thisArg');

    var argTypes = [
        JsigAST.param('thisArg', fnToCall.thisArg.value)
    ];

    for (var i = 0; i < fnToCall.args.length; i++) {
        argTypes.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: argTypes,
        result: JsigAST.literal('void'),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

ASTVerifier.prototype._resolveInternalFnApply =
function _resolveInternalFnApply(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.apply() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being call() must have thisArg');

    var argTypes = [];

    for (var i = 0; i < fnToCall.args.length; i++) {
        argTypes.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: [
            JsigAST.param('thisArg', fnToCall.thisArg.value),
            JsigAST.param('args', JsigAST.tuple(argTypes))
        ],
        result: JsigAST.literal('void'),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

ASTVerifier.prototype._resolveInternalFnBind =
function _resolveInternalFnBind(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only fn.bind() in a member expression');
    var fnToCall = this.meta.verifyNode(node.callee.object, null);

    assert(fnToCall && fnToCall.type === 'function',
        'function being called must be a function');
    assert(fnToCall.thisArg,
        'function being bind() must have thisArg');

    var argTypes = [
        JsigAST.param('thisArg', fnToCall.thisArg.value),
        JsigAST.param('firstArg', fnToCall.args[0].value)
    ];

    var returnArgs = [];

    for (var i = 1; i < fnToCall.args.length; i++) {
        returnArgs.push(fnToCall.args[i]);
    }

    var callFuncType = JsigAST.functionType({
        args: argTypes,
        result: JsigAST.functionType({
            args: returnArgs,
            result: fnToCall.result
        }),
        thisArg: JsigAST.param('this', fnToCall)
    });

    return callFuncType;
};

function isDictionary(exprType) {
    return exprType && exprType.type === 'genericLiteral' &&
        exprType.value.type === 'typeLiteral' &&
        exprType.value.builtin && exprType.value.name === 'Object';
}

ASTVerifier.prototype._resolveInternalObjectCreate =
function _resolveInternalObjectCreate(node, defn) {
    assert(node.callee.type === 'MemberExpression',
        'Can only object.create() in member expression');

    var returnType = null;

    var currExprType = this.meta.currentExpressionType;
    if (isDictionary(currExprType)) {
        returnType = this.meta.currentExpressionType;
    } else if (currExprType && currExprType.type === 'unionType') {
        for (var i = 0; i < currExprType.unions.length; i++) {
            if (isDictionary(currExprType.unions[i])) {
                returnType = currExprType.unions[i];
                break;
            }
        }

        if (!returnType) {
            returnType = JsigAST.literal('%Object%%Empty', true);
        }
    } else {
        // returnType = JsigAST.generic(
        //     JsigAST.literal('Object'),
        //     [
        //         JsigAST.literal('String'),
        //         JsigAST.freeLiteral('T')
        //     ]
        // );
        returnType = JsigAST.literal('%Object%%Empty', true);
    }

    var callFuncType = JsigAST.functionType({
        args: [
            JsigAST.param('parent', JsigAST.value('null'))
        ],
        result: returnType
    });

    return callFuncType;
};

ASTVerifier.prototype._tryResolveInternalFunction =
function _tryResolveInternalFunction(node, defn) {
    if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnCall'
    ) {
        return this._resolveInternalFnCall(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnBind'
    ) {
        return this._resolveInternalFnBind(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%FnApply'
    ) {
        return this._resolveInternalFnApply(node, defn);
    } else if (defn.type === 'typeLiteral' && defn.builtin &&
        defn.name === '%InternalFunction%%ObjectCreate'
    ) {
        return this._resolveInternalObjectCreate(node, defn);
    }

    return defn;
};

ASTVerifier.prototype._tryResolveMacroCall =
function _tryResolveMacroCall(node, defn) {
    if (defn.type === 'macroLiteral') {
        var macroImpl = this.meta.getOrCreateMacro(defn);

        var fnToCall = macroImpl.resolveFunction(node, defn);
        return fnToCall;
    }

    return defn;
};

ASTVerifier.prototype.verifyCallExpression =
function verifyCallExpression(node) {
    var err;

    // TODO: support shadowing require...
    if (node.callee.type === 'Identifier' &&
        node.callee.name === 'require'
    ) {
        var typeDefn = this.meta.verifyNode(node.callee, null);
        assert(
            typeDefn.name === '%Require%%RequireFunction' &&
            typeDefn.builtin,
            'require must be the require function'
        );

        return this._getTypeFromRequire(node);
    }

    var defn = this._getTypeFromFunctionCall(node);
    if (!defn) {
        return null;
    }

    defn = this._tryResolveMacroCall(node, defn);
    if (!defn) {
        return null;
    }

    defn = this._tryResolveInternalFunction(node, defn);

    if (defn.type !== 'function' && defn.type !== 'intersectionType') {
        err = Errors.CallingNonFunctionObject({
            objType: this.meta.serializeType(defn),
            callExpression: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (defn.type === 'function') {
        return this._checkFunctionCallExpr(node, defn, false);
    }

    // Handle intersections

    var allErrors = [];
    var result = null;

    for (var i = 0; i < defn.intersections.length; i++) {
        var possibleFn = defn.intersections[i];

        var prevErrors = this.meta.getErrors();
        var beforeErrors = this.meta.countErrors();
        var possibleReturn = this._checkFunctionCallExpr(
            node, possibleFn, true
        );
        var afterErrors = this.meta.countErrors();

        if (beforeErrors === afterErrors && possibleReturn) {
            result = possibleReturn;
            break;
        } else {
            var currErrors = this.meta.getErrors();
            for (var j = beforeErrors; j < afterErrors; j++) {
                currErrors[j].branchType = this.meta.serializeType(possibleFn);
                allErrors.push(currErrors[j]);
            }
            this.meta.setErrors(prevErrors);
        }
    }

    if (result === null) {
        var args = [];
        for (i = 0; i < node.arguments.length; i++) {
            var argType = this.meta.verifyNode(node.arguments[i], null);
            if (!argType) {
                argType = JsigAST.literal('<TypeError for js expr `' +
                    this.meta.serializeAST(node.arguments[i]) + '`>');
            }
            args.push(argType);
        }

        var finalErr = Errors.FunctionOverloadCallMisMatch({
            expected: serialize(defn),
            actual: serialize(JsigAST.tuple(args)),
            funcName: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });

        finalErr.originalErrors = allErrors;
        this.meta.addError(finalErr);
    }

    return result;
};

function typeHasFreeLiteral(typeExpr) {
    var types = [];
    if (typeExpr.type === 'genericLiteral') {
        types.push(typeExpr);
    }
    if (typeExpr.type === 'unionType') {
        for (var i = 0; i < typeExpr.unions.length; i++) {
            var possibleType = typeExpr.unions[i];
            if (possibleType.type === 'genericLiteral') {
                types.push(possibleType);
            }
        }
    }

    for (i = 0; i < types.length; i++) {
        var actualType = types[i];
        if (actualType.type === 'genericLiteral' &&
            actualType.generics[0] &&
            actualType.generics[0].type === 'freeLiteral'
        ) {
            return true;
        }
    }

    return false;
}

ASTVerifier.prototype._updateFreeLiteralType =
function _updateFreeLiteralType(node, actualType, wantedType) {
    if (actualType.type === 'genericLiteral' &&
        actualType.generics[0] &&
        actualType.generics[0].type === 'freeLiteral'
    ) {
        assert(actualType.generics.length === wantedType.generics.length,
            'must have same number of generics');
        return JsigAST.generic(
            actualType.value, wantedType.generics.slice()
        );
    }

    // console.log('?', actualType);
    assert(actualType.type === 'unionType', 'must be a union');

    var newUnions = [];
    for (var i = 0; i < actualType.unions.length; i++) {
        var possibleType = actualType.unions[i];
        if (possibleType.type === 'genericLiteral' &&
            possibleType.generics[0] &&
            possibleType.generics[0].type === 'freeLiteral'
        ) {
            newUnions.push(
                this._updateFreeLiteralType(node, possibleType, wantedType)
            );
        } else {
            newUnions.push(possibleType);
        }
    }

    return computeSmallestUnion(node, JsigAST.union(newUnions));
};

ASTVerifier.prototype._checkFunctionCallArgument =
function _checkFunctionCallArgument(node, defn, index, isOverload) {
    var argNode = node.arguments[index];

    var wantedType = defn.args[index].value;
    if (defn.args[index].optional) {
        wantedType = JsigAST.union([
            wantedType, JsigAST.value('undefined')
        ]);
    }

    var actualType;
    if (argNode.type === 'Identifier' &&
        this.meta.currentScope.getUntypedFunction(
            argNode.name
        )
    ) {
        var funcName = argNode.name;
        if (!this.meta.tryUpdateFunction(funcName, wantedType)) {
            return false;
        }

        actualType = wantedType;
    } else if (argNode.type === 'FunctionExpression' &&
        isOverload
    ) {
        var beforeErrors = this.meta.countErrors();
        actualType = this.meta.verifyNode(argNode, wantedType);
        var afterErrors = this.meta.countErrors();
        if (!actualType || (beforeErrors !== afterErrors)) {
            this.meta.currentScope.revertFunctionScope(
                this.meta.getFunctionName(argNode), wantedType
            );
            return false;
        }
    } else {
        actualType = this.meta.verifyNode(argNode, wantedType);
    }

    if (!actualType) {
        return false;
    }

    // late bind a freeLiteral generic based on function calls
    // If an `Array<T>` is passed to a function and that function
    // expects Array<String> then convert it to Array<String>
    if (argNode.type === 'Identifier' &&
        typeHasFreeLiteral(actualType) &&
        wantedType && wantedType.type === 'genericLiteral'
    ) {
        var newType = this._updateFreeLiteralType(
            node, actualType, wantedType
        );
        this.meta.currentScope.forceUpdateVar(argNode.name, newType);
        actualType = newType;
    }

    /*  If a literal string value is expected AND
        A literal string value is passed as an argument
        a.k.a not an alias or field.

        Then convert the TypeLiteral into a ValueLiteral
     */
    if (wantedType.type === 'valueLiteral' &&
        wantedType.name === 'string' &&
        argNode.type === 'Literal' &&
        actualType.type === 'typeLiteral' &&
        actualType.builtin &&
        actualType.name === 'String' &&
        typeof actualType.concreteValue === 'string'
    ) {
        actualType = JsigAST.value(
            '"' + actualType.concreteValue + '"', 'string'
        );
    }

    if (wantedType.type === 'genericLiteral' &&
        wantedType.value.name === 'Array' &&
        wantedType.value.builtin &&
        actualType.type === 'tuple' &&
        actualType.inferred &&
        argNode.type === 'Identifier'
    ) {
        var token = this.meta.currentScope.getVar(argNode.name);

        var self = this;
        newType = this._maybeConvertToArray(
            token, argNode.name, actualType,
            function verify(possibleArray) {
                return self.meta.checkSubType(
                    argNode, wantedType, possibleArray
                );
            }
        );

        if (newType) {
            actualType = newType;
        }
    }

    this.meta.checkSubType(argNode, wantedType, actualType);

    if (argNode.type === 'Identifier') {
        this.meta.currentScope.markVarAsAlias(
            argNode.name, null
        );
    }

    return true;
};

ASTVerifier.prototype._checkFunctionCallExpr =
function _checkFunctionCallExpr(node, defn, isOverload) {
    var err;

    if (defn.generics.length > 0) {
        // TODO: resolve generics
        var oldDefn = defn;
        defn = this.meta.resolveGeneric(defn, node);
        if (!defn) {
            var args = [];
            if (oldDefn.thisArg) {
                var objType = this.meta.verifyNode(node.callee.object, null);
                if (objType) {
                    args.push('this: ' + this.meta.serializeType(objType));
                } else {
                    args.push('<TypeError for js expr `' +
                        this.meta.serializeAST(node.callee.object) + '`>'
                    );
                }
            }
            for (var i = 0; i < node.arguments.length; i++) {
                var argType = this.meta.verifyNode(node.arguments[i], null);
                if (argType) {
                    args.push(this.meta.serializeType(argType));
                } else {
                    args.push('<TypeError for js expr `' +
                        this.meta.serializeAST(node.arguments[i]) + '`>'
                    );
                }
            }

            var actualStr = '[' + args.join(', ') + ']';

            this.meta.addError(Errors.CannotCallGenericFunction({
                funcName: this.meta.serializeAST(node.callee),
                expected: this.meta.serializeType(oldDefn),
                actual: actualStr,
                loc: node.loc,
                line: node.loc.start.line
            }));
            return null;
        }
    }

    var minArgs = defn.args.length;
    for (i = 0; i < defn.args.length; i++) {
        if (defn.args[i].optional) {
            minArgs--;
        }
    }

    if (node.arguments.length < minArgs) {
        err = Errors.TooFewArgsInCall({
            funcName: this.meta.serializeAST(node.callee),
            actualArgs: node.arguments.length,
            expectedArgs: minArgs,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    } else if (node.arguments.length > defn.args.length) {
        err = Errors.TooManyArgsInCall({
            funcName: this.meta.serializeAST(node.callee),
            actualArgs: node.arguments.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    }

    var minLength = Math.min(defn.args.length, node.arguments.length);
    for (i = 0; i < minLength; i++) {
        this._checkFunctionCallArgument(
            node, defn, i, isOverload
        );
    }

    // TODO: figure out thisType in call verification
    if (defn.thisArg) {
        assert(node.callee.type === 'MemberExpression',
            'must be a method call expression');

        // TODO: This could be wrong...
        var obj = this.meta.verifyNode(node.callee.object, null);
        assert(obj, 'object of method call must have a type');

        // Try to late-bound a concrete instance of a free variable
        // in a generic.
        if (defn.generics.length > 0 && obj.type === 'genericLiteral') {
            var hasFreeLiteral = obj.generics[0].type === 'freeLiteral';
            var thisArgType = defn.thisArg.value;

            assert(!defn.thisArg.optional, 'do not support optional this');
            assert(thisArgType.type === 'genericLiteral',
                'thisArg must be generic...');

            if (hasFreeLiteral) {
                assert(!isOverload,
                    'cannot resolve free literal in overloaded function'
                );

                var newGenerics = [];
                assert(obj.generics.length === thisArgType.generics.length,
                    'expected same number of generics');
                for (i = 0; i < obj.generics.length; i++) {
                    newGenerics[i] = thisArgType.generics[i];
                }

                var newType = JsigAST.generic(
                    obj.value, newGenerics
                );
                assert(node.callee.object.type === 'Identifier',
                    'object must be variable reference');

                this.meta.currentScope.forceUpdateVar(
                    node.callee.object.name, newType
                );
                obj = newType;
            }
        }

        assert(!defn.thisArg.optional, 'do not support optional this');
        this.meta.checkSubType(node.callee.object, defn.thisArg.value, obj);
    }

    /*
        Detect `Base.call(this)` pattern that is used to invoke
        the constructor of a base class.
    */
    var funcScope = this.meta.currentScope.getFunctionScope();
    if (funcScope && funcScope.isConstructor &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'call' &&
        node.arguments[0] &&
        node.arguments[0].type === 'ThisExpression'
    ) {
        var fnToCall = this.meta.verifyNode(node.callee.object, null);
        var thisArg = fnToCall.thisArg.value;

        if (thisArg && thisArg.type === 'object' &&
            thisArg.keyValues.length > 0
        ) {
            for (i = 0; i < thisArg.keyValues.length; i++) {
                funcScope.addKnownField(thisArg.keyValues[i].key);
            }
        }
    }

    if (defn.type === 'function' && defn.specialKind === 'assert') {
        var ifBranch = this.meta.allocateBranchScope();
        var elseBranch = this.meta.allocateBranchScope();

        this.meta.narrowType(node.arguments[0], ifBranch, elseBranch);

        // Since the assertion must hold true
        // We can copy over all type restrictions from the ifBranch
        // into the current scope of the call expression

        var restrictedTypes = ifBranch.getRestrictedTypes();
        for (i = 0; i < restrictedTypes.length; i++) {
            var name = restrictedTypes[i];
            var ifType = ifBranch.getVar(name);

            this.meta.currentScope.restrictType(name, ifType.defn);
        }
    }

    return defn.result;
};

ASTVerifier.prototype.verifyBinaryExpression =
function verifyBinaryExpression(node) {
    var leftType = this.meta.verifyNode(node.left, null);
    if (!leftType) {
        return null;
    }

    var rightType = this.meta.verifyNode(node.right, null);
    if (!rightType) {
        return null;
    }

    var operator = node.operator;
    var token = this.meta.getOperator(operator);
    assert(token, 'do not support unknown operators: ' + operator);

    var intersections = token.defn.type === 'intersectionType' ?
        token.defn.intersections : [token.defn];

    var defn;
    var correctDefn = intersections[0];
    var isBad = true;
    var errors = [];
    for (var i = 0; i < intersections.length; i++) {
        defn = intersections[i];

        assert(defn.args.length === 2,
            'expected type defn args to be two');

        var leftError = this.meta.checkSubTypeRaw(
            node.left, defn.args[0].value, leftType
        );
        var rightError = this.meta.checkSubTypeRaw(
            node.right, defn.args[1].value, rightType
        );

        if (!leftError && !rightError) {
            correctDefn = defn;
            isBad = false;
        } else {
            if (leftError) {
                leftError.branchType = this.meta.serializeType(defn);
                errors.push(leftError);
            }
            if (rightError) {
                rightError.branchType = this.meta.serializeType(defn);
                errors.push(rightError);
            }
        }
    }

    // TODO: better error message UX
    if (isBad && intersections.length === 1) {
        for (var j = 0; j < errors.length; j++) {
            this.meta.addError(errors[j]);
        }
    } else if (isBad && intersections.length > 1) {
        var finalErr = Errors.IntersectionOperatorCallMismatch({
            expected: serialize(token.defn),
            actual: serialize(JsigAST.tuple([leftType, rightType])),
            operator: node.operator,
            loc: node.loc,
            line: node.loc.start.line
        });

        finalErr.originalErrors = errors;
        this.meta.addError(finalErr);
    }

    if ((operator === '===' || operator === '!==') &&
        (isNeverLiteral(leftType) || isNeverLiteral(rightType))
    ) {
        return JsigAST.literal('Never', true);
    }

    return correctDefn.result;
};

function isNeverLiteral(type) {
    return type && type.type === 'typeLiteral' && type.builtin &&
        type.name === 'Never';
}

ASTVerifier.prototype.verifyReturnStatement =
function verifyReturnStatement(node) {
    var funcScope = this.meta.currentScope.getFunctionScope();
    assert(funcScope, 'return must be within a function scope');

    var defn;
    if (node.argument === null) {
        defn = JsigAST.literal('void');
    } else {
        var exprType = this.meta.currentScope.getReturnValueType();
        defn = this.meta.verifyNode(node.argument, exprType);

        if (defn && defn.type === 'genericLiteral' &&
            defn.generics[0] &&
            defn.generics[0].type === 'freeLiteral' &&
            node.argument.type === 'Identifier' &&
            exprType && exprType.type === 'genericLiteral'
        ) {
            var newGenerics = [];
            assert(exprType.generics.length === defn.generics.length,
                'expected same number of generics');
            for (var i = 0; i < exprType.generics.length; i++) {
                newGenerics[i] = exprType.generics[i];
            }

            var newType = JsigAST.generic(defn.value, newGenerics);
            this.meta.currentScope.forceUpdateVar(
                node.argument.name, newType
            );
            defn = newType;
        }

        // TODO: really really need to do better job checking returns
        if (exprType && defn) {
            this.meta.checkSubType(node.argument, exprType, defn);
        }
    }

    if (defn) {
        funcScope.markReturnType(defn, node);
    }
    return defn;
};

ASTVerifier.prototype.verifyNewExpression =
function verifyNewExpression(node) {
    var beforeError = this.meta.countErrors();
    var fnType = this.meta.verifyNode(node.callee, null);
    var afterError = this.meta.countErrors();

    if (!fnType) {
        if (beforeError === afterError) {
            assert(false, '!!! cannot call new on unknown function');
        }
        return null;
    }

    // Grab first function...
    if (fnType.type === 'intersectionType') {
        for (var i = 0; i < fnType.intersections.length; i++) {
            var possibleType = fnType.intersections[i];
            if (possibleType.type === 'function') {
                fnType = possibleType;
                break;
            }
        }
    }

    var err;
    if (fnType.type !== 'function') {
        err = Errors.CallingNewOnNonFunction({
            objType: this.meta.serializeType(fnType),
            funcName: node.callee.name,
            newExpression: this.meta.serializeAST(node.callee),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    assert(fnType.type === 'function', 'only support defined constructors');

    if (!fnType.thisArg) {
        err = Errors.CallingNewOnPlainFunction({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var thisArgType = fnType.thisArg.value;
    assert(!fnType.thisArg.optional, 'do not support optional this');

    var thisObjects = thisArgType.type === 'intersectionType' ?
        thisArgType.intersections : [thisArgType];

    for (i = 0; i < thisObjects.length; i++) {
        var thisObj = thisObjects[i];

        if (thisObj.type !== 'object' ||
            thisObj.keyValues.length === 0
        ) {
            var possibleThisArg = this._tryResolveVirtualType(thisObj);
            if (!possibleThisArg ||
                thisObj.name === 'String' ||
                thisObj.name === 'Number' ||
                possibleThisArg.type !== 'object' ||
                possibleThisArg.keyValues.length === 0
            ) {
                err = Errors.ConstructorThisTypeMustBeObject({
                    funcName: node.callee.name,
                    thisType: serialize(thisArgType),
                    loc: node.loc,
                    line: node.loc.start.line
                });
                this.meta.addError(err);
                return null;
            }
        }
    }

    if (fnType.result.type !== 'typeLiteral' ||
        fnType.result.name !== 'void'
    ) {
        err = Errors.ConstructorMustReturnVoid({
            funcName: node.callee.name,
            returnType: serialize(fnType.result),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    var isConstructor = /[A-Z]/.test(getCalleeName(node)[0]);
    if (!isConstructor) {
        err = Errors.ConstructorMustBePascalCase({
            funcName: node.callee.name,
            funcType: serialize(fnType),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    // Handle generic constructors
    if (fnType.generics.length > 0) {
        fnType = this.meta.resolveGeneric(
            fnType, node, this.meta.currentExpressionType
        );
        if (!fnType) {
            return null;
        }

        thisArgType = fnType.thisArg.value;
    }

    var minArgs = fnType.args.length;
    for (i = 0; i < fnType.args.length; i++) {
        if (fnType.args[i].optional) {
            minArgs--;
        }
    }

    if (node.arguments.length > fnType.args.length) {
        err = Errors.TooManyArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: fnType.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    } else if (node.arguments.length < minArgs) {
        err = Errors.TooFewArgsInNewExpression({
            funcName: node.callee.name,
            actualArgs: node.arguments.length,
            expectedArgs: minArgs,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
    }

    var minLength = Math.min(fnType.args.length, node.arguments.length);
    for (i = 0; i < minLength; i++) {
        var wantedType = fnType.args[i].value;
        if (fnType.args[i].optional) {
            wantedType = JsigAST.union([
                wantedType, JsigAST.value('undefined')
            ]);
        }

        var actualType = this.meta.verifyNode(node.arguments[i], null);
        if (!actualType) {
            return null;
        }

        this.meta.checkSubType(node.arguments[i], wantedType, actualType);
    }

    thisArgType = cloneJSIG(thisArgType);
    thisArgType.brand = fnType.brand;
    thisArgType._raw = thisArgType._raw;

    return thisArgType;
};

function getCalleeName(node) {
    if (node.callee.type === 'Identifier') {
        return node.callee.name;
    } else if (node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier'
    ) {
        return node.callee.property.name;
    } else {
        assert(false, 'Cannot get callee name');
    }
}

ASTVerifier.prototype.verifyVariableDeclaration =
function verifyVariableDeclaration(node) {
    assert(node.declarations.length === 1,
        'only support single declaration');

    var decl = node.declarations[0];

    var id = decl.id.name;

    var token = this.meta.currentScope.getOwnVar(id);
    if (token) {
        assert(token.preloaded, 'cannot declare variable twice');
    }

    var leftType = token ? token.defn : null;

    if (decl.id.trailingComments &&
        decl.id.trailingComments.length > 0
    ) {
        var firstComment = decl.id.trailingComments[0];
        if (firstComment.value[0] === ':') {
            var expr = firstComment.value.slice(1);
            var declaredType = this.meta.parseTypeString(node, expr);
            if (declaredType && !leftType) {
                leftType = declaredType;
            }
        }
    }

    var type;
    if (decl.init) {

        var beforeErrors = this.meta.countErrors();
        type = this.meta.verifyNode(decl.init, leftType);
        var afterErrors = this.meta.countErrors();
        if (!type) {
            if (beforeErrors === afterErrors) {
                assert(false, '!!! could not find initType: ' +
                    this.meta.serializeAST(decl.init));
            }

            this.meta.currentScope.addUnknownVar(id);
            return null;
        }

        if (decl.init.type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                decl.init.name, id
            );
        }

        if (leftType) {
            this.meta.checkSubType(node, leftType, type);
            type = leftType;
        }
    } else {
        type = leftType ? leftType :
            JsigAST.literal('%Void%%Uninitialized', true);
    }

    if (type.type === 'valueLiteral' && type.name === 'null') {
        type = JsigAST.literal('%Null%%Default', true);
    }

    this.meta.currentScope.addVar(id, type);
    return null;
};

ASTVerifier.prototype.verifyForStatement =
function verifyForStatement(node) {
    this.meta.verifyNode(node.init, null);
    var testType = this.meta.verifyNode(node.test, null);

    assert(!testType || (
        testType.type === 'typeLiteral' && testType.name === 'Boolean'
    ), 'for loop condition statement must be a Boolean expression');

    this.meta.verifyNode(node.update, null);

    var forBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(forBranch);
    this.meta.verifyNode(node.body, null);
    this.meta.exitBranchScope();

    /*  A for loop runs 0 or more times.

        If a type changed in the body of the loop, then let the
        type outside of the loop be the union of the initial
        type and the loop body type
    */
    var currScope = this.meta.currentScope;
    var restrictedTypes = forBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var forType = forBranch.getOwnVar(name);
        var outerType = currScope.getOwnVar(name);

        if (!forType || !outerType) {
            continue;
        }

        if (forType.type === 'restriction') {
            var union = computeSmallestUnion(
                node, forType.defn, outerType.defn
            );

            currScope.restrictType(name, union);
        }
    }
};

ASTVerifier.prototype.verifyUpdateExpression =
function verifyUpdateExpression(node) {
    var firstType = this.meta.verifyNode(node.argument, null);
    if (!firstType) {
        return null;
    }

    var token = this.meta.getOperator(node.operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0].value, firstType);

    return defn.result;
};

ASTVerifier.prototype.verifyObjectExpression =
function verifyObjectExpression(node) {
    return this.meta.inferType(node);
};

/*
    check test expression
    Allocate if branch scope ; Allocate else branch scope;
    narrowType(node, ifBranch, elseBranch);

    check if within ifBranch scope
    check else within elseBranch scope

    For each restriction that exists in both if & else.
    change the type of that identifier in function scope.
*/
ASTVerifier.prototype.verifyIfStatement =
function verifyIfStatement(node) {
    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    // TODO: check things ?
    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    var ifTestType = this.meta.verifyNode(node.test, null);
    this.meta.exitBranchScope();
    var isIfNeverType = ifTestType && ifTestType.type === 'typeLiteral' &&
        ifTestType.name === 'Never' && ifTestType.builtin;

    // If the expr evaluated to Never then the block is Never run.
    if (node.consequent && !isIfNeverType) {
        this.meta.enterBranchScope(ifBranch);
        this.meta.verifyNode(node.consequent, null);
        this.meta.exitBranchScope();
    }

    this.meta.enterBranchScope(elseBranch);
    var elseTestType = this.meta.verifyNode(node.test, null);
    this.meta.exitBranchScope();
    var isElseNeverType = elseTestType && elseTestType.type === 'typeLiteral' &&
        elseTestType.name === 'Never' && elseTestType.builtin;

    // If the expr evaluated to Always then the else block is Never run
    if (node.alternate && !isElseNeverType) {
        this.meta.enterBranchScope(elseBranch);
        var elseBlockType = this.meta.verifyNode(node.alternate, null);
        this.meta.exitBranchScope();

        // If we have an if statement with an early return
        // And the non-existant else block is Never type then
        // the if statement will always run and the rest
        // of the block will never run because of the early return
        if (node.alternate.type === 'IfStatement' &&
            isNeverLiteral(elseBlockType)
        ) {
            isElseNeverType = true;
        }
    }

    var isRestricted = [];

    var restrictedTypes = ifBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var ifType = ifBranch.getOwnVar(name);
        var elseType = elseBranch.getOwnVar(name);

        if (!ifType || !elseType) {
            continue;
        }

        if (isSameType(ifType.defn, elseType.defn)) {
            isRestricted.push(name);
            this.meta.currentScope.restrictType(name, ifType.defn);
        } else if (
            ifType.type === 'restriction' &&
            elseType.type === 'restriction'
        ) {
            var union = computeSmallestUnion(
                node, ifType.defn, elseType.defn
            );

            isRestricted.push(name);
            // console.log('wtf', {
            //     scopeType: this.meta.currentScope.type,
            //     name: name,
            //     union: this.meta.serializeType(union)
            // });
            this.meta.currentScope.restrictType(name, union);
        }
    }

    // TODO create unions based on typeRestrictions & mutations...

    // Support an early return if statement
    // If the `consequent` is a `ReturnStatement` then
    // copy over all type restrictions from the `elseBranch`
    // onto the current scope
    var lastStatement = null;
    if (node.consequent.type === 'BlockStatement') {
        var statements = node.consequent.body;
        lastStatement = statements[statements.length - 1];
    }

    if (node.consequent.type === 'BlockStatement' &&
        node.consequent.body.length > 0 &&
        (
            lastStatement.type === 'ReturnStatement' ||
            lastStatement.type === 'ContinueStatement'
        )
    ) {
        restrictedTypes = elseBranch.getRestrictedTypes();
        for (i = 0; i < restrictedTypes.length; i++) {
            name = restrictedTypes[i];
            elseType = elseBranch.getOwnVar(name);

            if (isRestricted.indexOf(name) === -1) {
                this.meta.currentScope.restrictType(name, elseType.defn);
            }
        }

        var restrictedThisType = elseBranch.getRestrictedThisType();
        if (restrictedThisType) {
            this.meta.currentScope.restrictType('this', restrictedThisType);
        }

        if (isElseNeverType &&
            lastStatement.type === 'ReturnStatement'
        ) {
            return JsigAST.literal('Never', true);
        }
    }

    return null;
};

ASTVerifier.prototype.verifyUnaryExpression =
function verifyUnaryExpression(node) {
    if (node.operator === 'delete') {
        this.meta.verifyNode(node.argument, null);
        var objectType = this.meta.verifyNode(node.argument.object, null);

        assert(objectType.type === 'genericLiteral',
            'delete must operate on generic objects');
        assert(objectType.value.type === 'typeLiteral' &&
            objectType.value.name === 'Object',
            'delete must operate on objects');

        return null;
    }

    var firstType = this.meta.verifyNode(node.argument, null);
    if (!firstType) {
        return null;
    }

    var operator = node.operator;
    if (operator === '+') {
        operator = '%Unary%%Plus';
    } else if (operator === '-') {
        operator = '%Unary%%Minus';
    }

    var token = this.meta.getOperator(operator);
    assert(token, 'do not support unknown operators: ' + node.operator);

    var defn = token.defn;
    assert(defn.args.length === 1,
        'expecteted type defn args to be one');

    this.meta.checkSubType(node.argument, defn.args[0].value, firstType);

    if (operator === '%Unary%%Minus' &&
        firstType.type === 'typeLiteral' &&
        firstType.name === 'Number' &&
        firstType.concreteValue !== null
    ) {
        return JsigAST.literal('Number', true, {
            concreteValue: -firstType.concreteValue
        });
    }

    // The typeof operator, when evaluated on Never should
    // return Never instead of void. This allow the if condition
    // statement to mark a branch as Never if the typeof is
    // garantueed to fail.
    if (operator === 'typeof' && firstType.type === 'typeLiteral' &&
        firstType.name === 'Never' && firstType.builtin
    ) {
        return firstType;
    }

    return defn.result;
};

ASTVerifier.prototype.verifyLogicalExpression =
function verifyLogicalExpression(node) {
    assert(node.operator === '||' || node.operator === '&&',
        'only || and && are supported as logical operators');

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    var leftType = this.meta.verifyNode(node.left, null);
    if (!leftType) {
        return null;
    }

    this.meta.narrowType(node.left, ifBranch, elseBranch);

    if (node.operator === '&&') {
        this.meta.enterBranchScope(ifBranch);
    } else if (node.operator === '||') {
        this.meta.enterBranchScope(elseBranch);
    } else {
        assert(false, 'unsupported logical operator');
    }

    var exprType = null;
    if (node.operator === '||') {
        exprType = this.meta.currentExpressionType;
    }

    var rightType = this.meta.verifyNode(node.right, exprType);
    this.meta.exitBranchScope();
    if (!rightType) {
        return null;
    }

    var t1;
    var t2;
    if (node.operator === '||') {
        t1 = getUnionWithoutBool(leftType, true);
        t2 = rightType;
    } else if (node.operator === '&&') {
        t1 = getUnionWithoutBool(leftType, false);
        t2 = rightType;
    } else {
        assert(false, 'unimplemented operator');
    }

    return computeSmallestUnion(node, t1, t2);
};

function getFunctionName(node) {
    return node.id ? node.id.name : '(anonymous)';
}

ASTVerifier.prototype.verifyFunctionExpression =
function verifyFunctionExpression(node) {
    var potentialType = this.meta.currentExpressionType;
    if (!potentialType) {
        var err = Errors.UnTypedFunctionExpressionFound({
            funcName: getFunctionName(node),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    // If we are assigning this function expression against
    // and unknown exports field then skip checking
    if (potentialType.type === 'typeLiteral' &&
        potentialType.builtin &&
        potentialType.name === '%Mixed%%UnknownExportsField' &&
        this.meta.checkerRules.allowUnusedFunction
    ) {
        return null;
    }

    // If we are assigning onto a Mixed%%OpenField then
    // skip checking this function expression
    if (potentialType.type === 'typeLiteral' &&
        potentialType.builtin &&
        (
            potentialType.name === '%Mixed%%OpenField' ||
            potentialType.name === '%Mixed%%UnknownExportsField' ||
            potentialType.name === '%Export%%ModuleExports'
        )
    ) {
        err = Errors.UnTypedFunctionExpressionFound({
            funcName: getFunctionName(node),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    if (potentialType.type !== 'function' &&
        potentialType.type !== 'unionType' &&
        potentialType.type !== 'intersectionType'
    ) {
        err = Errors.UnexpectedFunction({
            expected: this.meta.serializeType(potentialType),
            actual: 'Function',
            funcName: getFunctionName(node),
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return null;
    }

    this._checkFunctionType(node, potentialType);
    return potentialType;
};

ASTVerifier.prototype.verifyContinueStatement =
function verifyContinueStatement(node) {
    assert(node.label === null, 'do not support goto');

    return null;
};

ASTVerifier.prototype.verifyBreakStatement =
function verifyBreakStatement(node) {
    assert(node.label === null, 'do not support goto');

    return null;
};

ASTVerifier.prototype.verifyThrowStatement =
function verifyThrowStatement(node) {
    var argType = this.meta.verifyNode(node.argument, null);
    if (argType === null) {
        return null;
    }

    if (argType.brand !== 'Error') {
        this.meta.addError(Errors.InvalidThrowStatement({
            expected: 'Error',
            actual: this.meta.serializeType(argType),
            loc: node.loc,
            line: node.loc.start.line
        }));
    }

    return null;
};

ASTVerifier.prototype.verifyConditionalExpression =
function verifyConditionalExpression(node) {
    // TODO: support branch scopes

    this.meta.verifyNode(node.test, null);

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    var left = this.meta.verifyNode(node.consequent, null);
    this.meta.exitBranchScope();
    if (!left) {
        return null;
    }

    this.meta.enterBranchScope(elseBranch);
    var right = this.meta.verifyNode(node.alternate, null);
    this.meta.exitBranchScope();
    if (!right) {
        return null;
    }

    if (isSameType(left, right)) {
        return left;
    }

    return computeSmallestUnion(
        node, left, right
    );
};

ASTVerifier.prototype.verifyWhileStatement =
function verifyWhileStatement(node) {
    this.meta.verifyNode(node.test, null);

    var ifBranch = this.meta.allocateBranchScope();
    var elseBranch = this.meta.allocateBranchScope();

    // TODO: check things ?
    this.meta.narrowType(node.test, ifBranch, elseBranch);

    this.meta.enterBranchScope(ifBranch);
    this.meta.verifyNode(node.body, null);
    this.meta.exitBranchScope();
};

ASTVerifier.prototype.verifyTryStatement =
function verifyTryStatement(node) {
    assert(!node.finalizer, 'do not support try finally');

    var tryBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(tryBranch);
    this.meta.verifyNode(node.block, null);
    this.meta.exitBranchScope();

    var catchBranch = this.meta.allocateBranchScope();
    this.meta.enterBranchScope(catchBranch);
    this.meta.verifyNode(node.handler, null);
    this.meta.exitBranchScope();

    var restrictedTypes = tryBranch.getRestrictedTypes();
    for (var i = 0; i < restrictedTypes.length; i++) {
        var name = restrictedTypes[i];
        var tryType = tryBranch.getOwnVar(name);
        var catchType = catchBranch.getOwnVar(name);

        if (!tryType || !catchType) {
            continue;
        }

        if (tryType.type === 'restriction' &&
            catchType.type === 'restriction'
        ) {
            var union = computeSmallestUnion(
                node, tryType.defn, catchType.defn
            );
            this.meta.currentScope.restrictType(name, union);
        }
    }
};

ASTVerifier.prototype.verifyCatchClause =
function verifyCatchClause(node) {
    assert(node.param.type === 'Identifier',
        'catch block param must be Identifier');

    this.meta.currentScope.addVar(
        node.param.name, this.checker.errorType
    );
    this.meta.verifyNode(node.body, null);
};

ASTVerifier.prototype._checkFunctionOverloadType =
function _checkFunctionOverloadType(node, defn) {
    this.meta.enterFunctionOverloadScope(node, defn);

    this._verifyFunctionType(node, defn);

    this.meta.exitFunctionScope();
};

ASTVerifier.prototype._checkFunctionType =
function _checkFunctionType(node, defn) {
    if (defn.type === 'unionType') {
        var functionCount = 0;
        var lastFunc = null;
        for (var i = 0; i < defn.unions.length; i++) {
            var maybeFunc = defn.unions[i];
            if (maybeFunc.type === 'function') {
                functionCount++;
                lastFunc = maybeFunc;
            }
        }

        assert(functionCount <= 1,
            'cannot verify against union of functions');
        if (functionCount === 1) {
            this._checkFunctionType(node, lastFunc);
            return lastFunc;
        } else {
            var err = Errors.UnexpectedFunction({
                expected: this.meta.serializeType(defn),
                actual: 'Function',
                funcName: getFunctionName(node),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }
    } else if (defn.type === 'intersectionType') {
        var allTypes = defn.intersections;
        var anyFunction = false;
        for (i = 0; i < allTypes.length; i++) {
            var currType = allTypes[i];

            var isFunction = currType.type === 'function';
            if (!isFunction) {
                continue;
            }

            anyFunction = true;
            this._checkFunctionOverloadType(node, currType);
        }

        if (!anyFunction) {
            // TODO: actually show branches & originalErrors
            err = Errors.UnexpectedFunction({
                funcName: getFunctionName(node),
                expected: this.meta.serializeType(currType),
                actual: this.meta.serializeType(JsigAST.literal('Function')),
                loc: node.loc,
                line: node.loc.start.line
            });
            this.meta.addError(err);
            return null;
        }

        return defn;
    }

    this.meta.enterFunctionScope(node, defn);

    this._verifyFunctionType(node, defn);

    this.meta.exitFunctionScope();
};

ASTVerifier.prototype._verifyFunctionType =
function _verifyFunctionType(node, defn) {
    var err;
    if (node.params.length > defn.args.length) {
        err = Errors.TooManyArgsInFunc({
            funcName: getFunctionName(node),
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
    } else if (node.params.length < defn.args.length) {
        err = Errors.TooFewArgsInFunc({
            funcName: getFunctionName(node),
            actualArgs: node.params.length,
            expectedArgs: defn.args.length,
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
    }

    var statements = node.body.body;
    for (var i = 0; i < statements.length; i++) {
        if (statements[i].type === 'FunctionDeclaration') {
            var name = statements[i].id.name;
            this.meta.currentScope.addFunction(name, statements[i]);
        }
    }

    this.meta.verifyNode(node.body, null);

    var scope;
    if (this.meta.currentScope.isConstructor) {
        this._checkHiddenClass(node);

        scope = this.meta.currentScope;
        if (scope.knownReturnTypes.length > 0) {
            for (i = 0; i < scope.knownReturnTypes.length; i++) {
                this._checkVoidReturnType(
                    node,
                    scope.knownReturnTypes[i],
                    scope.returnStatementASTNodes[i]
                );
            }
        } else {
            this._checkVoidReturnType(node, null, null);
        }
    } else {
        // TODO: verify return.
        scope = this.meta.currentScope;
        if (scope.knownReturnTypes.length > 0) {
            for (i = 0; i < scope.knownReturnTypes.length; i++) {
                this._checkReturnType(
                    node,
                    scope.knownReturnTypes[i],
                    scope.returnStatementASTNodes[i]
                );
            }
        } else {
            this._checkReturnType(node, null, null);
        }
    }
};

ASTVerifier.prototype._checkHiddenClass =
function _checkHiddenClass(node) {
    var thisType = this.meta.currentScope.getThisType();
    var knownFields = this.meta.currentScope.knownFields;
    var protoFields = this.meta.currentScope.getPrototypeFields();

    var thisObjects = [];
    if (thisType && thisType.type === 'object') {
        thisObjects.push(thisType);
    } else if (thisType && thisType.type === 'intersectionType') {
        for (var i = 0; i < thisType.intersections.length; i++) {
            if (thisType.intersections[i].type === 'object') {
                thisObjects.push(thisType.intersections[i]);
            }
        }
    }

    var err;
    if (thisObjects.length === 0) {
        // console.log('thisType?', thisType, thisObjects);

        err = Errors.ConstructorThisTypeMustBeObject({
            funcName: this.meta.currentScope.funcName,
            thisType: thisType ? serialize(thisType) : 'void',
            loc: node.loc,
            line: node.loc.start.line
        });
        this.meta.addError(err);
        return;
    }

    var knownOffset = 0;
    for (i = 0; i < thisObjects.length; i++) {
        var thisObj = thisObjects[i];

        assert(thisObj && thisObj.type === 'object',
            'this field must be object');

        for (var j = 0; j < thisObj.keyValues.length; j++) {
            var key = thisObj.keyValues[j].key;
            if (
                knownFields[knownOffset] !== key &&
                !(protoFields && protoFields[key])
            ) {
                err = Errors.MissingFieldInConstr({
                    fieldName: key,
                    funcName: this.meta.currentScope.funcName,
                    otherField: knownFields[knownOffset] || 'no-field',
                    loc: node.loc,
                    line: node.loc.start.line
                });// new Error('missing field: ' + key);
                this.meta.addError(err);
            }

            knownOffset++;
        }
    }
};

ASTVerifier.prototype._checkReturnType =
function _checkReturnType(node, actual, returnNode) {
    var expected = this.meta.currentScope.returnValueType;
    var err;

    // If we never inferred the return type then it may or may not return
    if (expected.type === 'typeLiteral' &&
        expected.name === '%Void%%UnknownReturn'
    ) {
        return;
    }

    if (expected.type === 'typeLiteral' && expected.name === 'void') {
        if (actual !== null && !(
            actual.type === 'typeLiteral' && actual.name === 'void'
        )) {
            err = Errors.NonVoidReturnType({
                expected: 'void',
                actual: serialize(actual),
                funcName: this.meta.currentScope.funcName,
                loc: returnNode.loc,
                line: returnNode.loc.start.line
            });
            this.meta.addError(err);
        }
        return;
    }

    if (actual === null && returnNode === null) {
        var funcNode = this.meta.currentScope.funcASTNode;
        err = Errors.MissingReturnStatement({
            expected: serialize(expected),
            actual: 'void',
            funcName: this.meta.currentScope.funcName,
            loc: funcNode.loc,
            line: funcNode.loc.start.line
        });
        this.meta.addError(err);
        return;
    }

    this.meta.checkSubType(returnNode, expected, actual);
};

ASTVerifier.prototype._checkVoidReturnType =
function _checkVoidReturnType(node, actualReturnType, returnNode) {
    var returnType = this.meta.currentScope.returnValueType;

    var err;
    if (returnNode || actualReturnType !== null) {
        var returnTypeInfo = serialize(actualReturnType);
        err = Errors.ReturnStatementInConstructor({
            funcName: this.meta.currentScope.funcName,
            returnType: returnTypeInfo === 'void' ?
                'empty return' : returnTypeInfo,
            line: returnNode.loc.start.line,
            loc: returnNode.loc
        });
        this.meta.addError(err);
        return;
    }

    // console.log('?', this.meta.serializeType(returnType));
    assert(returnType.type === 'typeLiteral' && (
        returnType.name === 'void' ||
        returnType.name === '%Void%%UnknownReturn'
    ), 'expected Constructor to have no return void');
};

ASTVerifier.prototype._tryResolveVirtualType =
function _tryResolveVirtualType(type) {
    var newType = null;

    if (type.type === 'genericLiteral' &&
        type.value.type === 'typeLiteral' &&
        type.value.name === 'Array' && type.value.builtin
    ) {
        newType = this.meta.getVirtualType('TArray').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'String' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TString').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'Number' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TNumber').defn;
    } else if (type.type === 'function') {
        newType = this.meta.getVirtualType('TFunction').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'Date' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TDate').defn;
    } else if (type.type === 'typeLiteral' &&
        type.name === 'RegExp' && type.builtin
    ) {
        newType = this.meta.getVirtualType('TRegExp').defn;
    } else if (type.type === 'genericLiteral' &&
        type.value.type === 'typeLiteral' &&
        type.value.name === 'Object' && type.value.builtin
    ) {
        newType = this.meta.getVirtualType('TObject').defn;
    }

    return newType;
};

ASTVerifier.prototype._findPropertyInType =
function _findPropertyInType(node, jsigType, propertyName) {
    if (jsigType.type === 'function' &&
        propertyName === 'prototype'
    ) {
        return jsigType.thisArg.value;
    }

    var isDictionaryType = jsigType.type === 'genericLiteral' &&
        jsigType.value.type === 'typeLiteral' &&
        jsigType.value.builtin &&
        jsigType.value.name === 'Object';

    var possibleType = this._tryResolveVirtualType(jsigType);
    if (possibleType) {
        jsigType = possibleType;
    }

    var isExportsObject = false;
    if (jsigType.type === 'typeLiteral' &&
        jsigType.builtin && jsigType.name === '%Export%%ExportsObject'
    ) {
        isExportsObject = true;
        var newType = this.meta.getModuleExportsType();
        if (newType) {
            jsigType = newType;
        }
    }

    return this._findPropertyInSet(
        node, jsigType, propertyName, isExportsObject, isDictionaryType
    );
};

ASTVerifier.prototype._findPropertyInSet =
function _findPropertyInSet(
    node, jsigType, propertyName, isExportsObject, isDictionaryType
) {
    if (jsigType.type === 'unionType') {
        /*  Access the field on all types. Then build a union of
            them if the access succeeds.
        */

        var fieldUnion = [];

        for (var i = 0; i < jsigType.unions.length; i++) {
            var fieldType = this._findPropertyInType(
                node, jsigType.unions[i], propertyName,
                isExportsObject, isDictionaryType
            );
            if (!fieldType) {
                return null;
            }

            fieldUnion.push(fieldType);
        }

        var union = computeSmallestUnion(
            node, JsigAST.union(fieldUnion)
        );

        return union;
    }

    if (jsigType.type === 'intersectionType' &&
        propertyName === 'prototype'
    ) {
        // Count functions
        var funcCount = 0;
        var funcType = null;
        var intersections = jsigType.intersections;
        for (i = 0; i < intersections.length; i++) {
            var possibleType = intersections[i];
            if (possibleType.type === 'function') {
                funcType = possibleType;
                funcCount++;
            }
        }

        assert(funcCount <= 1, 'cannot access prototype fields ' +
            'on overloaded constructors...');

        if (funcType.thisArg.value) {
            return funcType.thisArg.value;
        }
    }

    // TODO: Naive intersection support, find first object.
    if (jsigType.type === 'intersectionType') {
        intersections = jsigType.intersections;
        for (i = 0; i < intersections.length; i++) {
            possibleType = intersections[i];
            if (possibleType.type !== 'object') {
                continue;
            }

            for (var j = 0; j < possibleType.keyValues.length; j++) {
                var pair = possibleType.keyValues[j];
                if (pair.key === propertyName) {
                    return this._findPropertyInType(
                        node, possibleType, propertyName,
                        isExportsObject, isDictionaryType
                    );
                }
            }
        }
    }

    return this._findPropertyInObject(
        node, jsigType, propertyName, isExportsObject, isDictionaryType
    );
};

ASTVerifier.prototype._isAssigningMethodOnExportsPrototype =
function _isAssigningMethodOnExportsPrototype(node) {
    // If we are assigning a method to the exported class
    if (this.meta.currentScope.type === 'file' &&
        node.object.type === 'MemberExpression' &&
        node.object.property.name === 'prototype' &&
        node.object.object.type === 'Identifier'
    ) {

        var expected = this.meta.currentScope.getExportedIdentifier();
        var actual = node.object.object.name;

        if (expected === actual) {
            return true;
        }
    }

    return false;
};

ASTVerifier.prototype._findPropertyInObject =
function _findPropertyInObject(
    node, jsigType, propertyName, isExportsObject, isDictionaryType
) {
    if (jsigType.type !== 'object') {
        if (this.meta.checkerRules.partialExport &&
            this._isAssigningMethodOnExportsPrototype(node)
        ) {
            return JsigAST.literal('%Mixed%%UnknownExportsField', true);
        }

        // Handle tuple -> array mis-inference
        if (jsigType.type === 'tuple' && jsigType.inferred &&
            node.object.type === 'Identifier'
        ) {
            var identifierName = node.object.name;
            var token = this.meta.currentScope.getVar(identifierName);

            var self = this;
            var newType = this._maybeConvertToArray(
                token, identifierName, jsigType,
                function verify(possibleArray) {
                    return self._findPropertyInType(
                        node, possibleArray, propertyName
                    );
                }
            );

            if (newType) {
                return this._findPropertyInType(
                    node, newType, propertyName
                );
            }
        }

        this.meta.addError(Errors.NonObjectFieldAccess({
            loc: node.loc,
            line: node.loc.start.line,
            actual: serialize(jsigType),
            expected: '{ ' + propertyName + ': T }',
            fieldName: propertyName,
            nonObjectType: serialize(jsigType)
        }));
        return null;
    }

    for (var i = 0; i < jsigType.keyValues.length; i++) {
        var keyValue = jsigType.keyValues[i];
        if (keyValue.key === propertyName) {
            // TODO: handle optional fields
            return keyValue.value;
        }
    }

    // If open and mutation then allow mixed type.
    if (jsigType.open && this.meta.currentScope.writableTokenLookup) {
        return JsigAST.literal('%Mixed%%OpenField', true);
    } else if (jsigType.open) {
        // If open and accessing outside of assignment
        // Then accessing any unknown field returns undefined

        return JsigAST.value('undefined');
    }

    if (isExportsObject && this.meta.checkerRules.partialExport) {
        return JsigAST.literal('%Mixed%%UnknownExportsField', true);
    }

    if (this.meta.checkerRules.partialExport &&
        this._isAssigningMethodOnExportsPrototype(node)
    ) {
        return JsigAST.literal('%Mixed%%UnknownExportsField', true);
    }

    // Fallback to property lookup...
    if (isDictionaryType) {
        var objType = this.meta.verifyNode(node.object, null);
        var propType = JsigAST.literal('String', true);
        return this._findTypeInContainer(node, objType, propType);
    }

    var err = this._createNonExistantFieldError(node, jsigType, propertyName);
    this.meta.addError(err);
    return null;
};

ASTVerifier.prototype._maybeConvertToArray =
function _maybeConvertToArray(token, identifierName, oldType, verify) {
    // TODO: check that there is IdentifierToken
    // for this `jsigType` and that is inferred=true

    // Only safe to convert to array
    // If there are no aliases
    // Track aliases on the scope.IdentifierToken
    // Increment alias count when
    //  - VarStatement with init is reference
    //  - Assignment where right hand side is reference

    // Then we want to try() to convert to array
    // and see if the property lookup succeeds
    // if so change, forceUpdateVar() and set the
    // inferred flag on the IdentifierToken to false
    if (!token || !token.inferred || token.aliasCount > 0) {
        return null;
    }

    var invalidArray = false;
    var arrayItemType = oldType.values[0];
    for (var i = 1; i < oldType.values.length; i++) {
        var t = oldType.values[i];
        if (!isSameType(t, arrayItemType)) {
            invalidArray = true;
            break;
        }
    }

    if (invalidArray) {
        return null;
    }

    var possibleArray = JsigAST.generic(
        JsigAST.literal('Array'), [arrayItemType]
    );

    var prevErrors = this.meta.getErrors();
    var beforeErrors = this.meta.countErrors();

    var lookupType = verify(possibleArray);

    var afterErrors = this.meta.countErrors();

    // Could not resolve MemberExpression with array.
    if (!lookupType || (beforeErrors !== afterErrors)) {
        this.meta.setErrors(prevErrors);
        return null;
    }

    // Convert tuple identifier -> array identifier
    this.meta.currentScope.forceUpdateVar(identifierName, possibleArray);

    // console.log('possibly misinferred tuple', {
    //     jsigType: this.meta.serializeType(oldType),
    //     token: token,
    //     node: node,
    //     possibleArray: this.meta.serializeType(possibleArray)
    // });

    return possibleArray;
};

ASTVerifier.prototype._findTypeInContainer =
function _findTypeInContainer(node, objType, propType) {
    // Do union logic
    if (objType.type === 'unionType') {
        var unionTypes = [];
        for (var i = 0; i < objType.unions.length; i++) {
            var valueType = this._findTypeInSingleContainer(
                node, objType.unions[i], propType
            );

            if (!valueType) {
                return null;
            }

            unionTypes.push(valueType);
        }

        var union = computeSmallestUnion(
            node, JsigAST.union(unionTypes)
        );

        // console.log('_findTypeInContainer()', {
        //     unionTypes: unionTypes.map(this.meta.serializeType),
        //     union: this.meta.serializeType(union)
        // });

        return union;
    }

    return this._findTypeInSingleContainer(node, objType, propType);
};

ASTVerifier.prototype._findTypeInSingleContainer =
function _findTypeInSingleContainer(node, objType, propType) {
    var valueType;

    if (objType.type === 'tuple') {
        return this._findTypeInTuple(node, objType, propType);
    }

    if (objType.type !== 'genericLiteral') {
        this.meta.addError(Errors.NonGenericPropertyLookup({
            expected: 'Array<T> | Object<K, V>',
            actual: this.meta.serializeType(objType),
            propType: this.meta.serializeType(propType),
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    if (objType.value.name === 'Array') {
        this.meta.checkSubType(node, ARRAY_KEY_TYPE, propType);

        valueType = objType.generics[0];
    } else if (objType.value.name === 'Object') {
        this.meta.checkSubType(node, objType.generics[0], propType);

        valueType = objType.generics[1];
    } else {
        assert(false, 'Cannot look inside non Array/Object container');
    }

    assert(valueType, 'expected valueType to exist');
    return valueType;
};

ASTVerifier.prototype._findTypeInTuple =
function _findTypeInTuple(node, objType, propType) {
    if (node.property.type === 'Literal' &&
        propType.type === 'typeLiteral' &&
        propType.name === 'Number' &&
        propType.concreteValue !== null
    ) {
        var propIndex = propType.concreteValue;
        if (objType.values[propIndex]) {
            return objType.values[propIndex];
        }

        this.meta.addError(Errors.OutOfBoundsTupleAccess({
            actual: this.meta.serializeType(objType),
            index: propIndex,
            actualLength: objType.values.length,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    } else if (
        node.property.type === 'UnaryExpression' &&
        node.property.operator === '-' &&
        node.property.argument.type === 'Literal' &&
        propType.type === 'typeLiteral' &&
        propType.name === 'Number' &&
        propType.concreteValue !== null
    ) {
        this.meta.addError(Errors.OutOfBoundsTupleAccess({
            actual: this.meta.serializeType(objType),
            index: propType.concreteValue,
            actualLength: objType.values.length,
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    } else if (
        propType.type === 'typeLiteral' &&
        propType.name === 'Number'
    ) {
        this.meta.addError(Errors.DynamicTupleAccess({
            actual: this.meta.serializeType(objType),
            identifier: this.meta.serializeAST(node.property),
            loc: node.loc,
            line: node.loc.start.line
        }));
        return null;
    }

    this.meta.addError(Errors.NonNumericTupleAccess({
        actual: this.meta.serializeType(propType),
        expected: 'Number',
        tupleValue: this.meta.serializeType(objType),
        loc: node.loc,
        line: node.loc.start.line
    }));
    return null;
};

ASTVerifier.prototype._createNonExistantFieldError =
function _createNonExistantFieldError(node, jsigType, propName) {
    var objName;
    if (node.object.type === 'ThisExpression') {
        objName = 'this';
    } else if (node.object.type === 'Identifier') {
        objName = node.object.name;
    } else if (node.object.type === 'MemberExpression') {
        objName = this.meta.serializeAST(node.object);
    } else if (node.object.type === 'CallExpression') {
        objName = this.meta.serializeAST(node.object);
    } else {
        assert(false, 'unknown object type');
    }

    var actualType = jsigType;

    if (actualType.type === 'typeLiteral' &&
        actualType.builtin && actualType.name === '%Export%%ExportsObject'
    ) {
        actualType = this.meta.getModuleExportsType();
    }

    return Errors.NonExistantField({
        fieldName: propName,
        objName: objName,
        expected: '{ ' + propName + ': T }',
        actual: serialize(actualType),
        loc: node.loc,
        line: node.loc.start.line
    });
};

ASTVerifier.prototype._getTypeFromRequire =
function _getTypeFromRequire(node) {
    assert(node.callee.name === 'require', 'func name must be require');

    var arg = node.arguments[0];
    assert(arg.type === 'Literal' && typeof arg.value === 'string',
        'arg to require must be a string literal');

    var depPath = arg.value;

    // Handle pre-defined npm case
    var externDefn = this.checker.getDefinition(depPath);
    if (externDefn) {
        if (depPath === 'assert' &&
            externDefn.defn.type === 'function'
        ) {
            externDefn.defn.specialKind = 'assert';
        }

        return externDefn.defn;
    }

    // Resolve a local file name
    var fileName = this._resolvePath(node, depPath, this.folderName);
    if (!fileName) {
        if (this.meta.checkerRules.allowUnknownRequire) {
            return JsigAST.literal('%Mixed%%UnknownRequire', true);
        }

        // TODO: search for type defintions inside node_modules/*
        this.meta.addError(Errors.MissingDefinition({
            moduleName: depPath,
            line: node.loc.start.line,
            loc: node.loc
        }));
        return null;
    }

    // Handle local case
    var otherMeta = this.checker.getOrCreateMeta(fileName, {
        loose: false
    });
    if (!otherMeta) {
        return null;
    }

    if (!otherMeta.moduleExportsType) {
        return JsigAST.literal('void', true);
    }

    return otherMeta.moduleExportsType;
};

ASTVerifier.prototype._resolvePath =
function resolvePath(node, possiblePath, dirname) {
    if (possiblePath[0] === path.sep) {
        // is absolute path
        return possiblePath;
    } else if (possiblePath[0] === '.') {
        // is relative path
        return path.resolve(dirname, possiblePath);
    } else {
        return null;
    }
};

// hoisting function declarations to the bottom makes the tree
// order algorithm simpler
function splitFunctionDeclaration(nodes) {
    var result = {
        functions: [],
        statements: []
    };

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'FunctionDeclaration') {
            result.statements.push(nodes[i]);
        }
    }

    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'FunctionDeclaration') {
            result.functions.push(nodes[i]);
        }
    }

    return result;
}


},{"../ast/":10,"../serialize.js":67,"./errors.js":69,"./lib/clone-ast.js":72,"./lib/compute-smallest-union.js":73,"./lib/get-union-without-bool.js":75,"./lib/is-same-type.js":77,"./lib/update-object.js":82,"assert":24,"path":25}],69:[function(require,module,exports){
'use strict';

/* @jsig */

var TypedError = require('error/typed');

var Errors = {};

Errors.UnknownLiteralError = TypedError({
    type: 'jsig.header-file.unknown-literal',
    message: '@{line}: Could not resolve {literal}',
    literal: null,
    line: null,
    loc: null,
    source: null
});

Errors.CannotImportToken = TypedError({
    type: 'jsig.header-file.cannot-import-token',
    message: '@{line}: Cannot import {identifier} from {otherFile}.',
    identifier: null,
    line: null,
    loc: null,
    source: null,
    otherFile: null
});

Errors.CannotImport = TypedError({
    type: 'jsig.header-file.cannot-import',
    message: '@{line}: Cannot import from broken header: {otherFile}.',
    line: null,
    loc: null,
    source: null,
    otherFile: null
});

Errors.CannotParseHeaderFile = TypedError({
    type: 'jsig.parser.cannot-parse-header-file',
    message: '@{line}: {msg}.',
    line: null,
    loc: null,
    msg: null,
    source: null
});

Errors.CouldNotFindHeaderFile = TypedError({
    type: 'jsig.header-file.could-not-find-header-file',
    message: 'Cannot find other header file: {otherFile}.',
    otherFile: null,
    fileName: null
});

Errors.CouldNotFindFile = TypedError({
    type: 'jsig.checker.could-not-find-file',
    message: 'Cannot find javascript file: {fileName}.\n' +
        '{origMessage}',
    fileName: null
});

Errors.CouldNotParseJavaScript = TypedError({
    type: 'jsig.checker.could-not-parse-javascript',
    message: '@{line}: Error parsing javascript: {detail}.',
    fileName: null,
    line: null,
    detail: null,
    charOffset: null,
    source: null
});

Errors.MissingFieldInConstr = TypedError({
    type: 'jsig.verify.missing-field-in-constructor',
    message: '@{line}: Expected the field: {fieldName} to be defined ' +
        'in constructor {funcName} but instead found: {otherField}.',
    fieldName: null,
    otherField: null,
    funcName: null,
    loc: null,
    line: null
});

Errors.UnrecognisedOption = TypedError({
    type: 'jsig.meta.unrecognised-option',
    message: '@{line}: Unrecognised @jsig option: {key}',
    key: null,
    loc: null,
    line: null
});

Errors.InvalidIgnoreComment = TypedError({
    type: 'jsig.meta.invalid-ignore-comment',
    message: '@{line}: Invalid jsig ignore next comment. {reason}',
    reason: null,
    line: null,
    loc: null
});

Errors.UnknownIdentifier = TypedError({
    type: 'jsig.verify.unknown-identifier',
    message: '@{line}: Could not find identifier {tokenName}.',
    tokenName: null,
    loc: null,
    line: null
});

Errors.UnknownModuleExports = TypedError({
    type: 'jsig.verify.unknown-module-exports',
    message: '@{line}: Cannot export untyped function {funcName}.',
    funcName: null,
    loc: null,
    line: null
});

Errors.MissingExports = TypedError({
    type: 'jsig.verify.missing-exports',
    message: 'Expected module to export {expected} but ' +
        'found incomplete exports.',
    expected: null,
    actual: null
});

Errors.UnTypedIdentifier = TypedError({
    type: 'jsig.verify.untyped-identifier',
    message: '@{line}: Identifier {tokenName} does not have a type.',
    name: null,
    loc: null,
    line: null
});

Errors.TooManyArgsInFunc = TypedError({
    type: 'jsig.verify.too-many-function-args',
    message: '@{line}: Expected the function {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.TooFewArgsInFunc = TypedError({
    type: 'jsig.verify.too-few-function-args',
    message: '@{line}: Expected the function {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.TooManyArgsInNewExpression = TypedError({
    type: 'jsig.verify.too-many-args-in-new-expression',
    message: '@{line}: Expected the new call on constructor {funcName} to ' +
        'have exactly {expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.TooFewArgsInNewExpression = TypedError({
    type: 'jsig.verify.too-few-args-in-new-expression',
    message: '@{line}: Expected the new call on constructor {funcName} to ' +
        'have exactly {expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.TooManyArgsInCall = TypedError({
    type: 'jsig.verify.too-many-args-in-call',
    message: '@{line}: Expected invocation of {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.TooFewArgsInCall = TypedError({
    type: 'jsig.verify.too-few-args-in-call',
    message: '@{line}: Expected invocation of {funcName} to have exactly ' +
        '{expectedArgs} arguments but instead has {actualArgs}.',
    funcName: null,
    actualArgs: null,
    expectedArgs: null,
    loc: null,
    line: null
});

Errors.NonExistantField = TypedError({
    type: 'jsig.verify.non-existant-field',
    message: '@{line}: Object {objName} does not have field {fieldName}.',
    fieldName: null,
    objName: null,
    loc: null,
    line: null
});

Errors.NonVoidReturnType = TypedError({
    type: 'jsig.verify.non-void-return-type',
    message: '@{line}: Expected function {funcName} to return ' +
        'void but found: {actual}.',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

Errors.MissingReturnStatement = TypedError({
    type: 'jsig.verify.missing-return-statement',
    message: '@{line}: Expected function {funcName} to return ' +
        '{expected} but found no return statement.',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

Errors.UnexpectedFunction = TypedError({
    type: 'jsig.verify.found-unexpected-function',
    message: '@{line}: Expected {funcName} to not be a function. ' +
        'Expected {expected} but found {actual}.',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

Errors.UnTypedFunctionFound = TypedError({
    type: 'jsig.verify.untyped-function-found',
    message: '@{line}: Expected the function {funcName} to have ' +
        'type but could not find one.',
    funcName: null,
    loc: null,
    line: null
});

Errors.UnTypedFunctionExpressionFound = TypedError({
    type: 'jsig.verify.untyped-function-expr-found',
    message: '@{line}: Expected the function expression {funcName} to have ' +
        'type but could not find one.',
    funcName: null,
    loc: null,
    line: null
});

Errors.UnTypedFunctionCall = TypedError({
    type: 'jsig.verify.untyped-function-call',
    message: '@{line}: Expected to know type of function: {funcName}. ' +
        'Instead found callsite of untyped function: {callExpression}.',
    funcName: null,
    callExpression: null,
    loc: null,
    line: null
});

Errors.CallingNewOnPlainFunction = TypedError({
    type: 'jsig.verify.calling-new-on-plain-function',
    message: '@{line}: Cannot call `new` on plain function {funcName}. ' +
        'The function type {funcType} is not a constructor.',
    funcName: null,
    funcType: null,
    loc: null,
    line: null
});

Errors.CallingNewOnNonFunction = TypedError({
    type: 'jsig.verify.calling-new-on-non-function',
    message: '@{line}: Cannot invoke `new` on non-function {funcName}. ' +
        'The new expr {newExpression} does not work for type: {objType}',
    newExpression: null,
    funcName: null,
    objType: null,
    loc: null,
    line: null
});

Errors.CallingNonFunctionObject = TypedError({
    type: 'jsig.verify.calling-non-function-object',
    message: '@{line}: Cannot call non-function object. ' +
        'The call expr {callExpression} does not work for type: {objType}.',
    objType: null,
    callExpression: null,
    loc: null,
    line: null
});

Errors.ConstructorMustBePascalCase = TypedError({
    type: 'jsig.verify.constructor-must-be-pascal-case',
    message: '@{line}: Constructor function {funcName} must be pascal case. ' +
        'Cannot call `new` on function type {funcType}.',
    funcName: null,
    funcType: null,
    loc: null,
    line: null
});

Errors.ConstructorThisTypeMustBeObject = TypedError({
    type: 'jsig.verify.constructor-this-type-must-be-object',
    message: '@{line}: Constructor {funcName} must have non-empty thisType. ' +
        'Cannot have non-object or empty object this ({thisType}).',
    funcName: null,
    thisType: null,
    loc: null,
    line: null
});

Errors.ConstructorMustReturnVoid = TypedError({
    type: 'jsig.verify.constructor-must-return-void',
    message: '@{line}: Constructor {funcName} must return void. ' +
        'Cannot return type: {returnType}.',
    funcName: null,
    returnType: null,
    loc: null,
    line: null
});

Errors.ReturnStatementInConstructor = TypedError({
    type: 'jsig.verify.return-statement-in-constructor',
    message: '@{line}: Constructor {funcName} has unexpected ' +
        'return statement. ' +
        'Expected no return but found type: {returnType}.',
    funcName: null,
    returnType: null,
    loc: null,
    line: null
});

Errors.UnionFieldAccess = TypedError({
    type: 'jsig.verify.accessing-field-on-union',
    message: '@{line}: Cannot read field {fieldName} of union. ' +
        'Expected an object type but found {unionType}.',
    fieldName: null,
    unionType: null,
    loc: null,
    line: null
});

Errors.NonObjectFieldAccess = TypedError({
    type: 'jsig.verify.accessing-field-on-non-object',
    message: '@{line}: Cannot read field {fieldName} of non-object. ' +
        'Expected an object type but found {nonObjectType}.',
    fieldName: null,
    nonObjectType: null,
    loc: null,
    line: null
});

Errors.NonExistantThis = TypedError({
    type: 'jsig.verify.non-existant-this',
    message: '@{line}: Cannot access `this` inside function {funcName}. ' +
        'Function type: {funcType} does not have thisType.',
    funcName: null,
    funcType: null,
    loc: null,
    line: null
});

Errors.MissingDefinition = TypedError({
    type: 'jsig.verify.missing-definition',
    message: '@{line}: Cannot find external definition for ' +
        'module: {moduleName}.',
    moduleName: null,
    loc: null,
    line: null
});

Errors.TypeClassMismatch = TypedError({
    type: 'jsig.sub-type.type-class-mismatch',
    message: '@{line}: Got unexpected type class. ' +
        'Expected {expected} but got {actual}',
    expected: null,
    actual: null,
    loc: null,
    line: null
});

Errors.UnionTypeClassMismatch = TypedError({
    type: 'jsig.sub-type.union-type-class-mismatch',
    message: '@{line}: Got unexpected type for union. ' +
        'Expected {expected} but got {actual}',
    expected: null,
    actual: null,
    loc: null,
    line: null
});

Errors.IntersectionOperatorCallMismatch = TypedError({
    type: 'jsig.sub-type.intersection-operator-call-mismatch',
    message: '@{line}: Cannot call any of operators: {operator} types.',
    expected: null,
    actual: null,
    operator: null,
    loc: null,
    line: null
});

Errors.FunctionOverloadCallMisMatch = TypedError({
    type: 'jsig.verify.function-overload-call-mismatch',
    message: '@{line}: Cannot call any overload of function: {funcName}',
    expected: null,
    actual: null,
    funcName: null,
    loc: null,
    line: null
});

Errors.IncorrectFieldCount = TypedError({
    type: 'jsig.sub-type.unexpected-field-count',
    message: '@{line}: Got unexpected number of fields. ' +
        'Expected {expectedFields} fields but found {actualFields} fields.',
    actual: null,
    expected: null,
    actualFields: null,
    expectedFields: null,
    loc: null,
    line: null
});

Errors.UnexpectedExtraField = TypedError({
    type: 'jsig.sub-type.unexpected-extra-field',
    message: '@{line}: Got unexpected extra field {fieldName}.',
    actual: null,
    expected: null,
    fieldName: null,
    loc: null,
    line: null
});

Errors.NonGenericPropertyLookup = TypedError({
    type: 'jsig.verify.non-generic-property-lookup',
    message: '@{line}: Cannot lookup field in non-generic value. ' +
        'Expected {expected} type but got {actual} type.',
    actual: null,
    expected: null,
    loc: null,
    line: null
});

Errors.InvalidThrowStatement = TypedError({
    type: 'jsig.verify.invalid-throw-statement',
    message: '@{line}: A throw statement must throw an actual error. ' +
        'Expected {expected} tyoe but got {actual} type.',
    actual: null,
    expected: null,
    loc: null,
    line: null
});

Errors.MissingExpectedField = TypedError({
    type: 'jsig.sub-type.missing-expected-field',
    message: '@{line}: Expected object to have field {expectedName}.',
    expectedName: null,
    expected: null,
    actual: null,
    loc: null,
    line: null
});

Errors.OutOfBoundsTupleAccess = TypedError({
    type: 'jsig.verify.out-of-bounds-tuple-access',
    message: '@{line}: Cannot access out of bounds ' +
        'index [{index}] of tuple.\n' +
        'Tuple {actual} only has {actualLength} fields.',
    actual: null,
    index: null,
    actualLength: null,
    loc: null,
    line: null
});

Errors.DynamicTupleAccess = TypedError({
    type: 'jsig.verify.dynamic-tuple-access',
    message: '@{line}: Cannot access tuple field using dynamic ' +
        'identifier.\n' +
        'Expected fixed numeric access for {actual} but found {identifier}',
    actual: null,
    identifier: null,
    loc: null,
    line: null
});

Errors.NonNumericTupleAccess = TypedError({
    type: 'jsig.verify.non-numeric-tuple-access',
    message: '@{line}: Cannot access non-numeric field on tuple.' +
        'Expected numeric access on tuple: {tupleValue}',
    actual: null,
    expected: null,
    tupleValue: null,
    loc: null,
    line: null
});

Errors.CannotCallGenericFunction = TypedError({
    type: 'jsig.verify.cannot-call-generic-function',
    message: '@{line}: Cannot call generic function {funcName}' +
        ' with arguments {actual}',
    funcName: null,
    actual: null,
    expected: null,
    loc: null,
    line: null
});

Errors.TypeofExpression = TypedError({
    type: 'jsig.verify.typeof-expression',
    message: '@{line}: typeof `{expr}` is: {valueType}.',
    valueType: null,
    expr: null,
    loc: null,
    line: null
});

module.exports = Errors;

},{"error/typed":34}],70:[function(require,module,exports){
'use strict';

var assert = require('assert');
var path = require('path');
var resolve = require('resolve');

var Errors = require('./errors.js');
var JsigASTReplacer = require('./lib/jsig-ast-replacer.js');
var JsigAST = require('../ast/');
var deepCloneJSIG = require('./lib/deep-clone-ast.js');

module.exports = HeaderFile;

function HeaderFile(checker, jsigAst, fileName, source) {
    this.checker = checker;
    this.source = source;
    this.fileName = fileName;
    this.folderName = path.dirname(fileName);
    this.rawJsigAst = jsigAst;
    this.resolvedJsigAst = null;

    this.indexTable = Object.create(null);
    this.genericIndexTable = Object.create(null);
    this.exportType = null;
    this.errors = [];
    this.dependentHeaders = Object.create(null);
    this.astReplacer = new JsigASTReplacer(this);
}

HeaderFile.prototype.replace = function replace(ast, rawAst) {
    if (ast.type === 'typeLiteral') {
        return this.replaceTypeLiteral(ast, rawAst);
    } else if (ast.type === 'import') {
        return this.replaceImport(ast, rawAst);
    } else if (ast.type === 'genericLiteral') {
        return this.replaceGenericLiteral(ast, rawAst);
    } else {
        assert(false, 'unexpected ast.type: ' + ast.type);
    }
};

HeaderFile.prototype.getToken =
function getToken(name) {
    return this.indexTable[name];
};

/*eslint dot-notation: 0*/
HeaderFile.prototype.replaceTypeLiteral =
function replaceTypeLiteral(ast, rawAst) {
    var name = ast.name;

    if (name === 'Error' && !this.indexTable['Error']) {
        this.checker.loadJavaScriptIntoIndexTable(this.indexTable);
    }

    var typeDefn = this.indexTable[name];
    if (!typeDefn) {
        this.errors.push(Errors.UnknownLiteralError({
            literal: name,
            loc: ast.loc,
            line: ast.line,
            source: this.source
        }));
        return null;
    }

    return typeDefn;
};

HeaderFile.prototype.replaceGenericLiteral =
function replaceGenericLiteral(ast, rawAst) {
    var name = ast.value.name;

    // var serialize = require('../serialize.js');

    // console.log('replaceGenericLiteral(' + name + ')', {
    //     ast: ast.generics.length,
    //     rawValue: serialize(ast)
    // });

    var typeDefn = this.genericIndexTable[name];
    if (!typeDefn) {
        this.errors.push(Errors.UnknownLiteralError({
            literal: name
        }));
        return null;
    }

    var args = ast.generics;
    var expectedArgs = typeDefn.generics;

    var idMapping = Object.create(null);
    for (var i = 0; i < expectedArgs.length; i++) {
        idMapping[expectedArgs[i].name] = args[i];
    }

    var copyType = deepCloneJSIG(typeDefn.typeExpression);
    copyType._raw = null;

    var locations = typeDefn.seenGenerics;
    for (i = 0; i < locations.length; i++) {

        var g = locations[i];
        var newType = idMapping[g.name];
        assert(newType, 'newType must exist');

        var stack = g.location.slice(1);
        // console.log('mutating?', stack);

        var obj = copyType;
        for (var j = 0; j < stack.length - 1; j++) {
            obj = obj[stack[j]];
            obj._raw = null;
        }

        var lastProp = stack[stack.length - 1];
        obj[lastProp] = newType;
    }

    // console.log('typeDefn?', {
    //     expr: serialize(typeDefn.typeExpression),
    //     copyType: serialize(copyType)
    // });

    return copyType;
};

HeaderFile.prototype._getHeaderFile =
function _getHeaderFile(importNode) {
    var depPath = importNode.dependency;
    var fileName = this._resolvePath(depPath, this.folderName);
    if (fileName === null) {
        // Could not resolve header
        this.errors.push(Errors.CouldNotFindHeaderFile({
            otherFile: depPath,
            loc: importNode.loc,
            line: importNode.line,
            source: this.source
        }));
        return null;
    }

    var otherHeader = this.checker.getOrCreateHeaderFile(
        fileName, importNode, this.source, this.fileName
    );
    if (otherHeader === null) {
        return null;
    }

    this.dependentHeaders[otherHeader.fileName] = otherHeader;
    return otherHeader;
};

// Find another HeaderFile instance for filePath
// Then reach into indexTable and grab tokens
// Copy tokens into local index table
HeaderFile.prototype.replaceImport =
function replaceImport(ast, rawAst) {
    if (ast.isMacro) {
        return this.replaceImportMacro(ast, rawAst);
    }

    var otherHeader = this._getHeaderFile(ast);
    if (!otherHeader || otherHeader.hasErrors()) {
        this.errors.push(Errors.CannotImport({
            otherFile: ast.dependency,
            loc: ast.loc,
            line: ast.line,
            source: this.source
        }));
        return null;
    }

    for (var i = 0; i < ast.types.length; i++) {
        var t = ast.types[i];
        assert(t.type === 'typeLiteral', 'expected typeLiteral');

        if (otherHeader.indexTable[t.name]) {
            this.addToken(t.name, otherHeader.indexTable[t.name]);
        } else if (otherHeader.genericIndexTable[t.name]) {
            this.addGenericToken(t.name, otherHeader.genericIndexTable[t.name]);
        } else {
            this.errors.push(Errors.CannotImportToken({
                identifier: t.name,
                otherFile: otherHeader.fileName,
                loc: t.loc,
                line: t.line,
                source: this.source
            }));
        }
    }

    return ast;
};

HeaderFile.prototype.replaceImportMacro =
function replaceImportMacro(ast, rawAst) {
    var filePath = resolve.sync(ast.dependency, {
        basedir: this.folderName
    });

    for (var i = 0; i < ast.types.length; i++) {
        var t = ast.types[i];
        assert(t.type === 'typeLiteral', 'expected typeLiteral');

        var macro = JsigAST.macroLiteral(t.name, filePath);
        this.addToken(t.name, macro);
    }

    return ast;
};

HeaderFile.prototype._resolvePath =
function resolvePath(possiblePath, dirname) {
    if (possiblePath[0] === path.sep) {
        // is absolute path
        return possiblePath;
    } else if (possiblePath[0] === '.') {
        // is relative path
        return path.resolve(dirname, possiblePath);
    } else {
        // TODO: improve handling to reach into sub modules
        assert(possiblePath.indexOf('/') === -1,
            'node_modules nested files lookup not implemented');

        return this.checker.getDefinitionFilePath(possiblePath);
    }
};

HeaderFile.prototype.addToken =
function addToken(token, defn) {
    assert(!this.indexTable[token], 'cannot double add token');
    this.indexTable[token] = defn;
};

HeaderFile.prototype.addGenericToken =
function addGenericToken(token, expr) {
    assert(!this.indexTable[token], 'cannout double add generic token');
    assert(!this.genericIndexTable[token], 'cannot double add generic token');
    this.genericIndexTable[token] = expr;
};

HeaderFile.prototype.addDefaultExport =
function addDefaultExport(defn) {
    assert(this.exportType === null, 'cannot have double export');
    this.exportType = defn;
};

HeaderFile.prototype.resolveReferences =
function resolveReferences() {
    if (this.resolvedJsigAst) {
        return;
    }

    var ast = this.rawJsigAst;
    var copyAst = deepCloneJSIG(ast);

    for (var i = 0; i < copyAst.statements.length; i++) {
        var line = copyAst.statements[i];

        if (line.type === 'typeDeclaration') {
            if (line.typeExpression.type === 'typeLiteral') {
                assert(line.typeExpression.builtin,
                    'cannot alias non-builtin types...');
            }

            if (line.generics.length > 0) {
                this.addGenericToken(line.identifier, line);
            } else {
                this.addToken(line.identifier, line.typeExpression);
            }
        }
    }

    copyAst = this.astReplacer.inlineReferences(copyAst, ast, []);

    // Hoist default export only after inlining it.
    for (i = 0; i < copyAst.statements.length; i++) {
        line = copyAst.statements[i];

        if (line.type === 'defaultExport') {
            this.addDefaultExport(line.typeExpression);
        }
    }

    this.resolvedJsigAst = copyAst;
};

HeaderFile.prototype.inlineReferences =
function inlineReferences(ast) {
    var copyAst = deepCloneJSIG(ast);

    return this.astReplacer.inlineReferences(copyAst, ast, []);
};

HeaderFile.prototype.getResolvedAssignments =
function getResolvedAssignments() {
    this.resolveReferences();

    if (!this.resolvedJsigAst) {
        return null;
    }

    var statements = [];
    for (var i = 0; i < this.resolvedJsigAst.statements.length; i++) {
        if (this.resolvedJsigAst.statements[i].type === 'assignment') {
            statements.push(this.resolvedJsigAst.statements[i]);
        }
    }

    return statements;
};

HeaderFile.prototype.hasErrors =
function hasErrors() {
    if (this.errors.length > 0) {
        return true;
    }

    var keys = Object.keys(this.dependentHeaders);
    for (var i = 0; i < keys.length; i++) {
        var otherHeader = this.dependentHeaders[keys[i]];

        if (otherHeader.errors.length > 0) {
            return true;
        }
    }

    return false;
};

HeaderFile.prototype.getExportType =
function getExportType() {
    this.resolveReferences();

    return this.exportType;
};

},{"../ast/":10,"./errors.js":69,"./lib/deep-clone-ast.js":74,"./lib/jsig-ast-replacer.js":78,"assert":24,"path":25,"resolve":37}],71:[function(require,module,exports){
(function (global,__dirname){
'use strict';

/* @jsig */

var esprima = require('esprima');

var path = require('path');
var assert = require('assert');
var resolve = require('resolve');
var process = global.process;

var Errors = require('./errors.js');
var HeaderFile = require('./header-file.js');
var parseJSigAST = require('./lib/read-jsig-ast.js').parseJSigAST;
var ProgramMeta = require('./meta.js');
var GlobalScope = require('./scope.js').GlobalScope;
var pretty = require('./lib/pretty-errors.js');
var serialize = require('../serialize.js');

var operatorsFile = path.join(
    __dirname, 'builtin-definitions', 'operators.hjs'
);
var es5File = path.join(
    __dirname, 'builtin-definitions', 'es5.hjs'
);
var isHeaderR = /\.hjs$/;
var BIN_HEADER = '#!/usr/bin/env';

TypeChecker.compile = function compile(fileName, options) {
    var checker = new TypeChecker(fileName, options);
    checker.checkProgram();
    return checker;
};

module.exports = TypeChecker;

function TypeChecker(entryFile, options) {
    options = options || {};

    var entryFiles = entryFile;
    if (typeof entryFiles === 'string') {
        entryFiles = [entryFiles];
    }

    if (!Array.isArray(entryFiles)) {
        assert(false, 'entryFile must be string or array');
    }

    this.entryFiles = entryFiles;
    this.files = options.files || Object.create(null);
    this.basedir = process ? process.cwd() : '/';

    this.globalScope = new GlobalScope();
    this.metas = Object.create(null);
    this.headerFiles = Object.create(null);

    this.definitions = Object.create(null);

    this.definitionsFolder = options.definitions || null;
    this.globalsFile = options.globalsFile || null;
    this.optin = options.optin || false;
    this.previousChecker = options.previousChecker || null;

    this.errors = [];
    this.traces = [];
    this.moduleExportsType = null;
    this.currentMeta = null;

    this.errorType = null;
}

TypeChecker.prototype.serializeType =
function serializeType(type, opts) {
    return serialize(type, opts);
};

TypeChecker.prototype.addError = function addError(err) {
    // console.trace('addError(' + err.type + ')');
    this.errors.push(err);
};

TypeChecker.prototype.addTrace = function addTrace(trace) {
    this.traces.push(trace);
};

TypeChecker.prototype.countErrors = function countErrors() {
    return this.errors.length;
};

TypeChecker.prototype.getErrors =
function getErrors() {
    return this.errors.slice();
};

TypeChecker.prototype.setErrors =
function setErrors(list) {
    this.errors = list;
};

TypeChecker.prototype.prettyPrintAllErrors =
function prettyPrintAllErrors() {
    return pretty.prettyPrintAllErrors(this);
};

TypeChecker.prototype.prettyPrintErrorStatement =
function prettyPrintErrorStatement(error) {
    return pretty.prettyPrintErrorStatement(this, error);
};

TypeChecker.prototype.prettyPrintAllErrorsWithTrace =
function prettyPrintAllErrors() {
    return pretty.prettyPrintAllErrorsWithTrace(this);
};

TypeChecker.prototype.prettyPrintTraces =
function prettyPrintTraces() {
    return pretty.prettyPrintTraces(this);
};

TypeChecker.prototype.checkProgram =
function checkProgram() {
    this.loadLanguageIdentifiers();
    this.preloadDefinitions();
    this.preloadGlobals();

    var meta;
    for (var i = 0; i < this.entryFiles.length; i++) {
        meta = this.getOrCreateMeta(this.entryFiles[i], {
            loose: true
        });
    }

    if (this.entryFiles.length === 1 && meta) {
        this.moduleExportsType = meta.moduleExportsType;
    }
};

TypeChecker.prototype.loadLanguageIdentifiers =
function loadLanguageIdentifiers() {
    if (this.previousChecker) {
        this.errorType = this.previousChecker.errorType;
        this.globalScope = this.previousChecker.globalScope;
        return;
    }

    var opHeaderFile = this.getOrCreateHeaderFile(operatorsFile);
    assert(this.errors.length === 0, 'must be no errors');
    assert(opHeaderFile, 'must be able to load operators');

    var assignments = opHeaderFile.getResolvedAssignments();
    var a;
    for (var i = 0; i < assignments.length; i++) {
        a = assignments[i];
        this.globalScope._addOperator(a.identifier, a.typeExpression);
    }

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File);
    assert(this.errors.length === 0, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    assignments = es5HeaderFile.getResolvedAssignments();

    for (i = 0; i < assignments.length; i++) {
        a = assignments[i];

        if (a.identifier === 'Error') {
            // Must know that in ES5 the new Error() constructor
            // brands the result as an Error instance.

            /*jsig ignore next: narrow type cannot narrow by string*/
            a.typeExpression.brand = 'Error';
        }

        /*jsig ignore next: tech debt... */
        if (a.identifier === 'Array') {
            var arrType = a.typeExpression;
            assert(arrType.type === 'intersectionType',
                'builtin Array is an intersection');

            var arrObj = arrType.intersections[0];
            assert(arrObj.type === 'object',
                'builtin Array is an object');

            var index = arrObj.buildObjectIndex();
            assert(index['isArray'] &&
                index['isArray'].type === 'function',
                'must implement isArray'
            );

            // Must know that isArray() function has the property
            // that it can narrow arrays
            index['isArray'].specialKind = 'isArray';
        }

        this.globalScope._addVar(a.identifier, a.typeExpression);
    }

    var errType = es5HeaderFile.getToken('Error');
    /*jsig ignore next: need to implement narrow by assert()*/
    errType.brand = 'Error';
    this.errorType = errType;

    this.globalScope._addVirtualType(
        'TString', es5HeaderFile.getToken('TString')
    );
    this.globalScope._addVirtualType(
        'TNumber', es5HeaderFile.getToken('TNumber')
    );
    this.globalScope._addVirtualType(
        'TArray', es5HeaderFile.getToken('TArray')
    );
    this.globalScope._addVirtualType(
        'TObject', es5HeaderFile.getToken('TObject')
    );
    this.globalScope._addVirtualType(
        'TDate', es5HeaderFile.getToken('TDate')
    );
    this.globalScope._addVirtualType(
        'TFunction', es5HeaderFile.getToken('TFunction')
    );
    this.globalScope._addVirtualType(
        'TRegExp', es5HeaderFile.getToken('TRegExp')
    );
};

TypeChecker.prototype.loadJavaScriptIntoIndexTable =
function loadJavaScriptIntoIndexTable(indexTable) {
    var before = this.errors.length;

    var es5HeaderFile = this.getOrCreateHeaderFile(es5File);
    assert(this.errors.length === before, 'must be no errors');
    assert(es5HeaderFile, 'must be able to load es5');

    es5HeaderFile.resolveReferences();
    indexTable['Error'] = es5HeaderFile.indexTable['Error'];
};

TypeChecker.prototype.tryReadHeaderFile =
function tryReadHeaderFile(primaryFileName) {
    if (!this.files[primaryFileName]) {
        primaryFileName = path.resolve(primaryFileName);
    }

    var headerFile;
    if (this.headerFiles[primaryFileName]) {
        headerFile = this.headerFiles[primaryFileName];
        if (headerFile.hasErrors()) {
            return true;
        }

        return true;
    }

    var source = this.files[primaryFileName];
    // TODO: type checker does not complain about dead code.
    if (source || source === '') {
        return true;
    }

    if (fs.existsSync(primaryFileName)) {
        return true;
    }

    var secondaryFileName = getSecondaryFileName(primaryFileName);
    if (fs.existsSync(secondaryFileName)) {
        return true;
    }

    return false;
};

/*
    For each js + hjs file it can exist in two locations

    /foo/bar/x.js
    /foo/bar/x.hjs

    or

    /foo/bar/x.js
    /foo/bar/_types/x.hjs
*/
function getSecondaryFileName(primaryFileName) {
    var segments = primaryFileName.split(path.sep);
    var basename = segments[segments.length - 1];
    segments[segments.length - 1] = '_types';
    segments[segments.length] = basename;

    var secondaryFileName = segments.join(path.sep);
    return secondaryFileName;
}

TypeChecker.prototype._readAndParseHeaderFile =
function _readAndParseHeaderFile(source, fileName) {
    var res = parseJSigAST(source);
    if (res.error) {
        /*jsig ignore next: Support narrowing member expr? */
        res.error.fileName = fileName;
        this.addError(res.error);
        return null;
    }

    if (!res.value) {
        return null;
    }

    return res.value;
};

/* getOrCreateHeaderFile by headerFileName */
TypeChecker.prototype.getOrCreateHeaderFile =
function getOrCreateHeaderFile(
    primaryFileName, node, importSourceText, importFileName
) {
    if (!this.files[primaryFileName]) {
        primaryFileName = path.resolve(primaryFileName);
    }

    var headerFile;
    if (this.headerFiles[primaryFileName]) {
        headerFile = this.headerFiles[primaryFileName];
        if (headerFile.hasErrors()) {
            return null;
        }

        return headerFile;
    }

    var source = this.files[primaryFileName];
    if (typeof source !== 'string') {
        if (!fs.existsSync(primaryFileName)) {
            var secondaryFileName = getSecondaryFileName(primaryFileName);

            if (fs.existsSync(secondaryFileName)) {
                primaryFileName = secondaryFileName;
            } else {
                this.addError(Errors.CouldNotFindHeaderFile({
                    fileName: importFileName || 'unknown',
                    otherFile: primaryFileName,
                    loc: node ? node.loc : null,
                    line: node ? node.loc.start.line : null,
                    source: importSourceText ? importSourceText : null
                }));
                return null;
            }
        }

        source = fs.readFileSync(primaryFileName, 'utf8');
    }

    return this._createHeaderFile(source, primaryFileName);
};

TypeChecker.prototype._createHeaderFile =
function _createHeaderFile(source, fileName) {
    var jsigAST = this._readAndParseHeaderFile(source, fileName);
    if (!jsigAST) {
        return null;
    }

    var headerFile = new HeaderFile(this, jsigAST, fileName, source);
    this.headerFiles[fileName] = headerFile;

    headerFile.resolveReferences();

    if (headerFile.hasErrors()) {
        for (var i = 0; i < headerFile.errors.length; i++) {
            headerFile.errors[i].fileName = fileName;
            this.addError(headerFile.errors[i]);
        }
        return null;
    }

    return headerFile;
};

function tryResolveSync(fileName, basedir) {
    var tuple = null;

    /*eslint-disable no-restricted-syntax*/
    try {
        tuple = [null, resolve.sync(fileName, {
            basedir: basedir
        })];
    } catch (err) {
        tuple = [err, null];
    }
    /*eslint-enable no-restricted-syntax*/

    return tuple;
}

/*jsig ignore next: cannot return err with extra fields*/
function tryEsprimaParse(source) {
    var tuple = null;

    /*eslint-disable no-restricted-syntax*/
    try {
        tuple = [null, esprima.parse(source, {
            loc: true,
            attachComment: true,
            comment: true
        })];
    } catch (err) {
        tuple = [err, null];
    }
    /*eslint-enable no-restricted-syntax*/

    return tuple;
}

TypeChecker.prototype.getOrCreateMeta =
function getOrCreateMeta(fileName, opts) {
    if (!this.files[fileName]) {
        var tuple = tryResolveSync(fileName, this.basedir);
        if (tuple[0]) {
            this.addError(Errors.CouldNotFindFile({
                fileName: fileName,
                origMessage: tuple[0].message
            }));
            return null;
        }

        fileName = tuple[1];
    }

    if (this.metas[fileName]) {
        return this.metas[fileName];
    }

    var source = this.files[fileName];
    if (typeof source !== 'string') {
        source = fs.readFileSync(fileName, 'utf8');
    }

    // Hack: to support JSON
    if (path.extname(fileName) === '.json') {
        source = 'module.exports = ' + source;
    }

    // Munge source text if it has unix executable header
    if (source.indexOf(BIN_HEADER) === 0) {
        var firstNewline = source.indexOf('\n');
        source = source.slice(firstNewline);
    }

    // In loose mode we do not care about meta.moduleExportsNode
    if (opts.loose && this.optin) {
        var jsigCommentIndex = source.indexOf('@jsig');
        if (jsigCommentIndex === -1) {
            return null;
        }
    }

    var parserTuple = tryEsprimaParse(source);
    if (parserTuple[0]) {
        var parseError = parserTuple[0];
        this.addError(Errors.CouldNotParseJavaScript({
            fileName: fileName,
            // Should be 1 index.
            line: parseError.lineNumber,
            detail: parseError.description,
            charOffset: parseError.index,
            source: source
        }));
        return null;
    }

    var ast = parserTuple[1];

    var meta = new ProgramMeta(this, ast, fileName, source);
    this.metas[fileName] = meta;

    var previousMeta = this.currentMeta;
    this.currentMeta = meta;
    meta.verify();
    this.currentMeta = previousMeta;

    return meta;
};

TypeChecker.prototype.getDefinition =
function getDefinition(id) {
    return this.definitions[id];
};

TypeChecker.prototype._addDefinition =
function _addDefinition(id, typeDefn) {
    var token = {
        type: 'external-definition',
        defn: typeDefn
    };
    this.definitions[id] = token;
    return token;
};

TypeChecker.prototype.getDefinitionFilePath =
function getDefinitionFilePath(packageName) {
    if (!this.definitionsFolder) {
        return null;
    }

    return path.join(
        this.definitionsFolder, packageName + '.hjs'
    );
};

TypeChecker.prototype.preloadDefinitions =
function preloadDefinitions() {
    var i = 0;
    if (this.previousChecker) {
        var defns = this.previousChecker.definitions;
        var keys = Object.keys(defns);

        for (i = 0; i < keys.length; i++) {
            this._addDefinition(keys[i], defns[keys[i]].defn);
        }

        return;
    }

    if (!this.definitionsFolder) {
        return;
    }

    var files = fs.readdirSync(this.definitionsFolder);
    for (i = 0; i < files.length; i++) {
        var fileName = path.join(this.definitionsFolder, files[i]);
        if (!isHeaderR.test(fileName)) {
            continue;
        }

        var headerFile = this.getOrCreateHeaderFile(fileName);
        if (!headerFile) {
            continue;
        }

        var assignments = headerFile.getResolvedAssignments();
        for (var j = 0; j < assignments.length; j++) {
            var a = assignments[j];
            this._addDefinition(a.identifier, a.typeExpression);
        }
    }
};

TypeChecker.prototype.preloadGlobals =
function preloadGlobals() {
    if (this.previousChecker) {
        return;
    }

    if (!this.globalsFile) {
        return;
    }

    var headerFile = this.getOrCreateHeaderFile(this.globalsFile);
    if (!headerFile) {
        return;
    }

    var assignments = headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        this.globalScope._addVar(a.identifier, a.typeExpression);
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/type-checker")
},{"../serialize.js":67,"./errors.js":69,"./header-file.js":70,"./lib/pretty-errors.js":80,"./lib/read-jsig-ast.js":81,"./meta.js":83,"./scope.js":85,"assert":24,"esprima":35,"path":25,"resolve":37}],72:[function(require,module,exports){
'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');

module.exports = clone;

function clone(typeDefn) {
    if (typeDefn.type === 'object') {
        return JsigAST.object(typeDefn.keyValues, null, {
            brand: typeDefn.brand,
            open: typeDefn.open
        });
    } else if (typeDefn.type === 'typeLiteral') {
        return JsigAST.literal(typeDefn.name, typeDefn.builtin);
    } else if (typeDefn.type === 'unionType') {
        return JsigAST.union(typeDefn.unions);
    } else if (typeDefn.type === 'intersectionType') {
        return JsigAST.intersection(typeDefn.intersections);
    } else if (typeDefn.type === 'function') {
        return JsigAST.functionType({
            args: typeDefn.args,
            result: typeDefn.result,
            thisArg: typeDefn.thisArg,
            brand: typeDefn.brand,
            generics: typeDefn.generics
        });
    } else if (typeDefn.type === 'genericLiteral') {
        return JsigAST.generic(
            typeDefn.value,
            typeDefn.generics
        );
    } else {
        assert(false, 'not implemented clone: ' + typeDefn.type);
    }
}

},{"../../ast/":10,"assert":24}],73:[function(require,module,exports){
'use strict';

var isSameType = require('./is-same-type.js');
var JsigAST = require('../../ast/');

module.exports = computeSmallestUnion;

function computeSmallestUnion(node, t1, t2) {
    var parts = [];
    addPossibleType(parts, t1);
    addPossibleType(parts, t2);

    if (parts.length === 0) {
        return null;
    }

    if (parts.length === 1) {
        return parts[0];
    }

    var minimal = _computeSmallestCommonTypes(node, parts);

    // Again, find smallest common type in reverse ??
    // var reverseMinimal = parts.slice();
    // reverseMinimal.reverse();
    // reverseMinimal = this._computeSmallestCommonTypes(node, reverseMinimal);

    // // Only use reverse minimal if smaller.
    // if (reverseMinimal.length < minimal.length) {
    //     minimal = reverseMinimal;
    // }

    if (minimal.length === 1) {
        return minimal[0];
    }

    return JsigAST.union(minimal);
}

function _computeSmallestCommonTypes(node, list) {
    var minimal = [];

    for (var i = 0; i < list.length; i++) {
        var sample = list[i];
        var toAdd = sample;

        for (var j = 0; j < minimal.length; j++) {
            var possible = minimal[j];

            if (isSameType(sample, possible)) {
                toAdd = null;
                break;
            }

            /* if a super type of the other then remove from union */
            // TODO: this seems so naive...
            // var isSuper = this.meta.isSubType(node, possible, sample);
            // if (isSuper) {
            //     toAdd = null;
            //     break;
            // }
        }

        if (toAdd) {
            minimal.push(toAdd);
        }
    }

    return minimal;
}

function addPossibleType(list, maybeType) {
    if (!maybeType) {
        return;
    }

    if (maybeType.type !== 'unionType') {
        list.push(maybeType);
        return;
    }

    for (var i = 0; i < maybeType.unions.length; i++) {
        addPossibleType(list, maybeType.unions[i]);
    }
}

},{"../../ast/":10,"./is-same-type.js":77}],74:[function(require,module,exports){
'use strict';

var copy = require('universal-copy');

module.exports = deepClone;

function deepClone(ast) {
    return copy(ast);
}

},{"universal-copy":47}],75:[function(require,module,exports){
'use strict';

var JsigAST = require('../../ast/');

module.exports = getUnionWithoutBool;

function getUnionWithoutBool(type, truthy) {
    if (type.type !== 'unionType') {
        if (truthy && isBoolean(type)) {
            return JsigAST.value('true', 'boolean');
        } else if (!truthy && isBoolean(type)) {
            return JsigAST.value('false', 'boolean');
        } else if (truthy && !isAlwaysFalsey(type)) {
            return type;
        } else if (!truthy && !isAlwaysTruthy(type)) {
            return type;
        }

        return JsigAST.literal('Never', true);
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (
            (truthy && !isAlwaysFalsey(t)) ||
            (!truthy && !isAlwaysTruthy(t))
        ) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function isBoolean(t) {
    return t.type === 'typeLiteral' &&
        t.name === 'Boolean' && t.builtin;
}

// handle more literals like 0 or "" or false
function isAlwaysTruthy(t) {
    return !(
        (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'valueLiteral' &&
            t.name === 'boolean' && t.value === 'false'
        ) ||
        (t.type === 'typeLiteral' && t.name === 'String') ||
        (t.type === 'typeLiteral' && t.name === 'Boolean') ||
        (t.type === 'typeLiteral' && t.name === 'Number')
    );
}

function isAlwaysFalsey(t) {
    return (t.type === 'valueLiteral' && t.name === 'undefined') ||
        (t.type === 'valueLiteral' && t.name === 'null') ||
        (t.type === 'typeLiteral' && t.builtin &&
            t.name === 'Never'
        ) ||
        (t.type === 'typeLiteral' && t.builtin &&
            t.name === '%Void%%Uninitialized'
        ) ||
        (t.type === 'valueLiteral' &&
            t.name === 'boolean' && t.value === 'false'
        );
}

},{"../../ast/":10}],76:[function(require,module,exports){
'use strict';

module.exports = isModuleExportsStatement;

function isModuleExportsStatement(node) {
    if (node.type !== 'ExpressionStatement') {
        return false;
    }

    var expression = node.expression;

    if (expression.type !== 'AssignmentExpression') {
        return false;
    }

    if (expression.operator !== '=') {
        return false;
    }

    var left = expression.left;

    if (left.type !== 'MemberExpression') {
        return false;
    }

    if ((left && !left.object) ||
        (left && left.object && left.object.name !== 'module')
    ) {
        return false;
    }

    if ((left && !left.property) ||
        (left && left.property &&
            left.property.name !== 'exports')
    ) {
        return false;
    }

    return true;
}

},{}],77:[function(require,module,exports){
'use strict';

var assert = require('assert');

module.exports = isSameType;

/*eslint complexity: 0, max-statements: [2,80]*/
function isSameType(left, right) {
    if (left === right) {
        return true;
    }

    if (
        (right && left === null) ||
        (left && right === null)
    ) {
        return false;
    }

    if (left.type !== right.type) {
        // console.log('EARLY BAIL');
        return false;
    }

    var i = 0;

    if (left.type === 'typeLiteral') {
        if (left.name !== right.name) {
            // console.log('LITERAL MISMATCH');
            return false;
        }

        return true;
    } else if (left.type === 'object') {
        if (left.keyValues.length !== right.keyValues.length) {
            // console.log('OBJECT KEYS');
            return false;
        }

        for (i = 0; i < left.keyValues.length; i++) {
            var l = left.keyValues[i];
            var r = right.keyValues[i];

            if (l.key !== r.key) {
                // console.log('WEIRD KEYS');
                return false;
            }

            if (!isSameType(l.value, r.value)) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'genericLiteral') {
        if (!isSameType(left.value, right.value)) {
            return false;
        }

        if (left.generics.length !== right.generics.length) {
            // console.log('GENERICS KEYS');
            return false;
        }

        for (i = 0; i < left.generics.length; i++) {
            if (!isSameType(left.generics[i], right.generics[i])) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'unionType') {
        if (left.unions.length !== right.unions.length) {
            // console.log('UNIONS WEIRD');
            return false;
        }

        // TODO: order-ness...
        for (i = 0; i < left.unions.length; i++) {
            if (!isSameType(left.unions[i], right.unions[i])) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'intersectionType') {
        if (left.intersections.length !== right.intersections.length) {
            return false;
        }

        // TODO: order-ness
        for (i = 0; i < left.intersections.length; i++) {
            if (!isSameType(
                left.intersections[i], right.intersections[i]
            )) {
                return false;
            }
        }

        return true;
    } else if (left.type === 'valueLiteral') {
        if (left.name !== right.name) {
            // console.log('VALUE WEIRD');
            return false;
        }

        return true;
    } else if (left.type === 'function') {
        if (left.args.length !== right.args.length) {
            // console.log('ARGS WEIRD');
            return false;
        }

        for (i = 0; i < left.args.length; i++) {
            if (!isSameType(left.args[i], right.args[i])) {
                return false;
            }
        }

        if (!isSameType(left.thisArg, right.thisArg)) {
            return false;
        }

        if (!isSameType(left.result, right.result)) {
            return false;
        }

        return true;
    } else if (left.type === 'param') {
        // left.name, names can be different
        if (!isSameType(left.value, right.value)) {
            return false;
        }

        // Optional must be same
        if (left.optional !== right.optional) {
            return false;
        }

        return true;
    } else if (left.type === 'tuple') {
        if (left.values.length !== right.values.length) {
            return false;
        }

        for (i = 0; i < left.values.length; i++) {
            if (!isSameType(left.values[i], right.values[i])) {
                return false;
            }
        }

        return true;
    } else {
        assert(false, 'isSameType unexpected type: ' + left.type);
    }
}

},{"assert":24}],78:[function(require,module,exports){
'use strict';

var assert = require('assert');

module.exports = JsigASTReplacer;

function JsigASTReplacer(replacer, neverRaw) {
    this.replacer = replacer;
    this.neverRaw = Boolean(neverRaw);
}

/*eslint complexity: [2, 80], max-statements: [2, 150]*/
JsigASTReplacer.prototype.inlineReferences =
function inlineReferences(ast, rawAst, stack) {
    assert(Array.isArray(stack), 'must pass in a stack');
    var i;

    if (ast.type === 'program') {
        var newStatements = [];
        stack.push('statements');
        for (i = 0; i < ast.statements.length; i++) {
            stack.push(i);
            var t = this.inlineReferences(
                ast.statements[i], rawAst.statements[i], stack
            );
            stack.pop();
            if (t) {
                newStatements.push(t);
            }
        }
        stack.pop();
        ast.statements = newStatements;
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeDeclaration') {
        var newGenerics = [];
        stack.push('generics');
        for (i = 0; i < ast.generics.length; i++) {
            stack.push(i);
            newGenerics[i] = this.inlineReferences(
                ast.generics[i], rawAst.generics[i], stack
            );
            stack.pop();
        }
        stack.pop();
        ast.generics = newGenerics;

        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return null;
    } else if (ast.type === 'assignment') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'defaultExport') {
        stack.push('typeExpression');
        ast.typeExpression = this.inlineReferences(
            ast.typeExpression, rawAst.typeExpression, stack
        );
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'function') {
        stack.push('args');
        for (i = 0; i < ast.args.length; i++) {
            stack.push(i);
            ast.args[i] = this.inlineReferences(
                ast.args[i], rawAst.args[i], stack
            );
            stack.pop();
        }
        stack.pop();

        if (ast.thisArg) {
            stack.push('thisArg');
            ast.thisArg = this.inlineReferences(
                ast.thisArg, rawAst.thisArg, stack
            );
            stack.pop();
        }
        if (ast.result) {
            stack.push('result');
            ast.result = this.inlineReferences(
                ast.result, rawAst.result, stack
            );
            stack.pop();
        }

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'typeLiteral') {
        if (ast.builtin || ast.isGeneric) {
            ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        return this.replacer.replace(ast, rawAst, stack);
    } else if (ast.type === 'genericLiteral') {
        if (ast.value.builtin) {
            stack.push('generics');
            for (i = 0; i < ast.generics.length; i++) {
                stack.push(i);
                ast.generics[i] = this.inlineReferences(
                    ast.generics[i], rawAst.generics[i], stack
                );
                stack.pop();
            }
            stack.pop();

            stack.push('value');
            ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
            stack.pop();

            ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
            return ast;
        }

        // Inline the arguments to the generics before calling replacer.
        stack.push('generics');
        for (i = 0; i < ast.generics.length; i++) {
            stack.push(i);
            ast.generics[i] = this.inlineReferences(
                ast.generics[i], rawAst.generics[i], stack
            );
            stack.pop();
        }
        stack.pop();

        return this.replacer.replace(ast, rawAst, stack);
        // console.log('ast.value', ast.value);
        // throw new Error('git rekt');
    } else if (ast.type === 'object') {
        stack.push('keyValues');
        for (i = 0; i < ast.keyValues.length; i++) {
            stack.push(i);
            ast.keyValues[i] = this.inlineReferences(
                ast.keyValues[i], rawAst.keyValues[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'tuple') {
        stack.push('values');
        for (i = 0; i < ast.values.length; i++) {
            stack.push(i);
            ast.values[i] = this.inlineReferences(
                ast.values[i], rawAst.values[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw | rawAst);
        return ast;
    } else if (ast.type === 'keyValue') {
        stack.push('value');
        ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'param') {
        stack.push('value');
        ast.value = this.inlineReferences(ast.value, rawAst.value, stack);
        stack.pop();
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'unionType') {
        stack.push('unions');
        for (i = 0; i < ast.unions.length; i++) {
            stack.push(i);
            ast.unions[i] = this.inlineReferences(
                ast.unions[i], rawAst.unions[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'intersectionType') {
        stack.push('intersections');
        for (i = 0; i < ast.intersections.length; i++) {
            stack.push(i);
            ast.intersections[i] = this.inlineReferences(
                ast.intersections[i], rawAst.intersections[i], stack
            );
            stack.pop();
        }
        stack.pop();

        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'valueLiteral') {
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'comment') {
        ast._raw = this.neverRaw ? null : (ast._raw || rawAst);
        return ast;
    } else if (ast.type === 'import') {
        return this.replacer.replace(ast, rawAst, stack);
    } else {
        throw new Error('unknown ast type: ' + ast.type);
    }
};

},{"assert":24}],79:[function(require,module,exports){
'use strict';

/* @jsig */

var Parsimmon = require('parsimmon');
var definition = require('../../parser/type-definition.js');
var Errors = require('../errors.js');

module.exports = parseJSigType;

function parseJSigType(source) {
    var res = definition.parse(source);

    if (res.status) {
        return new Result(null, res.value);
    }

    var message = Parsimmon.formatError(source, res);

    var error = Errors.CannotParseHeaderFile({
        // Should be 1 index
        line: res.index.line,
        msg: message,
        source: source
    });
    return new Result(error, null);
}

function Result(err, value) {
    this.error = err;
    this.value = value;
}

},{"../../parser/type-definition.js":58,"../errors.js":69,"parsimmon":36}],80:[function(require,module,exports){
(function (global){
'use strict';

var process = global.process;
var assert = require('assert');
var path = require('path');
var TermColor = require('term-color');

var serializeType = require('../../serialize.js');

var isJSFileR = /\.js$/;
var STRAIGHT_LINE = '-----------------------------------------' +
    '------------------------';

var CWD = process ? process.cwd() : '/';

module.exports = {
    prettyPrintAllErrors: prettyPrintAllErrors,
    prettyPrintAllErrorsWithTrace: prettyPrintAllErrorsWithTrace,
    prettyPrintTraces: prettyPrintTraces,
    prettyPrintErrorStatement: prettyPrintErrorStatement
};

function prettyPrintAllErrors(checker) {
    var parts = [];
    parts.push('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];
        parts.push(prettyPrintErrorStatement(checker, error));
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    parts.push(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    parts.push('');

    return parts.join('\n');
}

function prettyPrintAllErrorsWithTrace(checker) {
    var parts = [];
    parts.push('');

    for (var i = 0; i < checker.errors.length; i++) {
        var error = checker.errors[i];

        parts.push(prettyPrintErrorStatement(checker, error));

        if (error.loc && isJSFileR.test(error.fileName)) {
            var extraTraces = findContextTraces(checker, error);

            if (extraTraces.length > 0) {
                parts.push('traces for error : ');
                parts.push('');
            }

            for (var j = 0; j < extraTraces.length; j++) {
                var trace = extraTraces[j];
                parts.push(prettyPrintTraceStatement(checker, trace, '    '));
            }
        }
    }

    var word = checker.errors.length === 1 ? 'error' : 'errors';
    parts.push(TermColor.red('Found (' + checker.errors.length + ') ' + word));
    parts.push('');

    return parts.join('\n');
}

function prettyPrintTraces(checker) {
    var traces = checker.traces;
    var parts = [];
    parts.push('');

    for (var i = 0; i < traces.length; i++) {
        var trace = traces[i];
        parts.push(prettyPrintTraceStatement(checker, trace, ''));
    }

    return parts.join('\n');
}

function prettyPrintTraceStatement(checker, trace, prefix) {
    var str = '';

    assert(trace.fileName, 'trace must have fileName');
    var relativePath = path.relative(CWD, trace.fileName);

    str += prefix + TermColor.underline(relativePath) + '\n';
    str += prettyPrintTrace(checker, trace, {
        prefix: prefix || ''
    });

    return str;
}

function findContextTraces(checker, error) {
    var contextTraces = [];

    for (var i = 0; i < checker.traces.length; i++) {
        var trace = checker.traces[i];

        if (trace.fileName !== error.fileName) {
            continue;
        }

        var traceLoc = trace.node.loc;
        if (traceLoc.start.line < error.loc.start.line ||
            traceLoc.end.line > error.loc.end.line
        ) {
            continue;
        }

        contextTraces.push(trace);
    }

    return contextTraces;
}

function prettyPrintErrorStatement(checker, error) {
    assert(error.fileName, 'error must have fileName');
    var relativePath = path.relative(CWD, error.fileName);

    var str = '';
    str += TermColor.underline(relativePath) + '\n';
    str += prettyPrintError(checker, error, {
        prefix: ''
    });

    return str;
}

function lineGreen(text) {
    if (text.indexOf('\n') === -1) {
        return TermColor.green(text);
    }

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = TermColor.green(lines[i]);
    }

    return lines.join('\n');
}

function lineRed(text) {
    if (text.indexOf('\n') === -1) {
        return TermColor.red(text);
    }

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = TermColor.red(lines[i]);
    }

    return lines.join('\n');
}

function prettyPrintError(checker, error, opts) {
    var parts = [];

    parts.push(opts.prefix + 'Found error: ' + TermColor.cyan(error.type));
    parts.push(opts.prefix + error.message);
    parts.push('');

    if (opts.showLoc !== false && error.loc) {
        var sourceLines;
        if (error.source) {
            sourceLines = error.source.split('\n');
        } else {
            var meta = checker.getOrCreateMeta(error.fileName);
            sourceLines = meta.sourceLines;
        }

        var failingLines = getFailingLines(sourceLines, error.loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
        parts.push('');
    } else if (opts.showLoc !== false &&
        (
            error.type === 'jsig.checker.could-not-parse-javascript' ||
            error.type === 'jsig.parser.cannot-parse-header-file'
        )
    ) {
        sourceLines = error.source.split('\n');

        var loc = {
            start: {
                column: 0,
                line: error.line
            },
            end: {
                line: error.line,
                column: sourceLines[error.line - 1].length
            }
        };

        failingLines = getFailingLines(sourceLines, loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
        parts.push('');
    }

    if (error.expected && error.actual) {
        parts.push(opts.prefix +
            'Expected : ' + lineGreen(error.expected));
        parts.push(opts.prefix +
            'Actual   : ' + lineRed(error.actual));
        parts.push('');
    }

    if (Array.isArray(error.originalErrors)) {
        var nestedPrefix = opts.prefix + '    ';
        parts.push(nestedPrefix + STRAIGHT_LINE);
        parts.push(nestedPrefix + 'Error caused by: ');
        parts.push('');

        for (var j = 0; j < error.originalErrors.length; j++) {
            var e = error.originalErrors[j];
            parts.push(
                nestedPrefix + 'Branch: ' + TermColor.green(e.branchType)
            );
            parts.push(prettyPrintError(checker, e, {
                prefix: nestedPrefix,
                showLoc: false
            }));
            parts.push('');
        }
    }

    return parts.join('\n');
}

function prettyPrintTrace(checker, trace, opts) {
    var parts = [];

    parts.push(opts.prefix + 'TRACE: ' + TermColor.cyan(trace.type));

    if (trace.node.loc) {
        var meta = checker.getOrCreateMeta(trace.fileName);
        var failingLines = getFailingLines(meta.sourceLines, trace.node.loc, {
            prefix: opts.prefix
        });

        parts.push(failingLines);
        parts.push('');
    }

    var expected = serializeType(trace.expected);
    var actual = serializeType(trace.actual);

    var expectedLines = expected.split('\n');
    var actualLines = actual.split('\n');
    if (expectedLines.length > 1) {
        expected = expectedLines.join('\n' + opts.prefix);
    }
    if (actualLines.length > 1) {
        actual = actualLines.join('\n' + opts.prefix);
    }

    parts.push(opts.prefix + 'Expected : ' + lineGreen(expected));
    parts.push(opts.prefix + 'Actual : ' + lineRed(actual));
    parts.push('');

    return parts.join('\n');
}

function getFailingLines(sourceLines, loc, opts) {
    var startLine = loc.start.line - 1;
    var endLine = loc.end.line - 1;

    var prevLine = sourceLines[startLine - 1] || '';
    var nextLine = sourceLines[endLine + 1] || '';

    var segments = [
        opts.prefix + String(startLine) + '. ' + TermColor.gray(prevLine)
    ];

    var failLine;
    var startColumn;
    var endColumn;
    if (startLine === endLine) {
        failLine = sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            opts.prefix +
            String(startLine + 1) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    } else {
        failLine = sourceLines[startLine];
        startColumn = loc.start.column;
        endColumn = loc.end.column;

        segments.push(
            opts.prefix +
            String(startLine + 1) + '. ' +
            failLine.slice(0, startColumn) +
            TermColor.red(failLine.slice(startColumn, failLine.length))
        );

        for (var i = startLine + 1; i < endLine; i++) {
            segments.push(
                opts.prefix +
                String(i + 1) + '. ' + TermColor.red(sourceLines[i])
            );
        }

        failLine = sourceLines[endLine];

        segments.push(
            opts.prefix +
            String(endLine + 1) + '. ' +
            TermColor.red(failLine.slice(0, endColumn)) +
            failLine.slice(endColumn, failLine.length)
        );
    }

    segments.push(
        opts.prefix +
        String(endLine + 2) + '. ' + TermColor.gray(nextLine)
    );

    return segments.join('\n');
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../serialize.js":67,"assert":24,"path":25,"term-color":44}],81:[function(require,module,exports){
'use strict';

/* @jsig */


var Parsimmon = require('parsimmon');
var program = require('../../parser/program.js');
var Errors = require('../errors.js');

readJSigAST.parseJSigAST = parseJSigAST;

module.exports = readJSigAST;

function readJSigAST(fileName) {
    if (!fs.existsSync(fileName)) {
        return new Result(null, null);
    }

    var source = fs.readFileSync(fileName, 'utf8');
    return parseJSigAST(source);
}

function parseJSigAST(source) {
    var res = program.parse(source);

    if (res.status) {
        return new Result(null, res.value);
    }

    var message = Parsimmon.formatError(source, res);

    var error = Errors.CannotParseHeaderFile({
        // Should be 1 index
        line: res.index.line,
        msg: message,
        source: source
    });
    return new Result(error, null);
}

function Result(err, value) {
    this.error = err;
    this.value = value;
}

},{"../../parser/program.js":55,"../errors.js":69,"parsimmon":36}],82:[function(require,module,exports){
'use strict';

var assert = require('assert');

var JsigAST = require('../../ast/');
var cloneJSIG = require('./clone-ast.js');
var isSameType = require('./is-same-type.js');

module.exports = updateObject;

function updateObject(targetType, keyPath, newValue) {
    if (targetType.type === 'object') {
        return _updateObject(targetType, keyPath, newValue);
    }

    // Handle Array<X>
    if (targetType.type === 'genericLiteral' &&
        targetType.value.type === 'typeLiteral' &&
        targetType.value.name === 'Array' &&
        targetType.value.builtin
    ) {
        // We are not going to mutate the builtin array...
        return targetType;
    }

    if (targetType.type === 'tuple') {
        return _updateTuple(targetType, keyPath, newValue);
    }

    if (targetType.type === 'intersectionType') {
        return _updateIntersection(targetType, keyPath, newValue);
    }

    if (targetType.type === 'unionType') {
        return _updateUnion(targetType, keyPath, newValue);
    }

    assert(false, 'unsupported type for updateObject(): ' + targetType.type);
}

function _updateUnion(targetType, keyPath, newValue) {
    var clone = cloneJSIG(targetType);
    var oldUnions = clone.unions;
    var unions = clone.unions = [];

    for (var i = 0; i < oldUnions.length; i++) {
        var possibleType = oldUnions[i];

        var currentValue = findObject(possibleType, keyPath);
        if (isSameType(currentValue, newValue)) {
            unions.push(possibleType);
        }
    }

    return clone;
}

function findObject(targetType, keyPath) {
    if (targetType.type === 'object') {
        for (var i = 0; i < targetType.keyValues.length; i++) {
            var pair = targetType.keyValues[i];
            var fieldName = keyPath[0];

            if (pair.key !== fieldName) {
                continue;
            }

            var fieldValue;
            if (keyPath.length === 1) {
                fieldValue = pair.value;
            } else {
                fieldValue = findObject(pair.value, keyPath.slice(1));
            }

            return fieldValue;
        }

        return null;
    } else if (targetType.type === 'tuple') {
        var index = keyPath[0];

        assert(keyPath.length === 1, 'only support trivial keyPath');
        assert(typeof index === 'number', 'must be numeric index');
        assert(index >= 0 && index <= targetType.values.length,
            'index must be within values of tuple');

        return targetType.values[index];
    } else {
        assert(false, 'unsupported type for findObject(): ' +
            targetType.type);
    }
}

function _updateIntersection(targetType, keyPath, newValue) {
    var clone = cloneJSIG(targetType);
    clone.intersections = clone.intersections.slice();
    var intersections = clone.intersections;

    var primaryKey = keyPath[0];
    var foundIndex = -1;

    for (var i = 0; i < intersections.length; i++) {
        var possibleObject = intersections[i];
        if (possibleObject.type !== 'object') {
            continue;
        }

        // TODO: only narrows the first type found
        for (var j = 0; j < possibleObject.keyValues.length; j++) {
            var pair = possibleObject.keyValues[j];
            if (pair.key === primaryKey) {
                foundIndex = i;
                break;
            }
        }
    }

    assert(foundIndex !== -1, 'cannot updateObject() weird intersection');

    var obj = updateObject(intersections[foundIndex], keyPath, newValue);
    intersections[foundIndex] = obj;

    return clone;
}

function _updateTuple(targetType, keyPath, newValue) {
    assert(targetType.type === 'tuple', 'targetType must be tuple');
    assert(newValue, 'newValue cannot be null');

    var newValues = targetType.values.slice();
    var index = keyPath[0];

    assert(keyPath.length === 1, 'only support trivial keyPath');
    assert(typeof index === 'number', 'must be numeric index');
    assert(index >= 0 && index <= newValues.length,
        'index must be within values of tuple');

    newValues[index] = newValue;

    return JsigAST.tuple(newValues, null, {
        inferred: targetType.inferred
    });
}

function _updateObject(targetType, keyPath, newValue) {
    assert(targetType.type === 'object', 'targetType must be object');
    assert(newValue, 'newValue cannot be null');

    var pairs = [];
    var addedField = false;
    for (var i = 0; i < targetType.keyValues.length; i++) {
        var pair = targetType.keyValues[i];
        var fieldName = keyPath[0];

        if (pair.key !== fieldName) {
            pairs.push(JsigAST.keyValue(pair.key, pair.value));
            continue;
        }

        var fieldValue;
        if (keyPath.length === 1) {
            fieldValue = newValue;
        } else {
            fieldValue = updateObject(pair.value, keyPath.slice(1), newValue);
        }

        addedField = true;
        pairs.push(JsigAST.keyValue(pair.key, fieldValue));
    }

    if (!addedField) {
        assert(keyPath.length === 1, 'keyPath must be shallow');
        pairs.push(JsigAST.keyValue(keyPath[0], newValue));
    }

    return JsigAST.object(pairs);
}

},{"../../ast/":10,"./clone-ast.js":72,"./is-same-type.js":77,"assert":24}],83:[function(require,module,exports){
'use strict';

var path = require('path');
var assert = require('assert');

var isModuleExports = require('./lib/is-module-exports.js');
var serialize = require('../serialize.js');
var ASTVerifier = require('./ast-verifier.js');
var TypeInference = require('./type-inference.js');
var SubTypeChecker = require('./sub-type.js');
var NarrowType = require('./narrow-type.js');
var FileScope = require('./scope.js').FileScope;
var FunctionScope = require('./scope.js').FunctionScope;
var BranchScope = require('./scope.js').BranchScope;
var Errors = require('./errors.js');
var JsigAST = require('../ast/');
var parseJSigType = require('./lib/parse-jsig-type.js');

module.exports = ProgramMeta;

function CheckerRules() {
    this.optin = false;
    this.partialExport = false;
    this.allowUnusedFunction = false;
    this.allowUnknownRequire = false;
}

function TraceInfo(type, node, expected, actual) {
    this.node = node;
    this.expected = expected;
    this.actual = actual;
    this.type = type;
    this.fileName = '';
}

function ProgramMeta(checker, ast, fileName, source) {
    this.checker = checker;
    this.ast = ast;
    this.fileName = fileName;
    this.source = source;
    this.sourceLines = source.split('\n');
    this.checkerRules = new CheckerRules();

    this.identifiers = {};
    this.operators = {};
    this.virtualTypes = {};
    this.macros = {};

    this.type = 'program';

    // Esprima AST for exports
    this.moduleExportsNode = null;
    // JSig type AST for exports type
    this.moduleExportsType = null;
    // Name of variable, if applicable
    this.moduleExportsName = null;
    // Whether an module.exports statement exists
    this.hasModuleExports = false;
    // Which field names were exported
    this.exportedFields = [];

    this.globalScope = checker.globalScope;
    this.currentScope = new FileScope(this.globalScope);
    this.currentScope.loadModuleTokens();

    this.fatalError = false;

    this.headerFile = null;
    this.headerFileName = '';
    this.verifier = new ASTVerifier(this, this.checker, this.fileName);
    this.inference = new TypeInference(this);
    this.narrow = new NarrowType(this);

    this.currentNode = null;
    this.currentExpressionType = null;
}

ProgramMeta.prototype.serializeType =
function serializeType(type, opts) {
    return serialize(type, opts);
};

ProgramMeta.prototype.serializeAST =
function serializeAST(ast) {
    if (!ast) {
        return '';
    }

    var startLine = ast.loc.start.line;
    var endLine = ast.loc.end.line;

    if (startLine === endLine) {
        return this.sourceLines[startLine - 1].slice(
            ast.loc.start.column, ast.loc.end.column
        );
    }

    var segments = [
        this.sourceLines[startLine - 1].slice(ast.loc.start.column)
    ];

    for (var i = startLine; i < endLine - 1; i++) {
        segments.push(this.sourceLines[i]);
    }

    segments.push(
        this.sourceLines[endLine - 1].slice(0, ast.loc.end.column)
    );

    return segments.join('\n');
};

ProgramMeta.prototype.getOperator = function getOperator(id) {
    return this.globalScope.getOperator(id);
};

ProgramMeta.prototype.getVirtualType = function getVirtualType(id) {
    return this.globalScope.getVirtualType(id);
};

function parseCommentLines(commentText) {
    var lines = commentText.split('\n');
    var segments = [];
    for (var i = 0; i < lines.length; i++) {
        var chunks = lines[i].split(',');
        for (var j = 0; j < chunks.length; j++) {
            var trimmed = chunks[j].trim();
            if (trimmed !== '') {
                segments.push(trimmed);
            }
        }
    }

    return segments;
}

ProgramMeta.prototype.parseRules = function parseRules() {
    var node = this.ast;
    assert(node.type === 'Program', 'Esprima ast must be program');

    var firstComment = node.comments[0];
    var commentText = firstComment ? firstComment.value.trim() : '';

    if (commentText.length === 0) {
        return;
    }

    // If not startsWith @jsig
    if (commentText.indexOf('@jsig') !== 0) {
        return;
    }

    this.checkerRules.optin = true;
    commentText = commentText.slice(5);
    var segments = parseCommentLines(commentText);

    for (var i = 0; i < segments.length; i++) {
        var parts = segments[i].split(':');

        if (parts.length !== 2) {
            this.addError(Errors.UnrecognisedOption({
                key: segments[i],
                loc: firstComment.loc,
                line: firstComment.loc.start.line
            }));
            continue;
        }

        var key = parts[0].trim();
        var value = parts[1].trim();

        if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        }

        if (key === 'partialExport') {
            this.checkerRules.partialExport = value;
        } else if (key === 'allowUnusedFunction') {
            this.checkerRules.allowUnusedFunction = value;
        } else if (key === 'allowUnknownRequire') {
            this.checkerRules.allowUnknownRequire = value;
        } else {
            this.addError(Errors.UnrecognisedOption({
                key: key,
                loc: firstComment.loc,
                line: firstComment.loc.start.line
            }));
        }
    }
};

ProgramMeta.prototype.verify = function verify() {
    var node = this.ast;

    this.parseRules();

    var beforeErrors = this.countErrors();
    var success = this.loadHeaderFile(false);
    var afterErrors = this.countErrors();

    this.setModuleExportsNode(node);

    // If something went wrong in the header file loading phase
    // Then do not even bother to check the source code against
    // a malformed / half done header.
    if (!success || beforeErrors !== afterErrors) {
        return;
    }

    if (this.checker.optin) {
        if (this.checkerRules.optin) {
            this.verifyNode(node, null);
        } else if (!this.moduleExportsType) {
            this.moduleExportsType = JsigAST.literal(
                '%Mixed%%UnknownExports', true
            );
        }
    } else {
        this.verifyNode(node, null);
    }
};

ProgramMeta.prototype.verifyNode = function verifyNode(node, exprType) {
    if (this.fatalError) {
        return null;
    }

    assert(exprType !== undefined, 'must pass in exprType');
    assert(node, 'must pass in a node');

    if (node.leadingComments) {
        var lastCommentNode = node.leadingComments[
            node.leadingComments.length - 1
        ];
        var lastComment = lastCommentNode.value.trim();

        // Add jsig ignore next support
        if (lastComment.indexOf('jsig ignore next') === 0) {
            var seperatorIndex = lastComment.indexOf(':');
            var head = lastComment.slice(0, seperatorIndex);
            var rest = lastComment.slice(seperatorIndex, lastComment.length);

            if (seperatorIndex === -1 || head !== 'jsig ignore next') {
                this.addError(Errors.InvalidIgnoreComment({
                    loc: lastCommentNode.loc,
                    line: lastCommentNode.loc.start.line,
                    reason: 'Must specify a reason. e.g. ' +
                        '`jsig ignore next: {reason}`'
                }));
            } else if (rest.length < 10) {
                this.addError(Errors.InvalidIgnoreComment({
                    loc: lastCommentNode.loc,
                    line: lastCommentNode.loc.start.line,
                    reason: 'reason specific must be at least 10 characters.'
                }));
            } else {
                return null;
            }
        }
    }

    var parent = this.currentNode;
    this.currentNode = node;
    var oldExprType = this.currentExpressionType;
    this.currentExpressionType = exprType;

    var type = this.verifier.verifyNode(node);

    this.currentExpressionType = oldExprType;
    this.currentNode = parent;
    return type;
};

ProgramMeta.prototype.inferType = function inferType(node) {
    if (this.fatalError) {
        return null;
    }

    var inferred = this.inference.inferType(node);

    this.addTrace(new TraceInfo(
        'meta.infer-type',
        node,
        JsigAST.literal('<InferredType>'),
        inferred || JsigAST.literal('<InferenceError>')
    ));

    return inferred;
};

ProgramMeta.prototype.narrowType =
function narrowType(node, ifBranch, elseBranch) {
    if (this.fatalError) {
        return null;
    }

    return this.narrow.narrowType(node, ifBranch, elseBranch);
};

ProgramMeta.prototype.resolveGeneric =
function resolveGeneric(funcType, node, currentExpressionType) {
    if (this.fatalError) {
        return null;
    }

    return this.inference.resolveGeneric(
        funcType, node, currentExpressionType
    );
};

ProgramMeta.prototype.setModuleExportsNode =
function setModuleExportsNode(astNode) {
    var moduleExports = null;
    for (var i = 0; i < astNode.body.length; i++) {
        if (isModuleExports(astNode.body[i])) {
            moduleExports = astNode.body[i];
        }
    }

    if (moduleExports) {
        this.moduleExportsNode = moduleExports.expression.right;
        if (this.moduleExportsNode.type === 'Identifier') {
            this.currentScope.setExportedIdentifier(
                this.moduleExportsNode.name
            );

            var prevErrors = this.getErrors();
            var exportType = this.verifyNode(this.moduleExportsNode, null);
            this.setErrors(prevErrors);

            if (exportType) {
                this.setModuleExportsType(
                    exportType, this.moduleExportsNode
                );
            }
        }
    }
};

ProgramMeta.prototype.setModuleExportsType =
function setModuleExportsType(typeDefn, astNode) {
    assert(this.moduleExportsType === null, 'cannot double export');

    this.moduleExportsName = astNode.name;
    this.moduleExportsType = typeDefn;
    this.hasModuleExports = true;
};

ProgramMeta.prototype.getModuleExportsType =
function getModuleExportsType() {
    return this.moduleExportsType;
};

ProgramMeta.prototype.hasExportDefined =
function hasExportDefined() {
    return this.moduleExportsType !== null;
};

ProgramMeta.prototype.setHasModuleExports =
function setHasModuleExports(bool) {
    this.hasModuleExports = bool;
};

ProgramMeta.prototype.hasFullyExportedType =
function hasFullyExportedType() {
    if (this.hasModuleExports) {
        return this.hasModuleExports;
    }

    if (this.exportedFields.length === 0 ||
        !this.moduleExportsType ||
        this.moduleExportsType.type !== 'object'
    ) {
        return false;
    }

    var objKeys = getFieldsFromObject(this.moduleExportsType).sort();
    var exported = this.exportedFields.sort();

    var isSame = exported.length === objKeys.length;
    for (var i = 0; i < objKeys.length; i++) {
        isSame = isSame && (objKeys[i] === exported[i]);
    }

    return isSame;
};

function getFieldsFromObject(objType) {
    var keys = [];

    for (var i = 0; i < objType.keyValues.length; i++) {
        keys.push(objType.keyValues[i].key);
    }

    return keys;
}

ProgramMeta.prototype.addExportedField =
function addExportedField(fieldName) {
    if (this.exportedFields.indexOf(fieldName) === -1) {
        this.exportedFields.push(fieldName);
    }
};

ProgramMeta.prototype.getExportedFields =
function getExportedFields() {
    return this.exportedFields;
};

ProgramMeta.prototype.addTrace = function addTrace(trace) {
    trace.fileName = this.fileName;
    this.checker.addTrace(trace);
};

ProgramMeta.prototype.addError = function addError(error) {
    /* silence untyped-function-found if opted in */
    if (this.checkerRules.allowUnusedFunction &&
        error.type === 'jsig.verify.untyped-function-found'
    ) {
        return;
    }

    error.fileName = this.fileName;
    // console.trace('addError(' + error.type + ')');
    this.checker.addError(error);
};

ProgramMeta.prototype.countErrors = function countErrors() {
    return this.checker.countErrors();
};

ProgramMeta.prototype.getErrors =
function getErrors() {
    return this.checker.getErrors();
};
ProgramMeta.prototype.setErrors =
function setErrors(list) {
    this.checker.setErrors(list);
};

ProgramMeta.prototype.checkSubType =
function checkSubType(node, leftType, rightType) {
    var err = this.checkSubTypeRaw(node, leftType, rightType);
    if (err) {
        this.addError(err);
        return false;
    }
    return true;
};

ProgramMeta.prototype.checkSubTypeRaw =
function checkSubTypeRaw(node, leftType, rightType) {
    this.addTrace(new TraceInfo(
        'meta.check-sub-type', node, leftType, rightType
    ));

    var subType = new SubTypeChecker(this, node);
    return subType.checkSubType(leftType, rightType, 'root');
};

ProgramMeta.prototype.isSubType =
function isSubType(node, leftType, rightType) {
    var e = this.checkSubTypeRaw(node, leftType, rightType);
    return !e;
};

/*
Each program has a mandatory header file. This contains
type definitions for a subset of the program.

*/
ProgramMeta.prototype.loadHeaderFile =
function loadHeaderFile(required) {
    var extName = path.extname(this.fileName);
    var extIndex = this.fileName.lastIndexOf(extName);

    this.headerFileName = this.fileName.slice(0, extIndex) + '.hjs';

    // if the header file is not required and we could not read it
    // then this is expected and we continue on
    if (!required && !this.checker.tryReadHeaderFile(this.headerFileName)) {
        return true;
    }

    this.headerFile = this.checker.getOrCreateHeaderFile(this.headerFileName);

    if (!this.headerFile) {
        return false;
    }

    var assignments = this.headerFile.getResolvedAssignments();
    for (var i = 0; i < assignments.length; i++) {
        var expr = assignments[i];

        this.currentScope.preloadVar(expr.identifier, expr.typeExpression);
    }

    var exportType = this.headerFile.getExportType();
    if (exportType !== null) {
        this.moduleExportsType = exportType;
    }

    return true;
};

ProgramMeta.prototype.parseTypeString =
function parseTypeString(node, source) {
    var res = parseJSigType(source);
    if (res.error) {
        res.error.loc = node.loc;
        res.error.fileName = this.fileName;
        this.addError(res.error);
        return null;
    }

    if (!res.value) {
        return null;
    }

    if (this.headerFile === null) {
        return res.value;
    }

    return this.headerFile.inlineReferences(res.value);
};

ProgramMeta.prototype.allocateBranchScope =
function allocateBranchScope() {
    return new BranchScope(this.currentScope);
};

ProgramMeta.prototype.enterBranchScope =
function enterBranchScope(scope) {
    assert(scope, 'must have a scope to enter');

    this.currentScope = scope;
};

ProgramMeta.prototype.exitBranchScope =
function exitBranchScope() {
    this.currentScope = this.currentScope.parent;
};

ProgramMeta.prototype.getFunctionName =
function getFunctionName(node) {
    var prefix = '';
    if (node.type === 'FunctionExpression') {
        prefix = '(expression @ ' + node.loc.start.line +
            ' : ' + node.loc.start.column + ') ';
    }

    if (node.id) {
        return prefix + node.id.name;
    }

    return '(anonymous @ ' + node.loc.start.line +
        ' : ' + node.loc.start.column + ' )';
};

ProgramMeta.prototype.enterFunctionScope =
function enterFunctionScope(funcNode, typeDefn) {
    var funcName = this.getFunctionName(funcNode);
    assert(typeDefn && typeDefn.type === 'function',
        'can only enterFunctionScope() with function');

    var funcScope = new FunctionScope(
        this.currentScope, funcName, funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.enterFunctionOverloadScope =
function enterFunctionOverloadScope(funcNode, typeDefn) {
    var funcScope = new FunctionScope(
        this.currentScope, this.getFunctionName(funcNode), funcNode
    );
    funcScope.loadTypes(funcNode, typeDefn);

    this.currentScope.addFunctionOverloadScope(funcScope);
    this.currentScope = funcScope;
};

ProgramMeta.prototype.exitFunctionScope =
function exitFunctionScope() {
    this.currentScope = this.currentScope.parent;
};

/* As part of inference we believe that the function named
    "name" which is untyped has a type of `newType`.

*/
ProgramMeta.prototype.tryUpdateFunction =
function tryUpdateFunction(name, newType) {
    // console.log('tryUpdateFunction()', name);
    var t = this.currentScope.getUntypedFunction(name);
    this.currentScope.updateFunction(name, newType);

    // Snap into scope of function decl
    var oldScope = this.currentScope;
    this.currentScope = t.currentScope;

    var beforeErrors = this.countErrors();

    // console.log('verifyNode()', {
    //     node: this.serializeAST(t.node)
    // });
    this.verifyNode(t.node, null);
    this.currentScope = oldScope;

    var afterErrors = this.countErrors();
    if (beforeErrors !== afterErrors) {
        var info = this.currentScope.getKnownFunctionScope(name);

        // assert(!info || info.funcScopes.length === 1,
        //     'expected only one function info obj');

        // verifyNode() failed
        if (info) {
            t.currentScope.revertFunctionScope(name, newType);
        }
        this.currentScope.revertFunction(name, t);
        return false;
    }

    return true;
};

ProgramMeta.prototype._allocateMacro =
function _allocateMacro(macroLiteral) {
    /*eslint-disable global-require*/
    // TODO: any way to avoid dynamic require... ?
    var macroBuilders = require(macroLiteral.macroFile);
    /*eslint-enable global-require*/

    var Constr = macroBuilders[macroLiteral.macroName];
    return new Constr(this, JsigAST);
};

ProgramMeta.prototype.getOrCreateMacro =
function getOrCreateMacro(macroLiteral) {
    var macros = this.macros[macroLiteral.macroFile];
    if (!macros) {
        macros = {};
        this.macros[macroLiteral.macroFile] = macros;
    }

    var macroObj = macros[macroLiteral.macroName];
    if (!macroObj) {
        macroObj = this._allocateMacro(macroLiteral);
        macros[macroLiteral.macroName] = macroObj;
    }

    return macroObj;
};

},{"../ast/":10,"../serialize.js":67,"./ast-verifier.js":68,"./errors.js":69,"./lib/is-module-exports.js":76,"./lib/parse-jsig-type.js":79,"./narrow-type.js":84,"./scope.js":85,"./sub-type.js":86,"./type-inference.js":87,"assert":24,"path":25}],84:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 25] */

var assert = require('assert');

var getUnionWithoutBool = require('./lib/get-union-without-bool.js');
var updateObject = require('./lib/update-object.js');
var isSameType = require('./lib/is-same-type.js');
var JsigAST = require('../ast/');

module.exports = NarrowType;

function NarrowType(meta) {
    this.meta = meta;
}

NarrowType.prototype.narrowType =
function narrowType(node, ifBranch, elseBranch) {
    if (node.type === 'UnaryExpression') {
        return this.narrowUnaryExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'Identifier') {
        return this.narrowIdentifier(node, ifBranch, elseBranch);
    } else if (node.type === 'BinaryExpression') {
        return this.narrowBinaryExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'LogicalExpression') {
        return this.narrowLogicalExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'MemberExpression') {
        return this.narrowMemberExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'Literal') {
        return this.narrowLiteral(node, ifBranch, elseBranch);
    } else if (node.type === 'ObjectExpression') {
        return this.narrowObjectExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'CallExpression') {
        return this.narrowCallExpression(node, ifBranch, elseBranch);
    } else if (node.type === 'AssignmentExpression') {
        return this.narrowAssignmentExpression(node, ifBranch, elseBranch);
    } else {
        throw new Error('!! skipping narrowType: ' + node.type);
    }
};

NarrowType.prototype.narrowUnaryExpression =
function narrowUnaryExpression(node, ifBranch, elseBranch) {
    if (node.operator === '!') {
        return this.narrowType(node.argument, elseBranch, ifBranch);
    } else {
        throw new Error('Unsupported operator: ' + node.operator);
    }
};

NarrowType.prototype.narrowIdentifier =
function narrowIdentifier(node, ifBranch, elseBranch) {
    var type = this.meta.verifyNode(node, null);
    if (!type) {
        return null;
    }

    if (ifBranch) {
        var ifType = getUnionWithoutBool(type, true);
        ifBranch.narrowType(node.name, ifType);
    }
    if (elseBranch) {
        var elseType = getUnionWithoutBool(type, false);
        elseBranch.narrowType(node.name, elseType);
    }
};

NarrowType.prototype.narrowBinaryExpression =
function narrowBinaryExpression(node, ifBranch, elseBranch) {
    if (node.left.type === 'UnaryExpression' &&
        node.left.operator === 'typeof'
    ) {
        return this.narrowTypeofExpression(node, ifBranch, elseBranch);
    }

    var identifier = node.left;
    if (identifier.type !== 'Identifier') {
        // TODO: support non trivial expressions
        return null;
    }

    if (node.operator !== '===' && node.operator !== '!==') {
        // TODO: support others...?
        return null;
    }

    if (node.operator === '!==') {
        var tempBranch = ifBranch;
        ifBranch = elseBranch;
        elseBranch = tempBranch;
    }

    var type = this.meta.verifyNode(identifier, null);
    if (!type) {
        return null;
    }

    if (node.right.type !== 'Literal' &&
        node.right.type !== 'Identifier'
    ) {
        // Right hand side must be null
        return null;
    }

    return this._narrowByValue(node, type, ifBranch, elseBranch);
};

NarrowType.prototype._narrowByValue =
function _narrowByValue(node, type, ifBranch, elseBranch) {
    var identifier = node.left;
    var rightValue = this.meta.verifyNode(node.right, null);

    // console.log('id', identifier, rightValue);

    if (rightValue.type === 'valueLiteral' &&
        (rightValue.value === 'null' || rightValue.value === 'undefined')
    ) {
        if (ifBranch) {
            var ifType = getUnionWithValue(type, rightValue);
            ifBranch.narrowType(identifier.name, ifType);
        }
        if (elseBranch) {
            var elseType = getUnionWithoutValue(type, rightValue);
            elseBranch.narrowType(identifier.name, elseType);
        }
    }
};

NarrowType.prototype.narrowTypeofExpression =
function narrowTypeofExpression(node, ifBranch, elseBranch) {
    var identifier = node.left.argument;
    if (identifier.type !== 'Identifier') {
        // TODO: support non trivial expressions
        return null;
    }

    if (node.operator !== '===' && node.operator !== '!==') {
        // TODO: support !==, and others... ?
        return null;
    }

    if (node.operator === '!==') {
        var tempBranch = ifBranch;
        ifBranch = elseBranch;
        elseBranch = tempBranch;
    }

    var type = this.meta.verifyNode(identifier, null);
    if (!type) {
        return null;
    }

    if (node.right.type !== 'Literal') {
        // Right hand side of equal operator
        return null;
    }

    return this._narrowByTypeofTag(node, type, ifBranch, elseBranch);
};

NarrowType.prototype._narrowByTypeofTag =
function _narrowByTypeofTag(node, type, ifBranch, elseBranch) {
    var identifier = node.left.argument;
    var typeTagNode = node.right;

    var typeTagValue = typeTagNode.value;
    var ifType;
    var elseType;
    if (typeTagValue === 'number' // &&
        // containsLiteral(type, 'Number')
    ) {
        if (ifBranch) {
            ifType = getUnionWithLiteral(type, 'Number');
            ifBranch.narrowType(identifier.name, ifType);
        }
        if (elseBranch) {
            // TODO: elseBranch
            elseType = getUnionWithoutLiteral(type, 'Number');
            elseBranch.narrowType(identifier.name, elseType);
        }
    } else if (typeTagValue === 'string' // &&
        // containsLiteral(type, 'String')
    ) {
        if (ifBranch) {
            ifType = getUnionWithLiteral(type, 'String');
            ifBranch.narrowType(identifier.name, ifType);
        }
        if (elseBranch) {
            // TODO: elseBranch
            elseType = getUnionWithoutLiteral(type, 'String');
            elseBranch.narrowType(identifier.name, elseType);
        }
    } else {
        // TODO: support other tags
        return null;
    }
};

NarrowType.prototype.narrowLiteral =
function narrowLiteral(node, ifBranch, elseBranch) {
    // TODO: support if ("") {
};

NarrowType.prototype.narrowObjectExpression =
function narrowObjectExpression(node, ifBranch, elseBranch) {
    // TODO: ...
};

NarrowType.prototype.narrowCallExpression =
function narrowCallExpression(node, ifBranch, elseBranch) {
    var fnType = this.meta.verifyNode(node.callee, null);
    if (!fnType) {
        return null;
    }

    if (fnType.specialKind === 'isArray') {
        // TODO: Support Array.isArray()
        return this.narrowIsArrayExpression(node, ifBranch, elseBranch);
    }

    // TODO: Support hasOwnProperty()
};

NarrowType.prototype.narrowIsArrayExpression =
function narrowIsArrayExpression(node, ifBranch, elseBranch) {
    var identifier = node.arguments[0];
    if (!identifier || identifier.type !== 'Identifier') {
        // TODO: support non trivial expressions
        return null;
    }

    var type = this.meta.verifyNode(identifier, null);
    if (!type) {
        return null;
    }

    if (containsLiteral(type, 'Array')) {
        if (ifBranch) {
            var ifType = getUnionWithLiteral(type, 'Array');
            ifBranch.narrowType(identifier.name, ifType);
        }
        if (elseBranch) {
            var elseType = getUnionWithoutLiteral(type, 'Array');
            elseBranch.narrowType(identifier.name, elseType);
        }
    }
};

NarrowType.prototype.narrowAssignmentExpression =
function narrowAssignmentExpression(node, ifBranch, elseBranch) {
    // TODO: like identifier, but also side-effect
};

NarrowType.prototype.narrowLogicalExpression =
function narrowLogicalExpression(node, ifBranch, elseBranch) {
    if (node.operator === '||') {
        // TODO: support ||

        this.narrowType(node.left, null, elseBranch);

        if (elseBranch) {
            this.meta.enterBranchScope(elseBranch);
            this.narrowType(node.right, null, elseBranch);
            this.meta.exitBranchScope();
        }

        // Inside IF then
        //      node.left TRUE AND node.right FALSE
        //      node.left TRUE AND node.right TRUE
        //      node.left FALSE AND node.right TRUE
        // Inside ELSE then :
        //      node.left FALSE AND node.right FALSE
    } else if (node.operator === '&&') {
        // TODO: support &&

        this.narrowType(node.left, ifBranch, null);

        if (ifBranch) {
            this.meta.enterBranchScope(ifBranch);
            this.narrowType(node.right, ifBranch, null);
            this.meta.exitBranchScope();
        }

        // Inside IF then
        //      node.left TRUE and node.right TRUE
        // Inside ELSE then :
        //      node.left FALSE and node.right FALSE
        //      node.left TRUE and node.right FALSE
        //      node.left TRUE or node.right FALSE
    } else {
        assert(false, 'unknown logical operator');
    }
};

function isTuple(jsigType) {
    if (!jsigType) {
        return false;
    }

    if (jsigType.type === 'tuple') {
        return true;
    }

    if (jsigType.type !== 'unionType') {
        return false;
    }

    for (var i = 0; i < jsigType.unions.length; i++) {
        if (jsigType.unions[i].type !== 'tuple') {
            return false;
        }
    }

    return true;
}

NarrowType.prototype.narrowMemberExpression =
function narrowMemberExpression(node, ifBranch, elseBranch) {
    // Type of field itself
    var fieldType = this.meta.verifyNode(node, null);
    if (!fieldType) {
        return null;
    }

    // Cannot narrow based on object index operator
    if (node.computed) {
        var objType = this.meta.verifyNode(node.object, null);

        if (isTuple(objType)) {
            return this._narrowTupleMemberExpression(
                node, ifBranch, elseBranch, fieldType, objType
            );
        }

        return null;
    }

    var ifType = getUnionWithoutBool(fieldType, true);
    var elseType = getUnionWithoutBool(fieldType, false);

    assert(node.property.type === 'Identifier', 'property must be field');
    var keyPath = [node.property.name];

    var parent = node.object;
    while (parent.type === 'MemberExpression') {
        assert(parent.property.type === 'Identifier', 'property must be field');
        keyPath.unshift(parent.property.name);

        parent = parent.object;
    }
    if (parent.type === 'Identifier') {
        keyPath.unshift(parent.name);
    } else if (parent.type === 'ThisExpression') {
        keyPath.unshift('this');
    } else {
        assert(false, 'object must be ref');
    }

    // targetType that needs mutation
    var targetType = this.meta.verifyNode(parent, null);

    if (ifBranch && ifType) {
        this._updateObjectAndRestrict(
            ifBranch, targetType, keyPath, ifType
        );
    }
    if (elseBranch && elseType) {
        this._updateObjectAndRestrict(
            elseBranch, targetType, keyPath, elseType
        );
    }
    // TODO: support nullable field check
};

NarrowType.prototype._narrowTupleMemberExpression =
function _narrowTupleMemberExpression(
    node, ifBranch, elseBranch, fieldType, objType
) {
    var ifType = getUnionWithoutBool(fieldType, true);
    var elseType = getUnionWithoutBool(fieldType, false);

    // only support direct checks
    if (node.object.type !== 'Identifier' ||
        node.property.type !== 'Literal'
    ) {
        return null;
    }

    var name = node.object.name;
    var numeralLiteral = node.property.value;

    var keyPath = [name, numeralLiteral];

    if (ifBranch && ifType) {
        this._updateObjectAndRestrict(ifBranch, objType, keyPath, ifType);
    }
    if (elseBranch && elseType) {
        this._updateObjectAndRestrict(elseBranch, objType, keyPath, elseType);
    }

    return null;
};

NarrowType.prototype._updateObjectAndRestrict =
function updateObjectAndRestrict(branch, objType, keyPath, valueType) {
    var newType = updateObject(
        objType, keyPath.slice(1), valueType
    );

    if (!isSameType(newType, objType)) {
        branch.narrowType(keyPath[0], newType);
    }
};

function getUnionWithValue(type, value) {
    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === '%Boolean%%Mixed'
    ) {
        return value;
    }

    if (type.type !== 'unionType') {
        if (containsValue(type, value)) {
            return type;
        } else {
            return JsigAST.literal('Never', true);
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (containsValue(t, value)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function getUnionWithLiteral(type, literalName) {
    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === '%Boolean%%Mixed'
    ) {
        return JsigAST.literal(literalName, true);
    }

    if (type.type !== 'unionType') {
        if (containsLiteral(type, literalName)) {
            return type;
        } else {
            return JsigAST.literal('Never', true);
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (containsLiteral(t, literalName)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function getUnionWithoutValue(type, value) {
    if (type.type !== 'unionType') {
        if (containsValue(type, value)) {
            return JsigAST.literal('Never', true);
        } else {
            return type;
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (!containsValue(t, value)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function getUnionWithoutLiteral(type, literalName) {
    if (type.type !== 'unionType') {
        if (containsLiteral(type, literalName)) {
            return JsigAST.literal('Never', true);
        } else {
            return type;
        }
    }

    var unions = [];
    for (var i = 0; i < type.unions.length; i++) {
        var t = type.unions[i];
        if (!containsLiteral(t, literalName)) {
            unions.push(t);
        }
    }

    if (unions.length === 0) {
        return JsigAST.literal('Never', true);
    }

    if (unions.length === 1) {
        return unions[0];
    }

    return JsigAST.union(unions);
}

function containsValue(type, value) {
    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === '%Boolean%%Mixed'
    ) {
        return true;
    }

    if (type.type === 'valueLiteral' && type.name === value.name) {
        return true;
    }

    if (type.type === 'unionType') {
        for (var i = 0; i < type.unions.length; i++) {
            var possibleType = type.unions[i];

            if (containsValue(possibleType, value)) {
                return true;
            }
        }
    }

    return false;
}

function containsLiteral(type, literalName) {
    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === '%Boolean%%Mixed'
    ) {
        return true;
    }

    if (type.type === 'typeLiteral' && type.builtin &&
        type.name === literalName
    ) {
        return true;
    }

    if (type.type === 'genericLiteral' && type.value.builtin &&
        type.value.name === literalName
    ) {
        return true;
    }

    if (type.type === 'unionType') {
        for (var i = 0; i < type.unions.length; i++) {
            var possibleType = type.unions[i];

            if (containsLiteral(possibleType, literalName)) {
                return true;
            }
        }
    }

    return false;
}

},{"../ast/":10,"./lib/get-union-without-bool.js":75,"./lib/is-same-type.js":77,"./lib/update-object.js":82,"assert":24}],85:[function(require,module,exports){
'use strict';

var assert = require('assert');
var util = require('util');

var JsigAST = require('../ast/');
var isSameType = require('./lib/is-same-type.js');

module.exports = {
    GlobalScope: GlobalScope,
    FileScope: FileScope,
    FunctionScope: FunctionScope,
    BranchScope: BranchScope
};

/*
    identifiers : A dictionary of TypeDefinitions for tokens
        in this scope

    unknownIdentifiers : A dictionary of tokens that exist in
        scope but have no type because evaluation their initial
        type turned into a type error

    typeRestrictions : The type of an identifier after a restriction
        as applied, for example inside an if branch a token might
        have a smaller type. This type is used for reading, however
        if you want to assign to the token we use the original
        unrestricted type.

    untypedFunctions : A dictionary of tokens that are known to
        be functions but do not currently have a type. Their
        type will be guessed via call-based inference on the
        first call site.

    functionScopes : A dictionary of FunctionScope instances
        for functions in the file, or nested closures in a
        function.

*/
function BaseScope(parent) {
    this.parent = parent;
    this.checker = parent.checker;
    this.type = 'base';

    this.identifiers = Object.create(null);
    this.unknownIdentifiers = Object.create(null);
    this.typeRestrictions = Object.create(null);
    this.functionScopes = Object.create(null);
    this.writableTokenLookup = false;
    this._restrictedThisValueType = null;
}

function IdentifierToken(defn, preloaded) {
    this.type = 'variable';
    this.preloaded = preloaded || false;
    this.defn = defn;
    this.inferred = 'inferred' in defn ? defn.inferred : false;
    this.aliasCount = 0;
}

BaseScope.prototype.addVar =
function addVar(id, typeDefn) {
    if (this.identifiers[id]) {
        assert(this.identifiers[id].preloaded, 'identifier must not exist');
    }

    assert(typeDefn, 'addVar() must have typeDefn');

    var token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);
    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

BaseScope.prototype.preloadVar =
function preloadVar(id, typeDefn) {
    assert(!this.identifiers[id], 'identifier must not exist');
    assert(typeDefn, 'addVar() must have typeDefn');

    var token = new IdentifierToken(typeDefn, true);
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.getVar = function getVar(id, isWritable) {
    // console.log('getVar(', id, ',', this.writableTokenLookup, ')');
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id, true);
    }

    return this.typeRestrictions[id] || this.identifiers[id] ||
        this.parent.getVar(id, isWritable);
};

BaseScope.prototype.getOwnVar = function getOwnVar(id, isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id];
    }

    return this.typeRestrictions[id] || this.identifiers[id];
};

BaseScope.prototype.getFunctionScope =
function getFunctionScope() {
    return null;
};

BaseScope.prototype.setWritableTokenLookup =
function setWritableTokenLookup() {
    this.writableTokenLookup = true;
};

BaseScope.prototype.unsetWritableTokenLookup =
function unsetWritableTokenLookup() {
    this.writableTokenLookup = false;
};

BaseScope.prototype.addUnknownVar =
function addUnknownVar(id) {
    var token = {
        type: 'unknown-variable'
    };
    this.unknownIdentifiers[id] = token;
    return token;
};

BaseScope.prototype.getUnknownVar =
function getUnknownVar(id) {
    return this.unknownIdentifiers[id];
};

/*
    This permanently mutates the read-only and write-only
    state of a variable.

    When this is applied it must be applied up the chain if
    necessary as it changes the type inside and outside a scope
*/
BaseScope.prototype.forceUpdateVar =
function forceUpdateVar(id, typeDefn) {
    if (!this.identifiers[id] && this.parent) {
        return this.parent.forceUpdateVar(id, typeDefn);
    }

    assert(this.identifiers[id], 'identifier must already exist');
    assert(typeDefn, 'cannot force update to null');

    var token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
};

BaseScope.prototype.getGlobalType =
function getGlobalType() {
    return this.parent.getGlobalType();
};

BaseScope.prototype._addFunctionScope =
function _addFunctionScope(funcScope) {
    var currScope = this.functionScopes[funcScope.funcName];
    if (currScope) {
        assert.equal(currScope.funcScopes.length, 1,
            'cannot _addFunctionScope to overloaded function');
        var currentType = currScope.funcScopes[0].funcType;

        assert(isSameType(currentType, funcScope.funcType),
            'cannot add function twice with different types: ' +
            funcScope.funcName
        );

        return;
    }

    this.functionScopes[funcScope.funcName] = {
        funcScopes: [funcScope],
        currentScope: this
    };
};

BaseScope.prototype._revertFunctionScope =
function _revertFunctionScope(name, funcType) {
    var info = this.functionScopes[name];
    assert(info, 'cannot revert what does not exist');

    assert(funcType.type !== 'functionType' || info.funcScopes.length === 1,
        'plain functions can only have one func type');

    delete this.functionScopes[name];
};

BaseScope.prototype._addFunctionOverloadScope =
function _addFunctionOverloadScope(funcScope) {
    var currScope = this.functionScopes[funcScope.funcName];
    if (!currScope) {
        this.functionScopes[funcScope.funcName] = {
            funcScopes: [funcScope],
            currentScope: this
        };
        return;
    }

    for (var i = 0; i < currScope.funcScopes.length; i++) {
        var existingScope = currScope.funcScopes[i];

        // If the function scope already exists then bail.
        if (isSameType(existingScope.funcType, funcScope.funcType)) {
            return;
        }
    }

    currScope.funcScopes.push(funcScope);
};

/*
    restrictType() is used to create a typeRestriction which
    is a read only construct.

    restrictType() is only done on a FunctionScope to apply
    a consistent type restriction after an if statement, for
    example:

    ```
    foo : Foo | null
    if (!foo) {
        foo = DEFAULT_FOO;
    }
    // type is restricted foo : Foo
    ```

    The other place where a type restriction can happen in
    a FunctionScope ( or FileScope... ) is with an assert
    statement. An assert(expr, msg) function call will restrict
    the type of the expression.
*/
BaseScope.prototype._restrictType =
function _restrictType(id, type) {
    // TODO: gaurd against weird restrictions? ...
    // assert(!this.typeRestrictions[id], 'cannot double restrict type: ' + id);
    assert(type, 'cannot restrictType to null');

    if (id === 'this') {
        this._restrictedThisValueType = type;
        return null;
    }

    var token = {
        type: 'restriction',
        defn: type
    };
    this.typeRestrictions[id] = token;
    return token;
};

function GlobalScope() {
    this.parent = null;
    this.type = 'global';

    this.identifiers = Object.create(null);
    this.operators = Object.create(null);
    this.virtualTypes = Object.create(null);
}

GlobalScope.prototype.getVar = function getVar(id) {
    return this.identifiers[id];
};

GlobalScope.prototype.getOperator = function getOperator(id) {
    return this.operators[id];
};

GlobalScope.prototype.getVirtualType = function getVirtualType(id) {
    return this.virtualTypes[id];
};

GlobalScope.prototype._addVar = function _addVar(id, typeDefn) {
    this.identifiers[id] = new IdentifierToken(typeDefn, false);
};
GlobalScope.prototype._addOperator = function _addOperator(id, typeDefn) {
    this.operators[id] = {
        type: 'operator',
        defn: typeDefn
    };
};
GlobalScope.prototype._addVirtualType = function _addVirtualType(id, typeDefn) {
    this.virtualTypes[id] = {
        type: 'virtual-type',
        defn: typeDefn
    };
};

GlobalScope.prototype.getGlobalType =
function getGlobalType() {
    var props = Object.keys(this.identifiers);
    var keyValues = {};

    for (var i = 0; i < props.length; i++) {
        keyValues[props[i]] = this.identifiers[props[i]].defn;
    }

    return JsigAST.object(keyValues);
};

function FileScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'file';

    this.exportedIdentifier = null;
    this.untypedFunctions = Object.create(null);
    this.prototypes = Object.create(null);
}
util.inherits(FileScope, BaseScope);

FileScope.prototype.loadModuleTokens =
function loadModuleTokens() {
    var moduleType = JsigAST.object({
        exports: JsigAST.literal('%Export%%ModuleExports', true)
    });
    var exportsType = JsigAST.literal('%Export%%ExportsObject', true);
    var requireType = JsigAST.literal('%Require%%RequireFunction', true);

    this.addVar('require', requireType);
    this.addVar('module', moduleType);
    this.addVar('exports', exportsType);
    this.addVar('__dirname', JsigAST.literal('String'));
};

FileScope.prototype.getExportedIdentifier =
function getExportedIdentifier(name) {
    return this.exportedIdentifier;
};

FileScope.prototype.setExportedIdentifier =
function setExportedIdentifier(name) {
    this.exportedIdentifier = name;
};

FileScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);

    if (!token) {
        /* skip mark alias for untyped functions */
        var untyped = this.getUntypedFunction(name);
        if (untyped) {
            return null;
        }
    }

    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

FileScope.prototype.addFunction =
function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node,
        currentScope: this
    };
};

FileScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
    return this.untypedFunctions[id] || null;
};

FileScope.prototype.updateFunction =
function updateFunction(id, typeDefn) {
    assert(this.untypedFunctions[id], 'function must exist already');
    this.untypedFunctions[id] = null;
    return this.addVar(id, typeDefn);
};

FileScope.prototype.revertFunction =
function revertFunction(id, token) {
    this.identifiers[id] = null;
    this.untypedFunctions[id] = token;
};

FileScope.prototype.addPrototypeField =
function addPrototypeField(id, fieldName, typeDefn) {
    if (!this.prototypes[id]) {
        this.prototypes[id] = {
            type: 'prototype',
            fields: {}
        };
    }

    this.prototypes[id].fields[fieldName] = typeDefn;
};

FileScope.prototype.getReturnExpressionType =
function getReturnExpressionType() {
    return null;
};

FileScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    this._addFunctionScope(funcScope);
};

FileScope.prototype.revertFunctionScope =
function revertFunctionScope(name, funcType) {
    this._revertFunctionScope(name, funcType);
};

FileScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FileScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.functionScopes[funcName];
};

FileScope.prototype.restrictType = function restrictType(name, type) {
    return this._restrictType(name, type);
};

function FunctionScope(parent, funcName, funcNode) {
    BaseScope.call(this, parent);
    this.type = 'function';

    this.untypedFunctions = Object.create(null);

    this.funcName = funcName;
    this.returnValueType = null;
    this._thisValueType = null;
    this.funcType = null;
    this.isConstructor = /[A-Z]/.test(funcName[0]);

    this.knownFields = [];
    this.knownReturnTypes = [];
    this.returnStatementASTNodes = [];
    this.funcASTNode = funcNode;
    this.writableTokenLookup = false;
}
util.inherits(FunctionScope, BaseScope);

FunctionScope.prototype.loadTypes =
function loadTypes(funcNode, typeDefn) {
    var len = Math.min(typeDefn.args.length, funcNode.params.length);

    var argumentsTypes = [];

    for (var i = 0; i < len; i++) {
        var param = funcNode.params[i];
        var argType = typeDefn.args[i].value;

        if (typeDefn.args[i].optional) {
            argType = JsigAST.union([
                argType, JsigAST.value('undefined')
            ]);
        }

        argumentsTypes.push(argType);
        this.addVar(param.name, argType);
    }

    // Add the arguments type to scope as a tuple
    this.addVar('arguments', JsigAST.tuple(argumentsTypes));

    this._thisValueType = null;
    if (typeDefn.thisArg) {
        this._thisValueType = typeDefn.thisArg.value;
        if (typeDefn.thisArg.optional) {
            this._thisValueType = JsigAST.union([
                this._thisValueType, JsigAST.value('undefined')
            ]);
        }
    }

    this.returnValueType = typeDefn.result;
    this.funcType = typeDefn;
};

FunctionScope.prototype.getReturnValueType =
function getReturnValueType() {
    return this.returnValueType;
};

FunctionScope.prototype.getThisType =
function getThisType(isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this._thisValueType;
    }

    return this._restrictedThisValueType || this._thisValueType;
};

FunctionScope.prototype.markVarAsAlias =
function markVarAsAlias(name, aliasName) {
    if (name === 'undefined') {
        // FFFF---
        return null;
    }

    var token = this.getVar(name);

    if (!token) {
        /* skip mark alias for untyped functions */
        var untyped = this.getUntypedFunction(name);
        if (untyped) {
            return null;
        }
    }

    assert(token, 'expected token to exist: ' + name);

    if (token.type === 'variable' && token.inferred) {
        token.aliasCount++;
    }
};

FunctionScope.prototype.addFunction = function addFunction(id, node) {
    assert(!this.identifiers[id], 'cannot shadow identifier');

    this.untypedFunctions[id] = {
        type: 'untyped-function',
        node: node,
        currentScope: this
    };
};

FunctionScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
    return this.untypedFunctions[id] || this.parent.getUntypedFunction(id);
};

/*
    updateFunction()

    Move a function `id` from `untypedFunction` predeclared
        into `identifiers`.
*/
FunctionScope.prototype.updateFunction = function updateFunction(id, type) {
    var func = this.untypedFunctions[id];
    if (func) {
        this.untypedFunctions[id] = null;
        return this.addVar(id, type);
    }

    return this.parent.updateFunction(id, type);
};

/*
    revertFunction()

    Move a function `id` from identifiers back into the untypedFunctions
        table.
*/
FunctionScope.prototype.revertFunction = function revertFunction(id, token) {
    if (this.identifiers[id]) {
        this.identifiers[id] = null;
        this.untypedFunctions[id] = token;
        return;
    }

    this.parent.revertFunction(id, token);
};

FunctionScope.prototype.getPrototypeFields =
function getPrototypeFields() {
    var parent = this.parent;
    while (parent.type === 'function') {
        parent = parent.parent;
    }

    var p = parent.prototypes[this.funcName];
    if (!p) {
        return null;
    }

    return p.fields;
};

FunctionScope.prototype.addKnownField =
function addKnownField(fieldName) {
    if (this.knownFields.indexOf(fieldName) === -1) {
        this.knownFields.push(fieldName);
    }
};

FunctionScope.prototype.markReturnType =
function markReturnType(defn, node) {
    this.knownReturnTypes.push(defn);
    this.returnStatementASTNodes.push(node);
};

FunctionScope.prototype.getFunctionScope =
function getFunctionScope() {
    return this;
};

FunctionScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    this._addFunctionScope(funcScope);
};

FunctionScope.prototype.revertFunctionScope =
function revertFunctionScope(name, funcType) {
    if (!this.functionScopes[name]) {
        return this.parent.revertFunctionScope(name, funcType);
    }

    this._revertFunctionScope(name, funcType);
};

FunctionScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    this._addFunctionOverloadScope(funcScope);
};

FunctionScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.functionScopes[funcName] ||
        this.parent.getKnownFunctionScope(funcName);
};

FunctionScope.prototype.restrictType =
function restrictType(name, type) {
    return this._restrictType(name, type);
};

function BranchScope(parent) {
    BaseScope.call(this, parent);
    this.type = 'branch';

    this._restrictedThisValueType = null;
    this._narrowedThisValueType = null;
    this.narrowedTypes = Object.create(null);
}
util.inherits(BranchScope, BaseScope);

BranchScope.prototype.getThisType =
function getThisType(isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this.parent.getThisType(true);
    }

    return this._restrictedThisValueType ||
        this._narrowedThisValueType || this.parent.getThisType();
};

BranchScope.prototype.getReturnValueType =
function getReturnValueType() {
    return this.parent.getReturnValueType();
};

BranchScope.prototype.getFunctionScope =
function getFunctionScope() {
    var parent = this.parent;
    while (parent && parent.type !== 'function') {
        parent = parent.parent;
    }

    return parent;
};

BranchScope.prototype.getVar = function getVar(id, isWritable) {
    // console.log('getVar(', id, ',', this.writableTokenLookup, ')');
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id] || this.parent.getVar(id, true);
    }

    return this.typeRestrictions[id] || this.narrowedTypes[id] ||
        this.identifiers[id] || this.parent.getVar(id, isWritable);
};

BranchScope.prototype.getOwnVar = function getOwnVar(id, isWritable) {
    if (isWritable || this.writableTokenLookup) {
        return this.identifiers[id];
    }

    return this.typeRestrictions[id] || this.narrowedTypes[id] ||
        this.identifiers[id];
};

BranchScope.prototype.getUntypedFunction =
function getUntypedFunction(id) {
    return this.parent.getUntypedFunction(id);
};

BranchScope.prototype.addFunctionScope =
function addFunctionScope(funcScope) {
    return this.parent.addFunctionScope(funcScope);
};

BranchScope.prototype.addFunctionOverloadScope =
function addFunctionOverloadScope(funcScope) {
    return this.parent.addFunctionOverloadScope(funcScope);
};

BranchScope.prototype.updateFunction =
function updateFunction(id, defn) {
    return this.parent.updateFunction(id, defn);
};

BranchScope.prototype.revertFunction =
function revertFunction(id, token) {
    return this.parent.revertFunction(id, token);
};

BranchScope.prototype.getRestrictedTypes =
function getRestrictedTypes() {
    var restricted = Object.keys(this.typeRestrictions);
    var narrowed = Object.keys(this.narrowedTypes);

    for (var i = 0; i < narrowed.length; i++) {
        if (restricted.indexOf(narrowed[i]) === -1) {
            restricted.push(narrowed[i]);
        }
    }

    return restricted;
};

BranchScope.prototype.getRestrictedThisType =
function getRestrictedThisType() {
    return this._restrictedThisValueType ||
        this._narrowedThisValueType;
};

BranchScope.prototype.narrowType = function narrowType(id, type) {
    // TODO: gaurd against double narrow ?
    // assert(!this.narrowedTypes[id], 'cannot doulbe narrow type: ' + id);
    assert(type, 'cannot restrict to null');

    if (id === 'this') {
        this._narrowedThisValueType = type;
        return null;
    }

    var token = {
        type: 'narrowedType',
        defn: type
    };
    this.narrowedTypes[id] = token;
    return token;
};

BranchScope.prototype.restrictType = function restrictType(id, type) {
    return this._restrictType(id, type);
};

BranchScope.prototype.enterReturnStatement =
function enterReturnStatement(type) {
    return this.parent.enterReturnStatement(type);
};

BranchScope.prototype.getReturnExpressionType =
function getReturnExpressionType() {
    return this.parent.getReturnExpressionType();
};

BranchScope.prototype.exitReturnStatement =
function exitReturnStatement() {
    this.parent.exitReturnStatement();
};

BranchScope.prototype.getKnownFunctionScope =
function getKnownFunctionScope(funcName) {
    return this.parent.getKnownFunctionScope(funcName);
};

/*
    This permanently mutates the read-only and write-only
    state of a variable.

    When this is applied it must be applied up the chain if
    necessary as it changes the type inside and outside a scope

    However, if the type of the variable currently is
    Null%%Default or Void%%Uninitialized then only locally
    mark it as a new identifier
*/
BranchScope.prototype.forceUpdateVar =
function forceUpdateVar(id, typeDefn) {
    var currentType = this.getVar(id, true);
    var token;

    if (currentType && currentType.defn &&
        currentType.defn.type === 'typeLiteral' &&
        (
            currentType.defn.name === '%Null%%Default' ||
            currentType.defn.name === '%Void%%Uninitialized'
        )
    ) {
        assert(typeDefn, 'cannot force update to null');

        return this.restrictType(id, typeDefn);
    }

    if (!this.identifiers[id] && this.parent) {
        return this.parent.forceUpdateVar(id, typeDefn);
    }

    assert(this.identifiers[id], 'identifier must already exist');
    assert(typeDefn, 'cannot force update to null');

    token = new IdentifierToken(typeDefn, false);
    this.identifiers[id] = token;
    return token;
};

},{"../ast/":10,"./lib/is-same-type.js":77,"assert":24,"util":29}],86:[function(require,module,exports){
'use strict';

var assert = require('assert');

var JsigAST = require('../ast/');
var Errors = require('./errors.js');
var serialize = require('../serialize.js');
var isSameType = require('./lib/is-same-type.js');
var computeSmallestUnion = require('./lib/compute-smallest-union.js');

module.exports = SubTypeChecker;

function SubTypeChecker(meta, node) {
    assert(node && node.type, 'ast node must have type');

    this.meta = meta;
    this.node = node;

    this.stack = [];

    this.leftSeen = [];
    this.rightSeen = [];
}

// TODO: pretty sure this function is needed...
// function getUnionWithoutOptional(unionType) {
//     var newType = null;

//     var newUnions = [];
//     for (var i = 0; i < unionType.unions.length; i++) {
//         var innerType = unionType.unions[i];
//         if (innerType.type === 'valueLiteral' &&
//             innerType.name === 'undefined'
//         ) {
//             continue;
//         }

//         newUnions.push(innerType);
//     }

//     if (newUnions.length === 1) {
//         newType = newUnions[0];
//     } else {
//         newType = cloneJSIG(unionType);
//         newType.unions = newUnions;
//     }

//     return newType;
// }

SubTypeChecker.prototype.checkSubType =
function checkSubType(parent, child, labelName) {
    assert(parent && parent.type, 'parent must have a type');
    assert(child && child.type, 'child must have a type');
    assert(labelName, 'labelName is mandatory');

    var result;
    this.stack.push(labelName);

    if (parent.type === 'typeLiteral' && !parent.builtin &&
        !parent.isGeneric
    ) {
        assert(false,
            'parent cannot be non-builtin type literal: ' + parent.name);
    }
    if (child.type === 'typeLiteral' && !child.builtin &&
        !child.isGeneric
    ) {
        assert(false,
            'child cannot be non-builtin type literal: ' + child.name);
    }

    // Avoid cycles
    var pIndex = this.leftSeen.indexOf(parent);
    if (pIndex !== -1) {
        var cIndex = this.rightSeen.indexOf(child);
        if (pIndex === cIndex) {
            this.stack.pop();
            return null;
        }
    }

    this.leftSeen.push(parent);
    this.rightSeen.push(child);

    // console.log('checkSubType(' + parent.type + ',' + child.type + ')');
    // console.log('parent: ' + this.meta.serializeType(parent));
    // console.log('child: ' + this.meta.serializeType(child));

    result = this._checkSubType(parent, child);
    assert(typeof result !== 'boolean', 'must return error or null');
    this.stack.pop();
    return result;
};

SubTypeChecker.prototype._checkSubType =
function _checkSubType(parent, child) {
    var result;

    if (parent.type !== 'unionType' && child.type === 'unionType') {
        /* handle assigning union into parent */

        // TODO: better error message?
        for (var i = 0; i < child.unions.length; i++) {
            result = this._checkSubType(parent, child.unions[i]);
            if (result) {
                return result;
            }
        }

        return null;
    }

    if (parent === child) {
        result = null;
    } else if (parent.type === 'typeLiteral') {
        result = this.checkTypeLiteralSubType(parent, child);
    } else if (parent.type === 'genericLiteral') {
        result = this.checkGenericLiteralSubType(parent, child);
    } else if (parent.type === 'function') {
        result = this.checkFunctionSubType(parent, child);
    } else if (parent.type === 'object') {
        result = this.checkObjectSubType(parent, child);
    } else if (parent.type === 'valueLiteral') {
        result = this.checkValueLiteralSubType(parent, child);
    } else if (parent.type === 'unionType') {
        result = this.checkUnionSubType(parent, child);
    } else if (parent.type === 'freeLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    } else if (parent.type === 'intersectionType') {
        return this.checkIntersectionSubType(parent, child);
    } else if (parent.type === 'tuple') {
        return this.checkTupleSubType(parent, child);
    } else {
        throw new Error('not implemented sub type: ' + parent.type);
    }

    return result;
};

SubTypeChecker.prototype._checkSpecialTypeLiteralSubType =
function _checkSpecialTypeLiteralSubType(parent, child) {
    if (parent.name === '%Export%%ModuleExports') {
        return null;
    } else if (parent.name === '%Boolean%%Mixed') {
        return null;
    } else if (parent.name === '%Mixed%%UnknownExportsField') {
        return null;
    } else if (parent.name === '%Void%%UnknownReturn') {
        return null;
    } else if (parent.name === 'Function' && child.type === 'function') {
        return null;
    } else if (parent.name === 'Object' && child.type === 'object') {
        return null;
    }

    if (parent.name === 'Function' && child.type === 'intersectionType') {
        var types = child.intersections;
        for (var i = 0; i < types.length; i++) {
            if (types[i].type === 'function') {
                return null;
            }
        }
    }
};

/*eslint complexity: [2, 30]*/
SubTypeChecker.prototype.checkTypeLiteralSubType =
function checkTypeLiteralSubType(parent, child) {
    if (!parent.builtin && !parent.isGeneric) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.isGeneric) {
        if (!child.isGeneric) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        if (parent.name !== child.name) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        if (parent.genericIdentifierUUID !==
            child.genericIdentifierUUID
        ) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        return null;
    }

    if (this._checkSpecialTypeLiteralSubType(parent, child) === null) {
        return null;
    }

    if (parent.name === 'String' && parent.builtin &&
        child.type === 'valueLiteral' && child.name === 'string'
    ) {
        return null;
    }

    if (parent.name === 'Boolean' && parent.builtin &&
        child.type === 'valueLiteral' && child.name === 'boolean'
    ) {
        return null;
    }

    if (child.type !== 'typeLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var name = parent.name;
    if (name === 'Object') {
        // TODO: model that Error inherits from Object
        if (child.name !== name && child.name !== 'Error') {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }
    } else if (child.name !== name) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    } else if (child.name === name) {
        return null;
    } else {
        throw new Error('NotImplemented: ' + parent.name);
    }
};

SubTypeChecker.prototype._maybeConvertToValueLiteral =
function _maybeConvertToValueLiteral(childType) {
    if (childType.type === 'typeLiteral' &&
        childType.builtin && childType.name === 'String' &&
        typeof childType.concreteValue === 'string'
    ) {
        return JsigAST.value(
            '"' + childType.concreteValue + '"', 'string'
        );
    }
    return childType;
};

SubTypeChecker.prototype.checkValueLiteralSubType =
function checkValueLiteralSubType(parent, child) {
    if (parent.name === 'null' && child.type === 'typeLiteral' &&
        child.builtin && child.name === '%Null%%Default'
    ) {
        return null;
    }

    if (child.type === 'typeLiteral') {
        child = this._maybeConvertToValueLiteral(child);
    }

    if (child.type !== 'valueLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var name = parent.name;
    if (name === 'null') {
        if (child.name !== name) {
            return new Error('[Internal] Not null');
        }
    } else if (name === 'undefined') {
        if (child.name !== name) {
            return new Error('[Internal] Not undefined');
        }
    } else if (name === 'string') {
        if (child.name !== 'string') {
            return new Error('[Internal] Not a string');
        }

        var childValue = child.value.replace(/\'/g, '"');
        var parentValue = parent.value.replace(/\'/g, '"');

        if (childValue !== parentValue) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }
    } else {
        // console.log('valueLiteral?', {
        //     p: parent,
        //     c: child
        // });
        throw new Error('NotImplemented: ' + parent.type);
    }
};

SubTypeChecker.prototype.checkGenericLiteralSubType =
function checkGenericLiteralSubType(parent, child) {
    if (parent.value.name === 'Array' &&
        parent.value.builtin &&
        child.type === 'typeLiteral' &&
        child.name === '%Array%%Empty'
    ) {
        return null;
    }

    if (parent.value.name === 'Object' &&
        parent.value.builtin &&
        child.type === 'typeLiteral' &&
        child.name === '%Object%%Empty'
    ) {
        return null;
    }

    var err;
    if (parent.value.name === 'Object' &&
        parent.value.builtin &&
        child.type === 'object' &&
        parent.generics[0].name === 'String' &&
        parent.generics[0].builtin
    ) {
        var valueType = parent.generics[1];

        for (var i = 0; i < child.keyValues.length; i++) {
            var pair = child.keyValues[i];

            err = this.checkSubType(
                valueType, pair.value, 'keyValue.' + pair.key
            );
            if (err) {
                return err;
            }
        }

        return null;
    }

    if (child.type !== 'genericLiteral') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var isSame = isSameType(parent.value, child.value);
    if (!isSame) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.generics.length !== child.generics.length) {
        throw new Error('generics mismatch');
    }

    var parentName = parent.value.name;

    for (i = 0; i < parent.generics.length; i++) {
        var len = parent.generics.length;
        var err1 = this.checkSubType(
            parent.generics[i], child.generics[i],
            'generics.' + parentName + '.' + i + ',' + len
        );

        if (err1) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        var err2 = this.checkSubType(
            child.generics[i], parent.generics[i],
            'generics.' + parentName + '.' + i + ',' + len
        );

        if (err2) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }
    }

    return null;
};

SubTypeChecker.prototype.checkFunctionSubType =
function checkFunctionSubType(parent, child) {
    if (child.type !== 'function') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var err = this.checkSubType(
        parent.result, child.result, 'function.result'
    );
    if (err) {
        return err;
    }

    if (parent.thisArg) {
        if (!child.thisArg) {
            return this._reportTypeMisMatch(parent, child, 'terminal');
        }

        assert(!parent.thisArg.optional, 'do not support optional thisArg');
        assert(!child.thisArg.optional, 'do not support optional thisArg');

        err = this.checkSubType(
            parent.thisArg.value, child.thisArg.value, 'function.thisArg'
        );
        if (err) {
            return err;
        }
    }

    if (parent.args.length !== child.args.length) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var len = parent.args.length;
    for (var i = 0; i < parent.args.length; i++) {
        /* function args must be the same type, aka invariant */
        var isSame = isSameType(parent.args[i].value, child.args[i].value) &&
            parent.args[i].optional === child.args[i].optional;

        if (!isSame) {
            return this._reportTypeMisMatch(
                parent.args[i], child.args[i],
                'function.args.' + i + ',' + len
            );
        }
    }

    return null;
};

SubTypeChecker.prototype.checkTupleSubType =
function checkTupleSubType(parent, child) {
    if (child.type !== 'tuple') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    if (parent.values.length !== child.values.length) {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var len = parent.values.length;
    for (var i = 0; i < parent.values.length; i++) {
        var isSame = isSameType(parent.values[i], child.values[i]);

        if (!isSame) {
            return this._reportTypeMisMatch(
                parent.values[i], child.values[i],
                'tuple.values.' + i + ',' + len
            );
        }
    }

    return null;
};

SubTypeChecker.prototype.checkObjectSubType =
function checkObjectSubType(parent, child) {
    if (child.type !== 'object' && child.type !== 'intersectionType') {
        return this._reportTypeMisMatch(parent, child, 'terminal');
    }

    var minimumFields = 0;
    for (var i = 0; i < parent.keyValues.length; i++) {
        if (!parent.keyValues[i].optional) {
            minimumFields++;
        }
    }

    var childFieldCount = null;
    if (child.type === 'object') {
        childFieldCount = child.keyValues.length;
    } else if (child.type === 'intersectionType') {
        childFieldCount = 0;
        for (i = 0; i < child.intersections.length; i++) {
            var maybeObj = child.intersections[i];
            if (maybeObj.type === 'object') {
                childFieldCount += maybeObj.keyValues.length;
            }
        }
    }

    // If parent has optional keys, then child must have
    // somewhere between "required keys" and "all keys"
    // TODO: extra safety for objects with extra fields
    if (childFieldCount < minimumFields) {
        return Errors.IncorrectFieldCount({
            expected: serialize(parent._raw || parent),
            expectedFields: parent.keyValues.length,
            actual: serialize(child._raw || child),
            actualFields: childFieldCount,
            loc: this.node.loc,
            line: this.node.loc.start.line
        });
    }

    var err;
    var childIndex = child.buildObjectIndex();
    for (i = 0; i < parent.keyValues.length; i++) {
        // TODO: check key names...
        var pair = parent.keyValues[i];

        var childType = childIndex[pair.key];
        if (!childType && pair.optional) {
            continue;
        }

        if (!childType) {
            return Errors.MissingExpectedField({
                expected: serialize(parent._raw || parent),
                actual: serialize(child._raw || child),
                expectedName: pair.key,
                loc: this.node.loc,
                line: this.node.loc.start.line
            });
        }

        var pValue = pair.value;
        // Allow undefined value for child if parent is optional field
        if (pair.optional) {
            pValue = computeSmallestUnion(
                this.node, JsigAST.value('undefined'), pValue
            );
        }

        err = this.checkSubType(pValue, childType, 'keyValue.' + pair.key);
        if (err) {
            return err;
        }
    }

    if (child.inferred) {
        var parentIndex = parent.buildObjectIndex();
        for (i = 0; i < child.keyValues.length; i++) {
            pair = child.keyValues[i];

            var fieldName = pair.key;

            if (!parentIndex[fieldName]) {
                return Errors.UnexpectedExtraField({
                    expected: serialize(parent._raw || parent),
                    actual: serialize(child._raw || child),
                    fieldName: fieldName,
                    loc: this.node.loc,
                    line: this.node.loc.start.line
                });
            }
        }
    }

    // For all extra keys, they are allowed...
    return null;
};

SubTypeChecker.prototype.checkUnionSubType =
function checkUnionSubType(parent, child) {
    // Check to see that child matches ONE of parent.

    var childUnions = child.type === 'unionType' ? child.unions : [child];

    var err;
    var possibleErrors = [];
    var errors = [];
    for (var j = 0; j < childUnions.length; j++) {
        var isBad = true;

        for (var i = 0; i < parent.unions.length; i++) {
            var len = parent.unions.length;
            err = this.checkSubType(
                parent.unions[i], childUnions[j],
                'unionType.' + i + ',' + len
            );
            if (!err) {
                isBad = false;
            } else {
                possibleErrors.push(err);
            }
        }

        if (isBad) {
            for (var k = 0; k < possibleErrors.length; k++) {
                errors.push(possibleErrors[k]);
            }
        }
    }

    if (!isBad) {
        return null;
    }

    var finalErr = Errors.UnionTypeClassMismatch({
        expected: serialize(parent._raw || parent),
        actual: serialize(child._raw || child),
        _parent: parent,
        _child: child,
        loc: this.node.loc,
        line: this.node.loc.start.line
    });

    finalErr.originalErrors = errors;
    return finalErr;
};

SubTypeChecker.prototype.checkIntersectionSubType =
function checkIntersectionSubType(parent, child) {
    /* TODO: pretty errors & branchType */

    var isObject = true;
    for (var i = 0; i < parent.intersections.length; i++) {
        if (parent.intersections[i].type !== 'object') {
            isObject = false;
        }
    }

    // If all intersections are objects then treat as object.
    if (isObject) {
        var keyValues = [];
        for (i = 0; i < parent.intersections.length; i++) {
            var currObj = parent.intersections[i];
            for (var j = 0; j < currObj.keyValues.length; j++) {
                keyValues.push(currObj.keyValues[j]);
            }
        }

        var parentObj = JsigAST.object(keyValues, null);
        return this.checkSubType(parentObj, child, 'skip');
    }

    // TODO: what if child is intersectionType
    var childTypes = child.type === 'intersectionType' ?
        child.intersections : [child];

    var allTypes = parent.intersections;
    for (i = 0; i < allTypes.length; i++) {
        var currType = allTypes[i];
        var err = null;
        var isGood = false;

        var len = allTypes.length;
        for (j = 0; j < childTypes.length; j++) {
            var error = this.checkSubType(
                currType, childTypes[j],
                'intersectionType.' + i + ',' + len
            );
            if (!error) {
                isGood = true;
            } else {
                err = error;
            }
        }

        if (!isGood) {
            return err;
        }

        // var err = this.checkSubType(currType, child);
        // if (err) {
        //     return err;
        // }
    }

    return null;
};

SubTypeChecker.prototype._reportTypeMisMatch =
function _reportTypeMisMatch(parent, child, labelName) {
    assert(labelName, 'labelName is mandatory');

    this.stack.push(labelName);
    var err = this._buildTypeClassError(parent, child);
    this.stack.pop();

    return err;
};

SubTypeChecker.prototype._buildKeyPathType =
function _buildKeyPathType(finalValue) {
    var stack = this.stack;
    var currentType = finalValue;

    for (var i = stack.length - 1; i >= 0; i--) {
        var item = stack[i];
        var range;
        var list;

        // intersectionType

        if (item === 'root' || item === 'terminal' || item === 'skip') {
            continue;
        } else if (item.indexOf('keyValue') === 0) {
            var keyName = item.slice(9);

            currentType = JsigAST.object([
                JsigAST.keyValue(keyName, currentType)
            ]);
        } else if (item.indexOf('unionType') === 0) {
            range = item.slice(10);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.union(list);
        } else if (item.indexOf('intersectionType') === 0) {
            range = item.slice(17);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.intersection(list);
        } else if (item.indexOf('generics') === 0) {
            var segments = item.split('.');
            assert(segments.length === 3, 'expected three parts: ' + item);
            var parentName = segments[1];
            range = segments[2];
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.generic(
                JsigAST.literal(parentName), list
            );
        } else if (item.indexOf('function.args') === 0) {
            range = item.slice(14);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.functionType({
                args: list,
                result: JsigAST.literal('_', true)
            });
        } else if (item.indexOf('tuple.values') === 0) {
            range = item.slice(13);
            list = this._buildListFromRange(range, currentType);

            currentType = JsigAST.tuple(list);
        } else if (item === 'function.result') {
            currentType = JsigAST.functionType({
                args: [JsigAST.literal('...', true)],
                result: currentType
            });
        } else if (item === 'function.thisArg') {
            currentType = JsigAST.functionType({
                args: [JsigAST.literal('...', true)],
                thisArg: JsigAST.keyValue('this', currentType),
                result: JsigAST.literal('_', true)
            });
        } else {
            assert(false, 'unexpected item in keyPath stack: ' + item);
        }
    }

    return currentType;
};

SubTypeChecker.prototype._buildListFromRange =
function _buildListFromRange(range, valueType) {
    var arr = [];

    var parts = range.split(',');
    assert(parts.length === 2, 'expected two parts for: ' + range);

    var index = parseInt(parts[0], 10);
    var length = parseInt(parts[1], 10);

    for (var i = 0; i < length; i++) {
        if (i === index) {
            arr[i] = valueType;
        } else {
            arr[i] = JsigAST.literal('_', true);
        }
    }

    return arr;
};

SubTypeChecker.prototype._buildTypeClassError =
function _buildTypeClassError(parent, child) {
    var expected = serialize(
        this._buildKeyPathType(parent._raw || parent)
    );
    var actual = serialize(
        this._buildKeyPathType(child._raw || child)
    );

    // console.log('stack', this.stack);

    var err = Errors.TypeClassMismatch({
        expected: expected,
        actual: actual,
        _parent: parent,
        _child: child,
        loc: this.node.loc,
        line: this.node.loc.start.line
    });

    return err;
};

},{"../ast/":10,"../serialize.js":67,"./errors.js":69,"./lib/compute-smallest-union.js":73,"./lib/is-same-type.js":77,"assert":24}],87:[function(require,module,exports){
'use strict';

var assert = require('assert');

var JsigAST = require('../ast/');
var isSameType = require('./lib/is-same-type.js');
var deepCloneJSIG = require('./lib/deep-clone-ast.js');

module.exports = TypeInference;

function TypeInference(meta) {
    this.meta = meta;
}

TypeInference.prototype.inferType = function inferType(node) {
    if (node.type === 'CallExpression') {
        return this.inferCallExpression(node);
    } else if (node.type === 'Literal') {
        return this.inferLiteral(node);
    } else if (node.type === 'ArrayExpression') {
        return this.inferArrayExpression(node);
    } else if (node.type === 'ObjectExpression') {
        return this.inferObjectExpression(node);
    } else {
        throw new Error('!! skipping inferType: ' + node.type);
    }
};

TypeInference.prototype.inferCallExpression =
function inferCallExpression(node) {
    var untypedFunc = this.meta.currentScope
        .getUntypedFunction(node.callee.name);
    if (!untypedFunc) {
        return null;
    }

    var args = node.arguments;

    var argTypes = [];
    for (var i = 0; i < args.length; i++) {
        var funcArg = this.meta.verifyNode(args[i], null);
        if (!funcArg) {
            return null;
        }

        argTypes.push(JsigAST.param(null, funcArg));
    }

    var returnType = JsigAST.literal('%Void%%UnknownReturn', true);
    if (this.meta.currentExpressionType &&
        this.meta.currentExpressionType.name !== '%Null%%Default' &&
        this.meta.currentExpressionType.name !== '%Void%%Uninitialized'
    ) {
        returnType = this.meta.currentExpressionType;
    }

    // if (this.meta.currentScope.getAssignmentType()) {
        // returnType = this.meta.currentScope.getAssignmentType();
    // } else if (this.meta.currentScope.getReturnExpressionType()) {
        // returnType = this.meta.currentScope.getReturnExpressionType();
    // }

    // TODO: infer this arg based on method calls
    var funcType = JsigAST.functionType({
        args: argTypes,
        result: returnType,
        thisArg: null
    });

    // TODO: We should see if this function actually
    // has a smaller return type. Aka given some inferred type
    // () => X, does the function actually return Y, Y <: X.
    // In which case we should mark this type as () => Y.
    if (!this.meta.tryUpdateFunction(node.callee.name, funcType)) {
        return null;
    }

    if (returnType.builtin && returnType.name === '%Void%%UnknownReturn') {
        // Grab the scope for the known function
        var funcScopes = this.meta.currentScope.getKnownFunctionScope(
            node.callee.name
        ).funcScopes;

        assert(funcScopes.length === 1,
            'cannot infer call return for overloaded function'
        );
        var funcScope = funcScopes[0];

        if (funcScope.knownReturnTypes.length > 0) {
            var uniqueKnownReturnTypes = getUniqueTypes(
                funcScope.knownReturnTypes
            );

            // TODO: grab the smallest union?
            assert(uniqueKnownReturnTypes.length === 1,
                'only support trivial single return funcs');
            funcType.result = uniqueKnownReturnTypes[0];
        }
    }

    return funcType;
};

function getUniqueTypes(types) {
    var newTypes = [];

    for (var i = 0; i < types.length; i++) {
        var found = false;
        for (var j = 0; j < newTypes.length; j++) {
            if (isSameType(newTypes[j], types[i])) {
                found = true;
                break;
            }
        }

        if (!found) {
            newTypes.push(types[i]);
        }
    }

    return newTypes;
}

TypeInference.prototype.inferLiteral =
function inferLiteral(node) {
    var value = node.value;

    if (typeof value === 'string') {
        return JsigAST.literal('String', true, {
            concreteValue: value
        });
    } else if (typeof value === 'number') {
        return JsigAST.literal('Number', true, {
            concreteValue: parseFloat(value, 10)
        });
    } else if (value === null) {
        return JsigAST.value('null');
    } else if (Object.prototype.toString.call(value) === '[object RegExp]') {
        return JsigAST.literal('RegExp');
    } else if (typeof value === 'boolean') {
        return JsigAST.literal('Boolean', true, {
            concreteValue: value === true ? 'true' : 'false'
        });
    } else {
        throw new Error('not recognised literal');
    }
};

function isTypeTuple(jsigType) {
    return jsigType && jsigType.type === 'tuple';
}

function isTypeArray(jsigType) {
    return jsigType && jsigType.type === 'genericLiteral' &&
        jsigType.value.type === 'typeLiteral' &&
        jsigType.value.name === 'Array' &&
        jsigType.value.builtin;
}

TypeInference.prototype.inferArrayExpression =
function inferArrayExpression(node) {
    var elems = node.elements;

    if (elems.length === 0) {
        var currExprType = this.meta.currentExpressionType;
        if (currExprType && currExprType.type === 'genericLiteral' &&
            currExprType.value.type === 'typeLiteral' &&
            currExprType.value.builtin && currExprType.value.name === 'Array'
        ) {
            return currExprType;
        }

        return JsigAST.generic(
            JsigAST.literal('Array'),
            [JsigAST.freeLiteral('T')]
        );
    }

    var currExpr = this.meta.currentExpressionType;
    if (isTypeTuple(currExpr)) {
        return this._inferTupleExpression(node);
    }

    if (isTypeArray(currExpr)) {
        return this._inferArrayExpression(node);
    }

    var i = 0;

    if (currExpr && currExpr.type === 'unionType') {
        var unions = currExpr.unions;
        for (i = 0; i < unions.length; i++) {
            var possibleType = unions[i];
            if (isTypeTuple(possibleType)) {
                return this._inferTupleExpression(node);
            }

            if (isTypeArray(possibleType)) {
                return this._inferArrayExpression(node);
            }
        }
    }

    var values = [];

    for (i = 0; i < elems.length; i++) {
        if (elems[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                elems[i].name, null
            );
        }

        var newType = this.meta.verifyNode(elems[i], null);
        if (!newType) {
            return null;
        }

        values[i] = newType;
    }

    return JsigAST.tuple(values, null, {
        inferred: true
    });
};

TypeInference.prototype._inferArrayExpression =
function _inferArrayExpression(node) {
    var i = 0;
    var currExpr = this.meta.currentExpressionType;
    if (currExpr.type === 'unionType') {
        for (i = 0; i < currExpr.unions.length; i++) {
            var possibleType = currExpr.unions[i];
            if (isTypeArray(possibleType)) {
                currExpr = possibleType;
                break;
            }
        }
    }

    assert(isTypeArray(currExpr), 'must be an array...');

    var arrayType = currExpr.generics[0];
    var elems = node.elements;

    var type = null;
    for (i = 0; i < elems.length; i++) {
        if (elems[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                elems[i].name, null
            );
        }

        var newType = this.meta.verifyNode(elems[i], arrayType);

        if (type && newType) {
            if (!isSameType(newType, type)) {
                assert(false, 'arrays must be homogenous');
            }
        }

        if (newType) {
            type = newType;
        }
    }

    if (!type) {
        return null;
    }

    return JsigAST.generic(JsigAST.literal('Array'), [type]);
};

TypeInference.prototype._inferTupleExpression =
function _inferTupleExpression(node) {
    var values = [];
    var i = 0;
    var currExpr = this.meta.currentExpressionType;
    if (currExpr.type === 'unionType') {
        for (i = 0; i < currExpr.unions.length; i++) {
            var possibleType = currExpr.unions[i];
            if (isTypeTuple(possibleType)) {
                currExpr = possibleType;
                break;
            }
        }
    }

    assert(isTypeTuple(currExpr), 'must be a tuple...');

    var tupleTypes = currExpr.values;
    for (i = 0; i < node.elements.length; i++) {
        var expected = tupleTypes[i] || null;

        if (node.elements[i].type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                node.elements[i].name, null
            );
        }

        values[i] = this.meta.verifyNode(node.elements[i], expected);
        if (!values[i]) {
            return null;
        }
    }

    return JsigAST.tuple(values);
};

TypeInference.prototype.inferObjectExpression =
function inferObjectExpression(node) {
    var properties = node.properties;

    if (properties.length === 0) {
        var openObj = JsigAST.object([]);
        openObj.open = true;
        return openObj;
    }

    var currentExpressionType = this.meta.currentExpressionType;
    if (currentExpressionType &&
        currentExpressionType.name === '%Export%%ModuleExports' &&
        this.meta.hasExportDefined()
    ) {
        currentExpressionType = this.meta.getModuleExportsType();
    }

    var index = null;
    if (currentExpressionType && currentExpressionType.type === 'object') {
        index = currentExpressionType.buildObjectIndex();
    }

    var keyValues = [];
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        assert(prop.kind === 'init', 'only support init kind');

        var keyName = null;
        if (prop.key.type === 'Identifier') {
            keyName = prop.key.name;
        } else if (prop.key.type === 'Literal') {
            keyName = prop.key.value;
        }

        var expectedType = null;
        if (keyName && index && index[keyName]) {
            expectedType = index[keyName];
        }

        // If this object literal is assigned to module.exports
        // And we are in partial export mode and we do not know the
        // type of the field, then skip this field on the export
        if (this.meta.currentExpressionType &&
            this.meta.currentExpressionType.name === '%Export%%ModuleExports' &&
            this.meta.checkerRules.partialExport &&
            !expectedType
        ) {
            continue;
        }

        if (prop.value.type === 'Identifier') {
            this.meta.currentScope.markVarAsAlias(
                prop.value.name, null
            );
        }

        var value = this.meta.verifyNode(prop.value, expectedType);
        if (!value) {
            return null;
        }

        keyValues.push(JsigAST.keyValue(keyName, value));
    }

    return JsigAST.object(keyValues, null, {
        inferred: true
    });
};

TypeInference.prototype.resolveGeneric =
function resolveGeneric(funcType, node, currentExpressionType) {
    /*
        CallExpression : {
            callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier' }
            },
            arguments: Array<X>
        }

        NewExpression : {
            callee: { type: 'Identifier' },
            arguments: Array<X>
        }
    */

    var copyFunc = deepCloneJSIG(funcType);
    copyFunc._raw = null;

    var knownGenericTypes = this._findGenericTypes(
        copyFunc, node, currentExpressionType
    );
    if (!knownGenericTypes) {
        return null;
    }

    for (var i = 0; i < copyFunc.generics.length; i++) {
        var g = copyFunc.generics[i];
        var newType = knownGenericTypes[g.name];
        assert(newType, 'newType must exist');

        var stack = g.location.slice();

        var obj = copyFunc;
        for (var j = 0; j < stack.length - 1; j++) {
            obj = obj[stack[j]];
            obj._raw = null;
        }

        var lastProp = stack[stack.length - 1];
        obj[lastProp] = newType;
    }

    return copyFunc;
};

/*eslint complexity: [2, 25], max-statements: [2, 60] */
TypeInference.prototype._findGenericTypes =
function _findGenericTypes(copyFunc, node, currentExpressionType) {
    var knownGenericTypes = Object.create(null);

    for (var i = 0; i < copyFunc.generics.length; i++) {
        var g = copyFunc.generics[i];

        var newType;
        var referenceNode;
        var stack = g.location;
        var ast = walkProps(copyFunc, stack, 0);

        if (stack[0] === 'args') {
            referenceNode = node.arguments[stack[1]];
            if (!referenceNode) {
                return null;
            }

            newType = this.meta.verifyNode(referenceNode, null);
            if (!newType) {
                return null;
            }

            newType = walkProps(newType, stack, 3);
        } else if (stack[0] === 'thisArg') {

            // Method call()
            if (node.callee.type === 'MemberExpression') {
                referenceNode = node.callee.object;
                // TODO: this might be wrong
                newType = this.meta.verifyNode(referenceNode, null);
                if (!newType) {
                    return null;
                }

                newType = walkProps(newType, stack, 2);
            // new expression
            } else if (node.callee.type === 'Identifier') {
                if (currentExpressionType) {
                    newType = currentExpressionType;
                    newType = walkProps(newType, stack, 2);
                } else {
                    // If we have no ctx as for type then free literal
                    newType = JsigAST.freeLiteral('T');
                }
            } else {
                assert(false, 'unknown caller type: ' + node.callee.type);
            }
        } else {
            referenceNode = node;
            newType = knownGenericTypes[ast.name];
            assert(newType, 'newType must exist in fallback');
        }

        if (!newType) {
            return null;
        }

        if (knownGenericTypes[ast.name]) {
            var oldType = knownGenericTypes[ast.name];

            var subTypeError;
            if (newType.type === 'freeLiteral') {
                subTypeError = null;
            } else {
                subTypeError = this.meta.checkSubTypeRaw(
                    referenceNode, oldType, newType
                );
            }

            if (subTypeError) {
                // A free variable fits in any type.
                var isSub = oldType.type === 'freeLiteral';
                if (!isSub) {
                    isSub = this.meta.isSubType(
                        referenceNode, newType, oldType
                    );
                }
                if (isSub) {
                    knownGenericTypes[ast.name] = newType;
                    subTypeError = null;
                }
            }

            if (subTypeError) {
                this.meta.addError(subTypeError);
                return null;
                // TODO: bug and shit
                // assert(false, 'could not resolve generics');
            }
        } else {
            knownGenericTypes[ast.name] = newType;
        }
    }

    return knownGenericTypes;
};

function walkProps(object, stack, start) {
    for (var i = start; i < stack.length; i++) {
        if (!object) {
            return null;
        }

        object = object[stack[i]];
    }
    return object;
}

},{"../ast/":10,"./lib/deep-clone-ast.js":74,"./lib/is-same-type.js":77,"assert":24}],88:[function(require,module,exports){
(function (global){
'use strict';

var CodeMirror = require('codemirror');
var TermColor = require('term-color');

require('codemirror/mode/javascript/javascript.js');
require('codemirror/mode/haskell/haskell.js');

var compileJSIG = require('../type-checker/').compile;
var OPERATORS_PATH = '/type-checker/builtin-definitions/operators.hjs';
var ES5_PATH = '/type-checker/builtin-definitions/es5.hjs';

var document = global.document;
var atob = global.atob;
var btoa = global.btoa;
var location = global.location;

/*eslint no-path-concat: 0*/
var operatorText = "-- vim: set ft=Haskell:\n\n-- Numberic operators\n\n+ : \n    ((String, String) => String) &\n    ((Number, Number) => Number)\n\n* : (Number, Number) => Number\n\n/ : (Number, Number) => Number\n\n% : (Number, Number) => Number\n\n- : (Number, Number) => Number\n\n++ : (Number) => Number\n\n\\-\\- : (Number) => Number\n\n-- Logical operators\n\n< : (Number, Number) => Boolean\n\n<= : (Number, Number) => Boolean\n\n> : (Number, Number) => Boolean\n\n>= : (Number, Number) => Boolean\n\n! : (%Boolean%%Mixed) => Boolean\n\n-- Bit operators\n\n>> : (Number, Number) => Boolean\n\n<< : (Number, Number) => Boolean\n\n>>> : (Number, Number) => Boolean\n\n~ : (Number) => Number\n\n| : (Number, Number) => Number\n\n& : (Number, Number) => Number\n\n^ : (Number, Number) => Number\n\n-- Equality operators\n\n=== : (%Boolean%%Mixed, %Boolean%%Mixed) => Boolean\n\n!== : (%Boolean%%Mixed, %Boolean%%Mixed) => Boolean\n\n!= : (%Boolean%%Mixed, %Boolean%%Mixed) => Boolean\n\n== : (%Boolean%%Mixed, %Boolean%%Mixed) => Boolean\n\n-- Operator keywords\n\n-- Do not use %Boolean%%Mixed here...\ntypeof : (%Boolean%%Mixed) => String\n\nin : (String, Object) => Boolean\n\ninstanceof : (Object, Function) => Boolean\n\nvoid : (%Boolean%%Mixed) => void\n\n%Unary%%Minus : (Number) => Number\n%Unary%%Plus : (Number) => Number\n";
var es5Text = "-- vim: set ft=Haskell:\ntype Error : {\n    message: String,\n    stack: String,\n    name: String,\n    ..R\n}\n\ntype TArray : {\n    length: Number,\n    indexOf: <T>(this: Array<T>, item: T) => Number,\n    lastIndexOf: <T>(this: Array<T>, item: T) => Number,\n    push: <T>(this: Array<T>, value: T) => Number,\n    pop: <T>(this: Array<T>) => T,\n    shift: <T>(this: Array<T>) => T,\n    unshift: <T>(this: Array<T>, value: T) => Number,\n    join: <T>(this: Array<T>, sep: String) => String,\n    slice: <T>(this: Array<T>, start?: Number, end?: Number) => Array<T>,\n    toString: <T>(this: Array<T>) => String,\n    concat: <T>(this: Array<T>, other: Array<T>) => Array<T>,\n    reverse: <T>(this: Array<T>) => Array<T>,\n\n    sort: <T>(this: Array<T>, sortFn?: (T, T) => Number) => void,\n\n    splice: <T>(\n        this: Array<T>, start: Number, deleteCount: Number, item?: T\n    ) => Array<T>,\n\n    filter : <T>(\n        this: Array<T>, func: (T) => Boolean\n    ) => Array<T>\n}\n\ntype TString : {\n    length: Number,\n    split: (this: String, String) => Array<String>,\n    replace: (this: String, regexp: RegExp, other: String) => String,\n    indexOf: (this: String, searchStr: String) => Number,\n    lastIndexOf : (this: String, searchStr: String) => Number,\n    charAt : (this: String, index: Number) => String,\n    charCodeAt : (this: String, index: Number) => String,\n    toUpperCase: (this: String) => String,\n    concat: (this: String, other: String) => String,\n    toString: (this: String) => String,\n    match : (this: String, regexp: RegExp) => Array<String> | null,\n    search : (this: String, regexp: RegExp) => Number,\n    slice : (this: String, start: Number, end?: Number) => String,\n    substring : (this: String, start: Number, end?: Number) => String,\n    toLowerCase : (this: String) => String,\n    toUpperCase : (this: String) => String,\n    trim : (this: String) => String\n}\n\ntype TObject : {\n    hasOwnProperty : <K,V>(this: Object<K,V>, key: String) => Boolean\n}\n\ntype TDate : {\n    getTime : (this: Date) => Number,\n    toString : (this: Date) => String\n}\n\ntype TNumber : {\n    toFixed : (this: Number, digits?: Number) => String,\n    toExponential : (this: Number, digits?: Number) => String,\n    toPrecision: (this: Number, precision?: Number) => String,\n    toString : (this: Number) => String\n}\n\ntype TFunction : {\n    call: %InternalFunction%%FnCall,\n    apply: %InternalFunction%%FnApply,\n    bind: %InternalFunction%%FnBind,\n\n    toString: (this: Function) => String,\n    length: Number\n}\n\ntype TRegExp : {\n    test: (this: RegExp, pattern: String) => Boolean,\n    exec: (this: RegExp, pattern: String) => Array<String> | null\n}\n\nString : (Number) => String\n\nBoolean : (Boolean | undefined) => Boolean\n\nError : (this: Error, String) => void\n\nArray : {\n    isArray: (%Boolean%%Mixed) => Boolean\n} & <T>(this: Array<T>, size: Number) => void\n\nDate : {\n    now: () => Number,\n    parse: (format: String) => Number\n} & (this: Date) => void\n\nMath : {\n    floor: (Number) => Number,\n    sqrt: (Number) => Number,\n    round: (Number) => Number,\n    random: () => Number,\n    pow : (Number, Number) => Number,\n    min : (Number, Number) => Number,\n    max : (Number, Number) => Number,\n    log : (Number) => Number,\n    ceil : (Number) => Number,\n    abs : (Number) => Number\n}\n\nparseInt : (String, Number) => Number\n\nObject : {\n    create: %InternalFunction%%ObjectCreate,\n    freeze : <T>(T) => T,\n    keys: <K, V>(Object<K, V>) => Array<String>\n}\n\nJSON : {\n    stringify: (%Boolean%%Mixed) => String,\n    parse: (String) => %Boolean%%Mixed\n}\n";

function hackupTermColor() {
    TermColor.red = red;
    TermColor.green = green;
    TermColor.cyan = cyan;
    TermColor.gray = gray;
    TermColor.underline = underline;

    function red(x) {
        return '<span class="tc-red">' + x + '</span>';
    }
    function green(x) {
        return '<span class="tc-green">' + x + '</span>';
    }
    function cyan(x) {
        return '<span class="tc-cyan">' + x + '</span>';
    }
    function gray(x) {
        return '<span class="tc-gray">' + x + '</span>';
    }
    function underline(x) {
        return '<span class="tc-underline">' + x + '</span>';
    }
}

function $(id) {
    return document.getElementById(id);
}

function fbind(fn, obj) {
    return function bound() {
        return fn.apply(obj, arguments);
    };
}

function JSigEditor() {
    this.javascriptEditor = $('javascript-editor');
    this.jsigEditor = $('jsig-editor');
    this.errorOutput = $('error-output');

    this.javascriptMirror = CodeMirror.fromTextArea(this.javascriptEditor, {
        lineNumbers: true,
        mode: 'javascript'
    });
    this.jsigMirror = CodeMirror.fromTextArea(this.jsigEditor, {
        lineNumbers: true,
        mode: 'haskell'
    });

    this.checkButton = $('check-button');
    this.shareButton = $('share-button');
}

JSigEditor.prototype.start = function start() {
    this.checkButton.addEventListener(
        'click', fbind(this.runTypeChecker, this)
    );

    this.shareButton.addEventListener(
        'click', fbind(this.shareCode, this)
    );

    var hash = location.hash;
    if (hash.indexOf('#/') === 0) {
        var hex = hash.slice(2);
        this.loadFromHex(hex);
    }
};

JSigEditor.prototype.loadFromHex = function loadFromHex(hex) {
    var content = atob(hex);
    var codeInfo = JSON.parse(content);

    this.javascriptMirror.setValue(codeInfo.code);
    this.jsigMirror.setValue(codeInfo.header);
};

JSigEditor.prototype.getInfo = function getInfo() {
    var codeInfo = {
        code: this.javascriptMirror.getValue(),
        header: this.jsigMirror.getValue()
    };

    return codeInfo;
};

JSigEditor.prototype.shareCode = function shareCode() {
    var codeInfo = this.getInfo();

    var content = JSON.stringify(codeInfo);
    var hex = btoa(content);

    location.hash = '#/' + hex;
};

JSigEditor.prototype.runTypeChecker = function runTypeChecker() {
    var files = Object.create(null);
    var codeInfo = this.getInfo();

    files['/snippet.js'] = codeInfo.code;
    files['/snippet.hjs'] = codeInfo.header;
    files[OPERATORS_PATH] = operatorText;
    files[ES5_PATH] = es5Text;

    var meta = compileJSIG('/snippet.js', {
        files: files,
        optin: false
    });

    if (meta.errors.length === 0) {
        this.errorOutput.innerHTML = 'No errors';
    } else {
        var errors = meta.prettyPrintAllErrors();
        this.errorOutput.innerHTML = errors;
    }
};

function main() {
    // Special sauce...
    hackupTermColor();

    var editor = new JSigEditor();
    editor.start();
}

main();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../type-checker/":71,"codemirror":30,"codemirror/mode/haskell/haskell.js":31,"codemirror/mode/javascript/javascript.js":32,"term-color":44}]},{},[88]);
