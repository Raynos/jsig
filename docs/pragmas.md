# TypeChecker pragmas

The `jsig` type checker has a series of "pragmas" available that
can be used to make the type checker only report a subset
of errors.

These are generally used when you want to adopt the `jsig` type
checker onto an existing code base and you do not want to do
so in a single blocking step.

Other type checkers do not have "pragmas" per say but they either
have a magic `any` shortcut type, have a loose / strict mode or
have a more lenient type inference algorithm. For example
TypeScript has a `--noImplicitAny` flag to turn on "strict" mode
and Flow just has lenient type inference.

`jsig` is designed for 100% type coverage & 100% correctness,
this means it's strict by default and there are options available
to "weaken" it. You cannot actually weaken the type checker,
you can only have it report less errors.

## `optin` mode.

By default `jsig` will type check an entire project, you can tell
it that you want to optin on a file per file basis.

This is done with a `/* @jsig */` comment which opts in the
type checker. This mode allows you to check on a file per file
basis.

This pragma is great to pre-declare the types of any local files
you import without actually type checking the implementation of
files you import.

## `partialExport` mode.

By default `jsig` will complain about ambigious export statements
where we are not able to verify the type of an exported function
because there is no usage.

You can turn on the `partialExport` pragma with 

```
/*  @jsig
    partialExport: true
*/
```

This allows you to define the export to say have two functions
or two methods and actually export 50 methods.

The typechecker will only check the two methods you declared,
however because the checker is strict by default, if those
two methods call any other methods you will have to check any
other methods in the call stack.

This pragma is great if you export multiple self-contained
methods that do not cross-call each other.

## `allowUnusedFunction` option.

By default `jsig` will complain about unused functions as that
is unchecked code. However if you turn on `partialExport` you
may want to not check undeclared methods.

By turning on `allowUnusedFunction` you can silence warnings on
functions that are not used.

## `allowUnknownRequire` option.

By default `jsig` will not understand any `require` that is does
not have a header, does not have a definition or that cannot
be inferred.

Since the `jsig` type checker is strict it will check all
statements in a file, however if you turn on `partialExport`
you may only use 2 / 10 modules imported in the method you are
checking and the other unused functions use the other 8 modules.

This mode will make the checker return a `Mixed` type for any
unresolvable or ambigious require. Since the typechecker is
strict you will still get a type error if you try and use the
`Mixed` data type, however this type error is delayed to first
usage instead of at require time.
