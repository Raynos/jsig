'use strict';

module.exports = MacroLiteralNode;

function MacroLiteralNode(macroName, macroFile) {
    this.type = 'macroLiteral';

    this.macroName = macroName;
    this.macroFile = macroFile;
    this._raw = null;
}
