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

# Examples

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
