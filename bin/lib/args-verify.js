'use strict';

var assert = require('assert');
var minimist = require('minimist');

function ArgsOption(name, opts) {
    this.name = name;
    this.help = (opts && opts.help) || '';
    this.positional = (opts && opts.positional) || false;
    this.boolean = (opts && opts.boolean) || false;
    this.type = (opts && opts.type) || '';
}

function ArgsVerify(opts) {
    assert(opts, 'opts required');
    assert(opts.name, 'opts.name required');

    this.binaryName = opts.name;

    this.options = [];
    this._optionsIndex = Object.create(null);
    this._positionalOptions = [];
    this._booleanArgs = [];

    this.errors = [];
}

ArgsVerify.prototype.add = function add(name, opts) {
    this.options.push(new ArgsOption(name, opts));
};

ArgsVerify.prototype.addBoolean =
function addBoolean(name) {
    this.add(name, {
        boolean: true
    });
};

ArgsVerify.prototype.addPositional =
function addPositional(name) {
    this.add(name, {
        positional: true
    });
};

ArgsVerify.prototype._buildIndex = function _buildIndex() {
    for (var i = 0; i < this.options.length; i++) {
        this._optionsIndex[this.options[i].name] = this.options[i];

        if (this.options[i].positional) {
            this._positionalOptions.push(this.options[i]);
        }
        if (this.options[i].boolean) {
            this._booleanArgs.push(this.options[i].name);
        }
    }
};

ArgsVerify.prototype._validate = function _validate(opts) {
    var keys = Object.keys(opts);
    var correct = true;

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (key === '_') {
            var len = opts._.length;
            if (len > this._positionalOptions.length) {
                correct = false;
                this.errors.push(
                    'Expected at most ' + this._positionalOptions.length +
                    ' positional arguments'
                );
            }
            continue;
        }

        var option = this._optionsIndex[key];
        if (!option) {
            correct = false;
            this.errors.push('Unknown argument: ' + key);
            continue;
        }
    }

    return correct;
};

ArgsVerify.prototype.parse = function parse(argv) {
    this._buildIndex();

    var opts = minimist(argv.slice(2), {
        boolean: this._booleanArgs
    });

    if (this._validate(opts)) {
        return opts;
    }

    return null;
};

ArgsVerify.prototype.createHelpText =
function createHelpText() {
    var text = '';
    var multiLineMode = false;
    var lines = [];

    text += this.binaryName + ' ';

    for (var i = 0; i < this.options.length; i++) {
        var opts = this.options[i];

        if (opts.help && !multiLineMode) {
            text += '\n\n';
            multiLineMode = true;
        }

        if (!multiLineMode) {
            if (opts.positional) {
                text += '[' + opts.name + ']';
            } else if (opts.name.length === 1) {
                text += '[-' + opts.name + '] ';
            } else {
                text += '[--' + opts.name + '] ';
            }
        } else if (opts.boolean) {
            lines.push([
                '  --' + opts.name,
                opts.help
            ]);
        } else {
            lines.push([
                '  --' + opts.name + '=[' + opts.type + ']',
                opts.help
            ]);
        }
    }

    var maxLength = 0;
    for (i = 0; i < lines.length; i++) {
        if (maxLength < lines[i][0].length) {
            maxLength = lines[i][0].length;
        }
    }

    for (i = 0; i < lines.length; i++) {
        text += rightpad(lines[i][0], maxLength) +
            '   ' + lines[i][1] + '\n';
    }

    return text;
};

function rightpad(str, n) {
    while (str.length < n) {
        str += ' ';
    }

    return str;
}

module.exports = ArgsVerify;
