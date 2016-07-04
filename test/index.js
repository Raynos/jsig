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
require('./parser/integration/min-document.js');
require('./parser/integration/jsig.js');
require('./parser/integration/frp-keyboard.js');
require('./parser/integration/error.js');
require('./parser/integration/continuable-mongo.js');
require('./parser/integration/jsonml-stringify.js');

require('./unit/generics.js');
require('./unit/function-inference.js');
require('./unit/optional-fields.js');

require('./batch-client-constructor.js');
require('./batch-client-methods.js');
require('./batch-client-new.js');
require('./batch-client-calls.js');
require('./batch-client-modules.js');
require('./proc-watcher-node_modules.js');

require('./regression.js');
