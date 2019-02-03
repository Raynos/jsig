'use strict';

var JSIGSnippet = require('../lib/jsig-snippet.js');

JSIGSnippet.test.skip('good method call with class', {
    fullInference: true,
    snippet: function m() {/*
        'use strict';

        module.exports = OutPending;

        function OutPending() {
            this.buckets = Object.create(null);
            this.bucketSize = 1024;

            this.emptyBucket = [];
            for (var i = 0; i < this.bucketSize; i++) {
                this.emptyBucket.push(null);
            }
        }

        OutPending.prototype.push = push;
        function push(id, op) {
            var remainder = id % 1024;
            var bucketStart = id - remainder;
            var bucket = this.getOrCreateBucket(bucketStart);

            bucket.elements[remainder] = op;
            bucket.count++;
        }

        OutPending.prototype.getOrCreateBucket = getOrCreateBucket;
        function getOrCreateBucket(bucketStart) {
            var bucket = this.buckets[bucketStart];
            if (!bucket) {
                var elems = this.emptyBucket.slice(0, this.emptyBucket.length);
                bucket = this.buckets[bucketStart] =
                    new OutPendingBucket(elems);
            }

            return bucket;
        }

        function OutPendingBucket(elems) {
            this.elements = elems;
            this.count = 0;
        }

        OutPending.prototype.pop = pop;
        function pop(id) {
            var op = null;
            var remainder = id % 1024;
            var bucketStart = id - remainder;

            var bucket = this.buckets[bucketStart];
            if (bucket) {
                op = bucket.elements[remainder];
                bucket.count--;
                if (bucket.count === 0) {
                    delete this.buckets[bucketStart];
                }
            }

            return op;
        }
    */}
}, function t(snippet, assert) {
    // var meta = snippet.compileAndCheck(assert, 1);
    // var exported = meta.serializeType(meta.moduleExportsType);

    // console.log('what was exported?', exported);

    assert.end();
});
