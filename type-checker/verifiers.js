'use strict';

/*  Verifiers take an AST & a meta

    They return the type defn of the node.
*/

/*eslint no-console: 0*/
var console = require('console');

module.exports = {
    'Program': verifyProgram
};

function verifyProgram(node, meta) {
    node.body = hoistFunctionDeclaration(node.body);

    meta.setModuleExportsNode(node);
    meta.loadHeaderFile();

    for (var i = 0; i < node.body.length; i++) {
        meta.verifyNode(node.body[i]);
    }

    console.warn('program?');
}

// hoisting function declarations to the top makes the tree
// order algorithm simpler
function hoistFunctionDeclaration(nodes) {
    var declarations = [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'FunctionDeclaration') {
            declarations.push(nodes[i]);
        }
    }

    return declarations;
}
