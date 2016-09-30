'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : (String, Number) => Object', function t(assert) {
    var content = 'foo : (String, Number) => Object';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'param',
            name: null,
            optional: false,
            _raw: null,
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 7
                    },
                    end: {
                        line: 1,
                        column: 13
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                name: 'String',
                _raw: null
            }
        }, {
            type: 'param',
            name: null,
            optional: false,
            _raw: null,
            value: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 15
                    },
                    end: {
                        line: 1,
                        column: 21
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                name: 'Number',
                _raw: null
            }
        }],
        result: {
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 26
                },
                end: {
                    line: 1,
                    column: 32
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: true,
            name: 'Object',
            _raw: null
        },
        brand: 'Object',
        specialKind: null,
        generics: [],
        _raw: null
    });

    assert.end();
});

test('foo : () => CustomType', function t(assert) {
    var content = 'foo : () => CustomType';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            args: [],
            thisArg: null,
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 12
                    },
                    end: {
                        line: 1,
                        column: 22
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: false,
                name: 'CustomType',
                _raw: null
            },
            brand: 'Object',
            specialKind: null,
            generics: [],
            _raw: null
        },
        _raw: null
    });

    assert.end();
});

test('foo : (tagName: String) => void', function t(assert) {
    var content = 'foo : (tagName: String) => void';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            args: [{
                type: 'param',
                name: 'tagName',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 16
                        },
                        end: {
                            line: 1,
                            column: 22
                        }
                    },
                    concreteValue: null,
                    isGeneric: false,
                    builtin: true,
                    name: 'String',
                    _raw: null
                }
            }],
            thisArg: null,
            brand: 'Object',
            specialKind: null,
            generics: [],
            _raw: null,
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 27
                    },
                    end: {
                        line: 1,
                        column: 31
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                name: 'void',
                _raw: null
            }
        },
        _raw: null
    });

    assert.end();
});

test('foo : (this: DOMText, index: Number) => void', function t(assert) {
    var content = 'foo : (this: DOMText, index: Number) => void';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            args: [{
                type: 'param',
                name: 'index',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 29
                        },
                        end: {
                            line: 1,
                            column: 35
                        }
                    },
                    concreteValue: null,
                    isGeneric: false,
                    builtin: true,
                    name: 'Number',
                    _raw: null
                }
            }],
            thisArg: {
                type: 'param',
                name: 'this',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 13
                        },
                        end: {
                            line: 1,
                            column: 20
                        }
                    },
                    concreteValue: null,
                    isGeneric: false,
                    builtin: false,
                    name: 'DOMText',
                    _raw: null
                }
            },
            brand: 'Object',
            specialKind: null,
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 40
                    },
                    end: {
                        line: 1,
                        column: 44
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                name: 'void',
                _raw: null
            },
            generics: [],
            _raw: null
        },
        _raw: null
    });

    assert.end();
});

test('foo : (id: String, parent?: Bar) => Baz', function t(assert) {
    var content = 'foo : (id: String, parent?: Bar) => Baz';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            args: [{
                type: 'param',
                name: 'id',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 11
                        },
                        end: {
                            line: 1,
                            column: 17
                        }
                    },
                    concreteValue: null,
                    isGeneric: false,
                    builtin: true,
                    name: 'String',
                    _raw: null
                }
            }, {
                type: 'param',
                name: 'parent',
                optional: true,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 28
                        },
                        end: {
                            line: 1,
                            column: 31
                        }
                    },
                    concreteValue: null,
                    isGeneric: false,
                    builtin: false,
                    name: 'Bar',
                    _raw: null
                }
            }],
            thisArg: null,
            brand: 'Object',
            specialKind: null,
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 36
                    },
                    end: {
                        line: 1,
                        column: 39
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: false,
                name: 'Baz',
                _raw: null
            },
            generics: [],
            _raw: null
        },
        _raw: null
    });

    assert.end();
});

test('foo : <T>(a: T, b: T) => T', function t(assert) {
    var content = 'foo : <T>(a: T, b: T) => T';
    var result = parse(content).statements[0];

    assert.deepEqual(result, {
        type: 'assignment',
        identifier: 'foo',
        typeExpression: {
            type: 'function',
            args: [{
                type: 'param',
                name: 'a',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 13
                        },
                        end: {
                            line: 1,
                            column: 14
                        }
                    },
                    concreteValue: null,
                    isGeneric: true,
                    builtin: false,
                    name: 'T',
                    _raw: null
                }
            }, {
                type: 'param',
                name: 'b',
                optional: false,
                _raw: null,
                value: {
                    type: 'typeLiteral',
                    line: 1,
                    loc: {
                        start: {
                            line: 1,
                            column: 19
                        },
                        end: {
                            line: 1,
                            column: 20
                        }
                    },
                    concreteValue: null,
                    isGeneric: true,
                    builtin: false,
                    name: 'T',
                    _raw: null
                }
            }],
            thisArg: null,
            brand: 'Object',
            specialKind: null,
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 25
                    },
                    end: {
                        line: 1,
                        column: 26
                    }
                },
                concreteValue: null,
                isGeneric: true,
                builtin: false,
                name: 'T',
                _raw: null
            },
            generics: [{
                type: 'locationLiteral',
                name: 'T',
                location: ['args', 0, 'value'],
                _raw: null
            }, {
                type: 'locationLiteral',
                name: 'T',
                location: ['args', 1, 'value'],
                _raw: null
            }, {
                type: 'locationLiteral',
                name: 'T',
                location: ['result'],
                _raw: null
            }],
            _raw: null
        },
        _raw: null
    });

    assert.end();
});
