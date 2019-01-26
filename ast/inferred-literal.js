'use strict';

/* @jsig */

/*
    An InferredLiteral is a temporary placeholder for a generic
    value during the static type inference algorithm.

    When an untyped function is found we run the static inference
    algorithm and we assign function parameters, return types
    and this values as being inferred literals which we will
    narrow or expand based on usage within the function body.

    Once we reach the end of the function we will then swap them
    out actual concrete types or genuine literal types with the
    `isGeneric` boolean set.

    This type should not escape into the final type of a value or
    be added into a Scope abstraction since the concrete type
    of an inferred function declaration should have non inferred
    types.
*/
module.exports = InferredLiteral;

function InferredLiteral(name) {
    this.type = 'inferredLiteral';
    this.name = name;
    this._raw = null;
}
