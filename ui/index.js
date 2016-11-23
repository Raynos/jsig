'use strict';

var CodeMirror = require('codemirror');
var TermColor = require('term-color');
var fs = require('fs');
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
var operatorText = fs.readFileSync(
    __dirname + '/../type-checker/builtin-definitions/operators.hjs', 'utf8'
);
var es5Text = fs.readFileSync(
    __dirname + '/../type-checker/builtin-definitions/es5.hjs', 'utf8'
);

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
