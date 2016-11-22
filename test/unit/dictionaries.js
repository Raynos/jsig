'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test('looking up dictionary field with static key', {
    snippet: function m() {/*
        var firstValue = o["foo"];
        var secondValue = o.foo;

        firstValue + secondValue;
    */},
    header: function h() {/*
        o : Object<String, String>
    */}
}, function t(snippet, assert) {
    snippet.compileAndCheck(assert);
    assert.end();
});

// JSIGSnippet.test('Dictionary lazy-bound on method usage', {
//     snippet: function m() {
//         function foo() {
//             var obj = Object.create(null);
//
//             arr.push({ foo: 'bar' });
//             return arr;
//         }
//     },
//     header: function h() {/*
//         foo : () => Array<{ foo: String }>
//     */}
// }, function t(snippet, assert) {
//     snippet.compileAndCheck(assert);
//     assert.end();
// });

// JSIGSnippet.test('Dictionary lazy-bound on return usage', {
//     snippet: function m() {/*
//         function foo() {
//             var obj = Object.create(null);
//             return obj;
//         }
//     */},
//     header: function h() {/*
//         foo : () => Object<String, { foo: String }>
//     */}
// }, function t(snippet, assert) {
//     snippet.compileAndCheck(assert);
//     assert.end();
// });

// JSIGSnippet.test('Dictionary lazy-bound on assignment usage', {
//     snippet: function m() {/*
//         function foo() {
//             var obj = Object.create(null);

//             obj['foo'] = { foo: 'bar' };
//             return arr;
//         }
//     */},
//     header: function h() {/*
//         foo : () => Object<String, { foo: String }>
//     */}
// }, function t(snippet, assert) {
//     snippet.compileAndCheck(assert);
//     assert.end();
// });

// JSIGSnippet.test('Dictionary lazy-bound on call usage', {
//     snippet: function m() {
//         function foo() {
//             var obj = Object.create(null);

//             filterFoo(obj);
//             return obj;
//         }
//     },
//     header: function h() {/*
//         filterFoo : (Object<String, { foo: String }>) => void

//         foo : () => Object<String, { foo: String }>
//     */}
// }, function t(snippet, assert) {
//     snippet.compileAndCheck(assert);
//     assert.end();
// });

// JSIGSnippet.test('Dictionary lazy-bound on call usage from union', {
//     snippet: function m() {/*
//         function foo() {
//             var obj = bar || Object.create(null);

//             filterFoo(obj);
//             return obj;
//         }
//     */},
//     header: function h() {/*
//         bar : Object<String, { foo: String }> | null

//         filterFoo : (Object<String, { foo: String }>) => void

//         foo : () => Object<String, { foo: String }>
//     */}
// }, function t(snippet, assert) {
//     snippet.compileAndCheck(assert);
//     assert.end();
// });
