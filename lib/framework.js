/**
 * Framework is a container for everything, it contains all the apis and
 * models, and various helper functions.
 */

'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var frameworkSchema = require('swagger-schema/data/framework');
var lodash = require('lodash');
var modelSchema = require('swagger-schema/data/model');
var utils = require('swagger-schema/utils');

var Api = require('./api');
var Docs = require('./docs');
var Router = require('./framework/router');

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
  this.env.setupValidation();

  this.env.validateThrow(frameworkSchema, options);

  this.spec = {
    swaggerVersion: '1.2',
    basePath: options.basePath,
    apiVersion: options.apiVersion || '0.0.0',
    apis: [],
    authorizations: options.authorizations || {},
  };

  this.docs = new Docs(this);
  this.router = new Router(this);

  this.apis = {};
  this.middleware = {};
  this.models = {};
}

/**
 * Setup and validate.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.setup = function() {
  var self = this;

  lodash.forOwn(this.apis, function(api) {
    api.setup(self);
  });
};

/**
 * Declare an API.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.api = function(spec) {
  var api = spec instanceof Api ? spec : new Api(spec);

  if (this.apis[api.spec.path]) {
    throw new Error('Api ' + api.spec.path + ' already defined.');
  }

  this.spec.apis.push(api.spec.path);
  this.apis[api.spec.path] = api;

  return api;
};

/**
 * Declare a model.
 *
 * @param {Object} spec
 * @api public
 */

Framework.prototype.model = function(spec) {
  this.env.validateThrow(modelSchema, spec);

  if (this.models[spec.id]) {
    throw new Error('Model ' + spec.id + ' already defined.');
  }

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
  this.setup();

  return this.router.dispatcher(options);
};

/**
 * Expose Framework.
 */

module.exports = Framework;
