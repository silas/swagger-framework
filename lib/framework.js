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

  this.docs = new Docs({
    basePath: options.basePath,
    apiVersion: options.apiVersion,
  });

  this.apis = {};
  this.models = {};

  this._router = new Router(this);
}

/**
 * Declare an API.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.api = function(spec) {
  var api = new Api(spec);

  if (this.apis[spec.path]) {
    throw new Error('api already defined');
  }

  this.apis[spec.path] = api;

  this.docs.api(api);

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

  this.docs.model(spec);
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
