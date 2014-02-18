'use strict';

/**
 * Module dependencies.
 */

var Api = require('./api');
var Docs = require('./docs');
var Router = require('./framework/router');
var schema = require('./schema');

/**
 * Initialize a new `Framework`.
 *
 * @param {Object} options
 * @api public
 */

function Framework(options) {
  if (!(this instanceof Framework)) return new Framework(options);

  schema.validateThrow(schema.options.framework, options);

  this.spec = {
    swaggerVersion: '1.2',
    basePath: options.basePath,
    apiVersion: options.apiVersion || '0.0.0',
    apis: [],
    authorizations: options.authorizations,
  };

  this.docs = new Docs(this);
  this._router = new Router(this);

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
  schema.validateThrow(schema.swagger.model, spec);

  this.models[spec.id] = spec;
};

/**
 * Return request listener.
 *
 * @param {Object} options
 * @api public
 */

Framework.prototype.dispatcher = function(options) {
  return this._router.dispatcher(options);
};

/**
 * Expose Framework.
 */

module.exports = Framework;
