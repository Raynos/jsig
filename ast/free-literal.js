'use strict';

/* @jsig */

/*
    A FreeLiteral is a placeholder for a late bound generic.

    For example:

    ```
    var foo = [];
    foo.push(2);
    ```

    Will have `foo : Array<freeT>` followed by `foo : Array<Number>`

    When a free literal is observed in an assignment or method
    call operation then its replaced with the first concrete use
    of the type for the free literal.

    It can also be used conceptually used with :

    ```
    var foo = new Box();
    box.set(42);
    box.get() === 42;
    ```

    Aka a generic class like `Box : <T>(this: IBox<T>) => void`
    will have the instance be bound to a free literal because
    the known type of `T` is unknown in the constructor and will
    be late bound based on the first method call.

*/
module.exports = FreeLiteralNode;

function FreeLiteralNode(name) {
    this.type = 'freeLiteral';
    this.name = name;
    this._raw = null;
}
