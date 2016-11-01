'use strict';

require('./parser/statements.js');
require('./parser/functions.js');
require('./parser/objects.js');
require('./parser/type-definitions.js');
require('./parser/union.js');
require('./parser/intersection.js');
require('./parser/generics.js');
require('./parser/imports.js');
require('./parser/tuples.js');
require('./parser/parser-errors.js');
require('./parser/braces.js');
require('./parser/exports.js');

require('./parser/integration/min-document.js');
require('./parser/integration/jsig.js');
require('./parser/integration/frp-keyboard.js');
require('./parser/integration/error.js');
require('./parser/integration/continuable-mongo.js');
require('./parser/integration/jsonml-stringify.js');

require('./unit/generics.js');
require('./unit/function-inference.js');
require('./unit/optional-fields.js');
require('./unit/union-folding.js');
require('./unit/function-overloading.js');
require('./unit/function-invariance.js');
require('./unit/exports.js');
require('./unit/optin.js');
require('./unit/unused-function.js');
require('./unit/unknown-require.js');
require('./unit/intersection-types.js');
require('./unit/construct-builtins.js');
require('./unit/prototype-inheritance.js');
require('./unit/multiple-returns.js');
require('./unit/narrow-mixed.js');
require('./unit/optional-functions.js');
require('./unit/tuples.js');
require('./unit/narrow-types.js');
require('./unit/arrays.js');
require('./unit/object-literals.js');
require('./unit/boolean-logic.js');
require('./unit/dictionaries.js');
require('./unit/friendly-error-messages.js');

require('./integration/batch-client-constructor.js');
require('./integration/batch-client-methods.js');
require('./integration/batch-client-new.js');
require('./integration/batch-client-calls.js');
require('./integration/batch-client-modules.js');
require('./integration/proc-watcher-node_modules.js');

require('./integration/city-controller-macros.js');

require('./integration/regression.js');

