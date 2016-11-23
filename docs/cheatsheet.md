# JSIG Cheat Sheet.

This document is a quick cheat sheet for how the jsig type system
represents various common types in ES5.

This is inspired by [mypy cheatsheet](http://mypy.readthedocs.io/en/latest/cheat_sheet.html)

## **Note**

Type annotations in jsig are done in header files, files named
x.hjs. A lot of types for statements can be inferred by the `jsig`
checker.

## Builtin types

```js
// For simple builtin-types, name of the type
var x = 1; // x : Number
var x = true; // x : Boolean
var x = 'test'; // x : String
var x = new Date(); // x : Date
var x = /some-regexp/; // x : RegExp
var x = null; // x : null
var x = undefined; // x : undefined
var x; // x : void

// For object literals use curly brackets and commas
var x = {
    foo: 'bar',
    baz: {
        x: 22
    }
}; // x : { foo: String, baz: { x: Number } }

// For arrays the name of the type is in angular brackets
var x = [1]; // Array<Number>

// For dictionaries we need the types of both keys and values.
var x = { 'Content-Length': '10' } // x : Object<String, String>

// dictionaries can also be empty
var x = Object.create(null); // x : Object<String, String>

// For tuples we specialy the types of each element
var x = [3, 'yes', 7]; // x : [Number, String, Number]

// For values that could be null, use unions.
var inputStr = f(); // inputStr : String | null
if (inputStr) {
    console.log(inputStr);
}
```

## Functions

```js
// This is how you declare a function type
// stringify : (num: Number) => String
function stringify(num) {
    return String(num);
}

// This funciton has no parameters and returns nothing
// greetWorld : () => void
function greetWorld() {
    console.log('Hello world!');
}

// Here is how you specify multiple arguments
// plus : (num1: Number, num2: Number) => Number
function plus(num1, num2) {
    return num1 + num2;
}

// You can add type annotations for options objects inline
// f : (opts: { a: Number, b: Number }) => Number
function f(opts) {
    return opts.a + opts.b;
}

// You can annotate function variables the same way
// x : ({ a: Number, b: Number }) => Number
var x = f;
```

## When you're puzzled or when things are complicated

```js
// To find out what type jsig infers for an expression anywhere in
// your program, just write a typeof expression. 
// jsig will print an error message with the type. 
// Remove it again before running the code.

typeof 1; // typeof `1` is: Number

// If the inference logic is confused then use typed variables
// A typed variable is `var {{name}}/*:{{type}} = {{value}}`.
var x/*:Object<String, String>*/ = Object.create(null);

// Use unions when something could be one of a few types
var x = [3, 5, 'test', 'fun']; // x : Array<String | Number>

// TODO: document Mixed type.

// Use jsig ignore next to supress type-checking on a given line, when your
// code confuses jsig or runs into an outright bug in jsig.
// Good practice is to comment every ignore with a bug link
// (in jsig or your own code) or an explanation of the issue
/* jsig ignore next: https://github.com/Raynos/jsig/issues/12 */
var x = confusingCode();
```

## Constructor functions

```js
// to type a constructor you should first predeclare the interface
/*
interface MyClass {
    foo: String,
    myMethod(Number, String) => String
}
*/

// You can annotate a constructor function
// A constructor function is just a normal function that
// has a `this` argument that is a certain object shape, including the prototype methods.
// MyClass : (this: MyClass) => void
function MyClass() {
    this.foo = 'bar';
}

MyClass.prototype.myMethod = function myMethod(num, str) {
    return String(num) + str;
};

// user defined types are written with their interface name
var x = new MyClass(); // x : MyClass
```
