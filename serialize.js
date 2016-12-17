'use strict';

var extend = require('xtend');

module.exports = serializeHelper;

function serializeHelper(ast, opts) {
    var serializer = new Serializer();
    var finalStr = serializer.serialize(ast, opts);
    return finalStr;

    // var fn = serializers[ast.type];
    // if (!fn) {
    //     throw new Error('unknown ast type: ' + ast.type);
    // }

    // return fn(ast, opts);
}

function Serializer() {
    this.seen = [];
    this.cachedStrings = [];
}

/*eslint complexity: [2, 50]*/
Serializer.prototype.serialize =
function serialize(ast, opts) {
    opts = opts || { indent: 0, lineStart: 0 };

    if (ast._raw) {
        return this.serializeOnce(ast._raw, opts);
    }

    return this.serializeOnce(ast, opts);
};

Serializer.prototype.serializeOnce =
function serializeOnce(ast, opts) {
    var t;

    var foundIndex = this.seen.indexOf(ast);
    if (foundIndex !== -1) {
        // console.log('found a cycle', ast._raw);
    }

    var cachedIndex = this.seen.length;
    this.seen.push(ast);

    switch (ast.type) {
        case 'program':
            t = this.serializeProgram(ast, opts);
            break;
        case 'typeDeclaration':
            t = this.serializeTypeDeclaration(ast, opts);
            break;
        case 'assignment':
            t = this.serializeAssignment(ast, opts);
            break;
        case 'import':
            t = this.serializeImportStatement(ast, opts);
            break;
        case 'object':
            t = this.serializeObject(ast, opts);
            break;
        case 'unionType':
            t = this.serializeUnion(ast, opts);
            break;
        case 'intersectionType':
            t = this.serializeIntersection(ast, opts);
            break;
        case 'typeLiteral':
            t = this.serializeLiteral(ast, opts);
            break;
        case 'keyValue':
            t = this.serializeKeyValue(ast, opts);
            break;
        case 'valueLiteral':
            t = this.serializeValue(ast, opts);
            break;
        case 'function':
            t = this.serializeFunctionType(ast, opts);
            break;
        case 'genericLiteral':
            t = this.serializeGeneric(ast, opts);
            break;
        case 'tuple':
            t = this.serializeTuple(ast, opts);
            break;
        case 'freeLiteral':
            t = this.serializeFreeLiteral(ast, opts);
            break;
        case 'renamedLiteral':
            t = this.serializeRenamedLiteral(ast, opts);
            break;
        case 'param':
            t = this.serializeParam(ast, opts);
            break;
        case 'macroLiteral':
            t = this.serializeMacroLiteral(ast, opts);
            break;
        case 'comment':
            t = this.serializeComment(ast, opts);
            break;
        case 'defaultExport':
            t = this.serializeDefaultExpor(ast, opts);
            break;
        default:
            throw new Error('unknown ast type: ' + ast.type);
    }

    this.cachedStrings[cachedIndex] = t;

    return t;
};

Serializer.prototype.serializeProgram =
function serializeProgram(node, opts) {
    var tokens = [];
    for (var i = 0; i < node.statements.length; i++) {
        tokens.push(this.serialize(node.statements[i], opts));
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
};

Serializer.prototype.serializeTypeDeclaration =
function serializeTypeDeclaration(node, opts) {
    var tokens = [];
    for (var i = 0; i < node.generics.length; i++) {
        tokens.push(this.serialize(node.generics[i], opts));
    }

    var generics = tokens.length ?
        '<' + tokens.join(', ') + '>' : '';
    var str = 'type ' + node.identifier + generics;

    var decl = this.serialize(node.typeExpression, extend(opts, {
        lineStart: str.length
    }));

    return str + (decl[0] === '\n' ? ' :' : ' : ') + decl;
};

Serializer.prototype.serializeAssignment =
function serializeAssignment(node, opts) {
    var str = node.identifier + ' : ' +
        this.serialize(node.typeExpression, opts);

    if (str.split('\n')[0].length <= 65) {
        return str;
    }

    return node.identifier + ' :\n' + spaces(opts.indent + 1) +
        this.serialize(node.typeExpression, extend(opts, {
            indent: opts.indent + 1
        }));
};

Serializer.prototype.serializeImportStatement =
function serializeImportStatement(node, opts) {
    var tokens;

    if (node.types.length <= 1) {
        tokens = [];
        for (var i = 0; i < node.types.length; i++) {
            tokens.push(this.serialize(node.types[i]));
        }

        var content = 'import { ' + tokens.join(', ') +
            ' } from "' + node.dependency + '"';

        if (content.length < 65 && content.indexOf('\n') === -1) {
            return content;
        }
    }

    tokens = [];
    for (i = 0; i < node.types.length; i++) {
        tokens.push(this.serialize(node.types[i], extend(opts, {
            indent: opts.indent + 1
        })));
    }

    return 'import {\n' + tokens.join(',\n') + '\n' +
        spaces(opts.indent) + '} from "' + node.dependency + '"';
};

Serializer.prototype.serializeObject =
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
            tokens.push(this.serialize(keyValues[i]));
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
        tokens.push(this.serialize(keyValues[i], extend(opts, {
            indent: opts.indent + 1
        })));
    }

    return '{\n' +
        tokens.join(',\n') + '\n' + spaces(opts.indent) + '}';
};

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

