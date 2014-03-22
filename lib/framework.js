/**
 * Framework is a container for the Swagger apis.
 *
 * It contains helpers for creating API and Swagger documentation endpoints.
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('swagger-framework:framework');
var lodash = require('lodash');
var schema = require('swagger-schema/spec');

var Api = require('./api');
var Docs = require('./docs');
var Router = require('./framework/router');
var frameworkOptions = require('./options/framework');

/**
 * Initialize a new `Framework`.
 *
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

function Framework(spec, options) {
  if (!(this instanceof Framework)) {
    return new Framework(spec, options);
  }

  debug('create framework', spec, options);

  spec = lodash.cloneDeep(spec || {});
  options = lodash.cloneDeep(options || {});

  spec = lodash.defaults(spec, {
    swaggerVersion: '1.2',
    apis: [],
  });

  options = lodash.defaults(options,
    lodash.pick(spec, 'basePath')
  );
  delete spec.basePath;

  schema.validateThrow('ResourceListing', spec);
  schema.validateThrow(frameworkOptions, options);

  if (spec.swaggerVersion !== '1.2') {
    throw new Error('swaggerVersion not supported: ' + spec.swaggerVersion);
  }

  this.spec = spec;
  this.options = options;
  this.docs = new Docs(this);
  this.router = new Router(this);

  this.apis = {};
  this.middleware = {};
}

/**
 * Setup and validate.
 *
 * @api public
 */

Framework.prototype.setup = function() {
  var self = this;

  debug('setup framework');

  lodash.forOwn(this.apis, function(api) {
    api.setup(self);
  });
};

/**
 * Declare an API.
 *
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

Framework.prototype.api = function(spec, options) {
  var api = spec instanceof Api ? spec : new Api(spec, options);

  debug('register api ' + spec.resourcePath);

  if (this.apis[api.spec.resourcePath]) {
    throw new Error('Api ' + api.spec.resourcePath + ' already defined.');
  }

  this.spec.apis.push(api.spec.resourcePath);
  this.apis[api.spec.resourcePath] = api;

  return api;
};

/**
 * Returns callback suitable `http.createServer()`.
 *
 * @param {Object} options
 * @api public
 */

Framework.prototype.dispatcher = function(options) {
  this.setup();

  return this.router.dispatcher(options);
};

/**
 * Create and return `http.Server`.
 *
 * @param {Object} options
 * @api public
 */

Framework.prototype.server = function(options) {
  options = lodash.defaults(options || {}, {
    docsPath: '/api-docs',
  });

  var dispatcher = this.dispatcher(options);
  var docsDispatcher = this.docs.dispatcher({ prefix: options.docsPath });

  return require('http').createServer(function(req, res) {
    if (req.url.slice(0, options.docsPath.length) === options.docsPath) {
      docsDispatcher(req, res);
    } else {
      dispatcher(req, res);
    }
  });
};

/**
 * Expose Framework.
 */

module.exports = Framework;
