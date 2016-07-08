'use strict';

var assert = require('assert');
var Buffer = require('buffer').Buffer;

var extend = require('xtend');
var HttpHash = require('http-hash');
var url = require('fast-url-parser');

var NOT_FOUND_BODY = new Buffer('{"message":"Not Found"}');
var NOT_FOUND_STATUS_CODE = 404;
var NOT_FOUND_HEADERS = {
    'content-type': 'application/json',
    'content-length': String(NOT_FOUND_BODY.length)
};

var METHOD_NOT_ALLOWED_BODY = new Buffer('{"message":"Method Not Allowed"}');
var METHOD_NOT_ALLOWED_STATUS_CODE = 405;
var METHOD_NOT_ALLOWED_HEADERS = {
    'content-type': 'application/json',
    'content-length': String(METHOD_NOT_ALLOWED_BODY.length)
};

module.exports = HttpServiceRouter;

function HttpServiceRouter(routerOptions) {
    var hash = this.hash = new HttpHash();
    var services = routerOptions.services;

    this.urlNotFound = routerOptions.urlNotFound || defaultNotFound;
    this.methodNotAllowed = routerOptions.methodNotAllowed ||
        defaultMethodNotAllowed;

    var serviceNames = Object.keys(services);

    for (var i = 0; i < serviceNames.length; i++) {
        var serviceName = serviceNames[i];
        var service = services[serviceName];

        mountService(hash, serviceName, service);
    }
}

HttpServiceRouter.prototype.handleRequest = handleEndpointRequest;

function mountService(hash, serviceName, serviceDefinition) {
    var routePrefix = serviceDefinition.route;
    assert(
        typeof routePrefix === 'string' && routePrefix.charAt(0) === '/',
        'Expected service ' + serviceName +
            'to have a route prefixed with `/`'
    );

    var methods = serviceDefinition.methods;
    var methodNames = Object.keys(methods);

    for (var i = 0; i < methodNames.length; i++) {
        var methodName = methodNames[i];
        var method = methods[methodName];

        var routeSuffix = method.route;
        assert(
            typeof routeSuffix === 'string' && routeSuffix.charAt(0) === '/',
            'Epected service method ' + serviceName + '.' + methodName +
            ' to have a route prefixed with `/`'
        );

        var routeHandler = method.handler;
        assert(
            typeof routeHandler === 'function',
            'Expected service method handler ' +
                serviceName + '.' + methodName + ' to be a fuction'
        );

        var httpMethod = method.httpMethod;
        var route = routePrefix + routeSuffix;
        var currentMethods = hash.get(route).handler;

        assert(
            httpMethod && typeof httpMethod === 'string',
            'Expected HTTP method to be defined in ' +
                serviceName + ' ' + methodName
        );

        assert(
            httpMethod.toUpperCase() === httpMethod,
            'Expected http method ' + httpMethod + ' to be upper case in ' +
                serviceName + '.' + methodName
        );

        assert(
            !currentMethods || !currentMethods.hasOwnProperty(httpMethod),
            'Expected method ' + httpMethod + ' to be defined once in ' +
                serviceName + '.' + methodName
        );

        if (!currentMethods) {
            currentMethods = {};
            hash.set(route, currentMethods);
        }

        var endpoint = new Endpoint(serviceName, methodName, routeHandler);
        currentMethods[httpMethod] = endpoint;
    }
}

function Endpoint(serviceName, methodName, routeHandler) {
    this.serviceName = serviceName;
    this.methodName = methodName;
    this.routeHandler = routeHandler;
}

Endpoint.prototype.handleRequest = endpointHandleRequest;

function endpointHandleRequest(req, res, opts) {
    var requestContext = opts.requestContext;
    requestContext.serviceName = this.serviceName;
    requestContext.methodName = this.methodName;
    this.routeHandler(req, res, opts);
}

function handleEndpointRequest(req, res, opts) {
    var requestTime = Date.now();
    var perRequestOpts = extend(opts);
    var parsedUrl = url.parse(req.url, true);

    var route = this.hash.get(parsedUrl.pathname);
    var methodHandlers = route.handler;
    perRequestOpts.requestContext = new HttpRequestContext(
        requestTime,
        parsedUrl,
        route
    );

    if (methodHandlers) {
        var handler = methodHandlers[req.method];

        if (handler) {
            handler.handleRequest(req, res, perRequestOpts);
        } else {
            this.methodNotAllowed(req, res, perRequestOpts);
        }
    } else {
        this.urlNotFound(req, res, perRequestOpts);
    }
}

function defaultNotFound(req, res) {
    res.writeHead(NOT_FOUND_STATUS_CODE, NOT_FOUND_HEADERS);
    res.end(NOT_FOUND_BODY);
}

function defaultMethodNotAllowed(req, res) {
    res.writeHead(METHOD_NOT_ALLOWED_STATUS_CODE, METHOD_NOT_ALLOWED_HEADERS);
    res.end(METHOD_NOT_ALLOWED_BODY);
}

function HttpRequestContext(requestTime, parsedUrl, route) {
    this.requestTime = requestTime;
    this.parsedUrl = parsedUrl;
    this.params = route.params;
    this.splat = route.splat;
    this.serviceName = '';
    this.methodName = '';
}
