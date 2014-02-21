'use strict';

/**
 * Module dependencies.
 */

var Api = require('./api');
var Docs = require('./docs');
var Environment = require('./environment');
var Router = require('./framework/router');
var schema = require('./schema');
var utils = require('./utils');

/**
 * Initialize a new `Framework`.
 *
 * @param {Object} options
 * @api public
 */

function Framework(options) {
  if (!(this instanceof Framework)) {
    return new Framework(options);
  }

  this.env = new Environment();
  this.env.validateThrow(schema.options.framework, options);

  this.spec = {
    swaggerVersion: '1.2',
    basePath: options.basePath,
    apiVersion: options.apiVersion || '0.0.0',
    apis: [],
    authorizations: options.authorizations,
  };

  this.docs = new Docs(this);
  this.router = new Router(this);

  this.apis = {};
  this.middleware = {};
  this.models = {};
}

/**
 * Declare an API.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.api = function(spec) {
  var api = new Api(this, spec);

  if (this.apis[spec.path]) {
    throw new Error('api already defined');
  }

  this.spec.apis.push(spec.path);
  this.apis[spec.path] = api;

  return api;
};

/**
 * Declare a model.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.model = function(spec) {
  this.env.validateThrow(schema.swagger.model, spec);

  this.env.addSchema(spec.id, utils.convertSchema(spec));

  this.models[spec.id] = spec;
};

/**
 * Return request listener.
 *
 * @param {Object} options
 * @api public
 */

Framework.prototype.dispatcher = function(options) {
  return this.router.dispatcher(options);
};

/**
 * Expose Framework.
 */

module.exports = Framework;
