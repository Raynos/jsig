'use strict';

module.exports = HeaderFile;

function HeaderFile(jsigAst) {
    this.jsigAst = jsigAst;
}

HeaderFile.prototype.getAssignments =
function getAssignments() {
    var statements = this.jsigAst.statements;

    var assignments = [];
    for (var i = 0; i < statements.length; i++) {
        if (statements[i].type === 'assignment') {
            assignments.push(statements[i]);
        }
    }

    return assignments;
};
