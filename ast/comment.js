'use strict';

module.exports = CommentNode;

function CommentNode(text) {
    this.type = 'comment';
    this.text = text;
    this._raw = null;
}
