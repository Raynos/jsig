'use strict';

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
