'use strict';

var test = require('tape');

var parse = require('../../parser.js');

test('foo : (String)', function t(assert) {
    var content = 'foo : (String)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
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
        label: null,
        optional: false,
        name: 'String',
        _raw: null
    });

    assert.end();
});

test('foo : (String | Number)', function t(assert) {
    var content = 'foo : (String | Number)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
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
            label: null,
            optional: false,
            name: 'String',
            builtin: true,
            _raw: null
        }, {
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
            label: null,
            optional: false,
            name: 'Number',
            builtin: true,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : (A) => B | C', function t(assert) {
    var content = 'foo : (A) => B | C';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 7
                },
                end: {
                    line: 1,
                    column: 8
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
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
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 17
                    },
                    end: {
                        line: 1,
                        column: 18
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        label: null,
        brand: 'Object',
        optional: false,
        generics: [],
        _raw: null
    });

    assert.end();
});

test('foo : (A) => (B | C)', function t(assert) {
    var content = 'foo : (A) => (B | C)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 7
                },
                end: {
                    line: 1,
                    column: 8
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 14
                    },
                    end: {
                        line: 1,
                        column: 15
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 18
                    },
                    end: {
                        line: 1,
                        column: 19
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        label: null,
        generics: [],
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => B | C)', function t(assert) {
    var content = 'foo : ((A) => B | C)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 8
                },
                end: {
                    line: 1,
                    column: 9
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 14
                    },
                    end: {
                        line: 1,
                        column: 15
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 18
                    },
                    end: {
                        line: 1,
                        column: 19
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        generics: [],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => (B | C))', function t(assert) {
    var content = 'foo : ((A) => (B | C))';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'function',
        thisArg: null,
        args: [{
            type: 'typeLiteral',
            line: 1,
            loc: {
                start: {
                    line: 1,
                    column: 8
                },
                end: {
                    line: 1,
                    column: 9
                }
            },
            concreteValue: null,
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'A',
            _raw: null
        }],
        result: {
            type: 'unionType',
            unions: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 15
                    },
                    end: {
                        line: 1,
                        column: 16
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            }, {
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
                isGeneric: false,
                label: null,
                optional: false,
                name: 'C',
                builtin: false,
                _raw: null
            }],
            label: null,
            optional: false,
            _raw: null
        },
        brand: 'Object',
        generics: [],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((A) => B) | C', function t(assert) {
    var content = 'foo : ((A) => B) | C';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 8
                    },
                    end: {
                        line: 1,
                        column: 9
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: false,
                label: null,
                optional: false,
                name: 'A',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 14
                    },
                    end: {
                        line: 1,
                        column: 15
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'B',
                builtin: false,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }, {
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
            isGeneric: false,
            builtin: false,
            label: null,
            optional: false,
            name: 'C',
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});

test('foo : ((String) => String) | ((Number) => Number)', function t(assert) {
    var content = 'foo : ((String) => String) | ((Number) => Number)';
    var result = parse(content).statements[0];

    assert.equal(result.type, 'assignment');
    assert.equal(result.identifier, 'foo');
    assert.deepEqual(result.typeExpression, {
        type: 'unionType',
        unions: [{
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 8
                    },
                    end: {
                        line: 1,
                        column: 14
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'String',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 19
                    },
                    end: {
                        line: 1,
                        column: 25
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'String',
                builtin: true,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }, {
            type: 'function',
            thisArg: null,
            args: [{
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 31
                    },
                    end: {
                        line: 1,
                        column: 37
                    }
                },
                concreteValue: null,
                isGeneric: false,
                builtin: true,
                label: null,
                optional: false,
                name: 'Number',
                _raw: null
            }],
            result: {
                type: 'typeLiteral',
                line: 1,
                loc: {
                    start: {
                        line: 1,
                        column: 42
                    },
                    end: {
                        line: 1,
                        column: 48
                    }
                },
                concreteValue: null,
                isGeneric: false,
                label: null,
                optional: false,
                name: 'Number',
                builtin: true,
                _raw: null
            },
            brand: 'Object',
            generics: [],
            label: null,
            optional: false,
            _raw: null
        }],
        label: null,
        optional: false,
        _raw: null
    });

    assert.end();
});
