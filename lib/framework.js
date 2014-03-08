/**
 * Framework is a container for everything, it contains all the apis and
 * models, and various helper functions.
 */

'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var debug = require('debug')('swagger-framework:framework');
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
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

function Framework(spec, options) {
  if (!(this instanceof Framework)) {
    return new Framework(spec, options);
  }

  debug('create framework', spec);

  this.env = new Environment();
  this.env.setupValidation();

  this.env.validateThrow(frameworkSchema, spec);

  this.spec = {
    swaggerVersion: '1.2',
    basePath: spec.basePath,
    apiVersion: spec.apiVersion || '0.0.0',
    apis: [],
    authorizations: spec.authorizations || {},
  };
  this.options = options || {};

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

  debug('setup framework');

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

  debug('register api ' + spec.path);

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

  debug('register model ' + spec.id);

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
