# jsig2

From scratch type-checker

# progress

 - [x] type check constructor
 - [x] type check method definition
 - [x] type check new Foo()
 - [x] type check method calls 
 - [?] support module system
 - [x] create binary with pretty errors.

# later

 - [ ] define type definitions for npm modules
 - [ ] support more JavaScript features.

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
