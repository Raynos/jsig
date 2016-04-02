# jsig2

From scratch type-checker

# progress ( 0.1.0 )

The `v0.1.0` tag was cut. I skipped on a few tests...

 - [x] type check constructor
 - [x] type check method definition
 - [x] type check new Foo()
 - [x] type check method calls 
 - [x] support module system
 - [ ] write more module system tests
 - [x] create binary with pretty errors.

# progress ( 0.2.0 )

The `v0.2.0` will be cut once a full reference library type checks

 - [x] define type definitions for npm modules
 - [ ] write more type definition tests
 - [ ] support more JavaScript features.
 - [x] basic support for logic expressions.
 - [ ] write more logic expression tests.
 - [ ] basic support for nullables
 - [ ] basic support for if branches and flow analysis
 - [ ] basic support for generics

# Stability status: Experimental

This project is pre-alpha and an experimental type checker.

There are a lot of rough edges, sometimes the type checker will
report pretty errors and sometimes it just aborts.

This project is only interesting if you actually want to implement
or contribute to a type checker.

# Hello world example

There is a small hello world example that shows inference.

```js
'use strict';

function foo(x) {
    return x * 10;
}

foo('Hello, world!');
```

```
raynos at raynos-Dell-Precision-M3800  ~/projects/jsig2 on master*
$ jsig ./examples/hello.js 

examples/hello.js
Found error: jsig.sub-type.type-class-mismatch
@4: Got unexpected type class. Expected Number but got String

2. function foo(x) {
3.     return x * 10;
4. }

Expected : Number
Actual   : String

Found (1) error
```

## More examples

```
raynos at raynos-Dell-Precision-M3800  ~/projects/jsig2 on master*
$ jsig examples/2-main.js 
No type errors
```

There is a `2-main.js` that shows a small program that type checks

This includes the module system and the definition files.

## Definitions example

```
raynos at raynos-ThinkPad-T440p  ~/projects/jsig2 on master*
$ jsig ./examples/3-node_modules.js --definitions ./definitions/

examples/3-node_modules.js
Found error: jsig.sub-type.type-class-mismatch
@21: Got unexpected type class. Expected Number but got result: String

19.             headLine: str.split('\n').slice(0, 3),
20.             invalidField: str * 2
21.         });

Expected : Number
Actual   : result: String

Found (1) error
```

There is a `3-node_modules.js` example that shows how to use external
definitions. In this case we pass the `./definitions/` folder that
is part of jsig2 and contains stubs for modules defined in node core.

This is an example of how to define definitions for modules that you
did not author or that are not part of your current code repository.

This approach works for both npm modules and node core modules.

## Even more examples

There are a lot of tests that show examples

```
raynos at raynos-Dell-Precision-M3800  ~/projects/jsig2 on master*
$ git ls-files | grep test | grep 'hjs'
test/batch-client-calls/bad-assign-result-of-method-to-wrong-type.hjs
test/batch-client-calls/bad-call-method-with-wrong-argument.hjs
test/batch-client-calls/bad-calling-method-on-primitive.hjs
test/batch-client-calls/bad-calling-method-on-wrong-object.hjs
test/batch-client-calls/bad-calling-method-with-extra-args.hjs
...
```
