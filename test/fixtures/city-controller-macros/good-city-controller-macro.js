'use strict';

/*eslint-disable no-restricted-modules*/
var async = require('async');
/*eslint-enable no-restricted-modules*/
var RequestEnv = require('request-env');

function CityController(deps) {
    this.RequestEnv = RequestEnv;
    this.deps = deps;
}

CityController.prototype.retrieveCanonicalForm =
function retrieveCanonicalForm(params, done) {
    var sourceAuth = this.isAuthorizedSource(params.source);
    if (sourceAuth && params.useCache) {
        var canonicalJSON = this.deps.cityMonitor
            .getCachedCanonicalForm(params.uuid);
        if (canonicalJSON) {
            return done(null, canonicalJSON);
        }
    }

    var env = params.env || new this.RequestEnv({}, {
        useCache: params.useCache,
        endpointName: 'city.read'
    });

    async.waterfall([
        env.loadCity.bind(env, params.uuid),
        function onNext(city, subNext) {
            if (!city.userHasViewPermission(params.userUUID)) {
                return done(new Error('permission denied'));
            }

            subNext(null, JSON.stringify(city.canonicalForm()));
        }
    ], done);
};

CityController.prototype.isAuthorizedSource =
function isAuthorizedSource(source) {
    return source ? source.indexOf('api-server') !== -1 : false;
};

module.exports = CityController;
