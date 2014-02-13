'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var validate = require('./server/validate');
var routes = require('./server/routes');
var schema = require('./schema');
var utils = require('./utils');

/**
 * Initialize a new `Server` with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

function Server(options) {
  if (!(this instanceof Server)) return new Server(options);

  this._apis = {};
  this._resources = {};
  this._models = {};

  schema.validateThrow(options, schema.options.framework);

  this._options = {
    swaggerVersion: '1.2',
    basePath: options.basePath,
    apiVersion: options.apiVersion || '0.0.0',
    docsPath: options.docsPath || '/api-docs',
  };

  this._callbacks = this._options.callbacks || {};

  this._setup();
}

/**
 * Setup Express app and helper routes.
 *
 * @api private
 */

Server.prototype._setup = function() {
  var path = this._options.docsPath;

  this._app = express();
  this._app.use(this._app.router);

  var index = routes.index(this);

  this._app.get(path, function(req, res, next) {
    index(req, res, next);
  });

  if (path[path.length - 1] === '/') {
    path = path.slice(0, path.length - 1);
  }

  path = new RegExp(utils.escapeRegex(path) + '(.+)$');

  var declaration = routes.declaration(this);

  this._app.get(path, function(req, res, next) {
    declaration(req, res, next);
  });
};

/**
 * Inject callbacks into args based on Swagger spec.
 *
 * @api private
 */

Server.prototype._setupRoute = function(spec, routeCallbacks) {
  var types = {};

  spec.parameters.forEach(function(parameter) {
    var type = parameter.paramType;

    if (!types[type]) types[type] = {};

    types[type][parameter.name] = parameter;
  });

  var callbacks = [];

  // swagger header validator
  callbacks.push(validate.header(spec));

  // url
  callbacks.push(express.urlencoded());

  // authenticate
  if (this._callbacks.authenticate) {
    callbacks.push(this._callbacks.authenticate());
  }

  // swagger path validator
  callbacks.push(validate.path(spec));

  // swagger query validator
  callbacks.push(validate.query(spec));

  // json
  callbacks.push(express.json());

  // swagger body/form validator
  callbacks.push(validate.body(spec));

  while (callbacks.length) {
    routeCallbacks.unshift(callbacks.pop());
  }
};

/**
 * Declare an API.
 *
 * @api public
 */

Server.prototype.api = function(spec) {
  schema.validateThrow(spec, schema.swagger.api);

  if (spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  if (this._apis[spec.path]) {
    throw new Error('api already defined');
  }

  spec.apis = {};
  spec.models = {};

  this._apis[spec.path] = spec;
};

/**
 * Declare a resources.
 *
 * @api public
 */

Server.prototype.resource = function(spec, options) {
  schema.validateThrow(spec, schema.swagger.resource);

  // root path
  var rootPath = spec.path.split(/[\/\(]/)[1];

  if (!rootPath) {
    throw new Error('invalid path: ' + spec.path);
  }

  rootPath = '/' + rootPath;

  var api = this._apis[rootPath];

  if (!api) {
    throw new Error('api not defined: ' + rootPath);
  }

  var resource = this._resources[spec.path];

  if (!resource) {
    resource = this._resources[spec.path] = {};
  }

  // ensure only defined once
  if (resource[spec.method]) {
    throw new Error('redefined resource: ' + spec.method + ' ' + spec.path);
  }

  if (!api.apis[spec.path]) {
    api.apis[spec.path] = resource;
  }

  // save path
  var path = spec.path;
  delete spec.path;

  // add to resources
  resource[spec.method] = spec;

  // get express route callbacks
  var args = [].slice.call(arguments);

  // remove spec
  args.shift();

  // remove options
  if (args.length > 0 && typeof args[0] !== 'function') {
    args.shift();
  } else {
    options = {};
  }

  // send 501 when no action provided
  if (args.length === 0) {
    args.push(function(req, res) {
      res.send(501, { code: 501, message: 'Not Implemented' });
    });
  }

  // add validation callbacks to args
  this._setupRoute(spec, args);

  // attach swagger spec to request
  args.unshift(function(req, res, next) {
    req.swagger = { spec: spec };
    next();
  });

  // insert express path
  args.unshift(path
    .replace('.{format}', '.json')
    .replace(/\/{/g, '/:')
    .replace(/\}/g, ''));

  // add route to express router
  this._app[spec.method.toLowerCase()].apply(this._app, args);
};

/**
 * Declare a model.
 *
 * @api public
 */

Server.prototype.model = function(spec) {
  schema.validateThrow(spec, schema.swagger.model);
  this._models[spec.id] = spec;
};

/**
 * Return interface usuable by app.use().
 *
 * @api public
 */

Server.prototype.dispatcher = function() {
  return this._app;
};

/**
 * Expose Server.
 */

exports.Server = Server;