Serializer.prototype.serializeUnion =
function serializeUnion(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.unions.length; i++) {
        nodes.push(this.serialize(node.unions[i], opts));
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
                    this.serialize(node.unions[i], extend(opts, {
                        indent: opts.indent + 1
                    }));
                nodes.push(text);
            }
            str = '\n' + nodes.join(' |\n');
        }
    }

    return str;
};

Serializer.prototype.serializeIntersection =
function serializeIntersection(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.intersections.length; i++) {
        nodes.push(this.serialize(node.intersections[i], opts));
    }

    var str = nodes.join(' & ');

    /* heuristic. Split across multiple lines if too long */
    if (str.split('\n')[0].length > 65) {
        str = prettyFormatList(nodes, ' & ', opts);
    }

    return str;
};

Serializer.prototype.serializeFreeLiteral =
function serializeFreeLiteral(node, opts) {
    return node.name;
};

Serializer.prototype.serializeMacroLiteral =
function serializeMacroLiteral(node, opts) {
    return node.macroName;
};

Serializer.prototype.serializeLiteral =
function serializeLiteral(node, opts) {
    return node.name;
};

Serializer.prototype.serializeParam =
function serializeParam(node, opts) {
    var prefix = node.name ?
        (node.name + (node.optional ? '?' : '') + ': ') :
        '';

    return prefix + this.serialize(node.value, opts);
};

Serializer.prototype.serializeKeyValue =
function serializeKeyValue(node, opts) {
    return spaces(opts.indent) + node.key +
        (node.optional ? '?' : '') + ': ' +
        this.serialize(node.value, opts);
};

Serializer.prototype.serializeValue =
function serializeValue(node, opts) {
    return node.value;
};

Serializer.prototype.serializeFunctionType =
function serializeFunctionType(node, opts) {
    var str = '(';
    var argNodes = node.args.slice();

    if (node.generics.length > 0) {
        var uniqueGenerics = [];
        for (var i = 0; i < node.generics.length; i++) {
            if (uniqueGenerics.indexOf(node.generics[i].name) === -1) {
                uniqueGenerics.push(node.generics[i].name);
            }
        }

        var genericExpr = '<' + uniqueGenerics.join(', ') + '>';
        str = genericExpr + str;
    }

    if (node.thisArg) {
        argNodes.unshift(node.thisArg);
    }

    var argStrs = [];
    for (i = 0; i < argNodes.length; i++) {
        argStrs.push(this.serialize(argNodes[i], opts));
    }
    var argStr = argStrs.join(', ');

    var resultStr = this.serialize(node.result, opts);
    var possibleStr = str + argStrs.join(', ') + ') => ' + resultStr;

    if (possibleStr.split('\n')[0].length > 65) {
        var offset = '\n' + spaces(opts.indent + 1);
        argStrs = [];
        for (i = 0; i < argNodes.length; i++) {
            argStrs.push(this.serialize(argNodes[i], extend(opts, {
                indent: opts.indent + 1
            })));
        }
        argStr = offset + argStrs.join(',' + offset) + '\n';
        argStr += spaces(opts.indent);
    }

    str += argStr + ') => ' + resultStr;

    return str;
};

Serializer.prototype.serializeGeneric =
function serializeGeneric(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.generics.length; i++) {
        nodes.push(this.serialize(node.generics[i], opts));
    }

    return this.serialize(node.value, opts) +
        '<' + nodes.join(', ') + '>';
};

Serializer.prototype.serializeTuple =
function serializeTuple(node, opts) {
    var nodes = [];
    for (var i = 0; i < node.values.length; i++) {
        nodes.push(this.serialize(node.values[i], opts));
    }

    return '[' + nodes.join(', ') + ']';
};

Serializer.prototype.serializeRenamedLiteral =
function serializeRenamedLiteral(node, opts) {
    return spaces(opts.indent) +
        this.serialize(node.original) + ' as ' + node.name;
};

Serializer.prototype.serializeComment =
function serializeComment(node, opts) {
    return spaces(opts.indent) + node.text;
};

Serializer.prototype.serializeDefaultExport =
function serializeDefaultExport(node, opts) {
    return spaces(opts.indent) + 'export default ' +
        this.serialize(node.typeExpression);
};

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
