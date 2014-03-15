/**
 * Api implements a Swagger API endpoint, it validates the API spec and
 * contains a list of resources under the API endpoint.
 */

'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var apiSchema = require('swagger-schema/data/api');
var debug = require('debug')('swagger-framework:api');
var lodash = require('lodash');
var modelSchema = require('swagger-schema/data/model');
var transform = require('swagger-schema/transform');

var Resource = require('./resource');

/**
 * Initialize a new `Api`.
 *
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

function Api(spec, options) {
  if (!(this instanceof Api)) {
    return new Api(spec, options);
  }

  if (typeof spec !== 'object') {
    throw new Error('api spec must be an object');
  }

  debug('create api %s', spec.path, spec);

  this.env = new Environment();
  this.env.setupValidation();

  this.spec = spec;
  this.spec.apis = [];
  this.options = options || {};

  this.middleware = {};
  this.models = {};
  this.nicknames = {};
  this.resources = {};
}

/**
 * Setup api.
 *
 * @param {Framework} framework
 * @api private
 */

Api.prototype.setup = function(framework) {
  var self = this;

  debug('setup api %s', this.spec.path);

  this.env.validateThrow(apiSchema, this.spec);

  if (this.spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  this.framework = this.parent = framework;

  lodash.forOwn(this.resources, function(resource) {
    resource.setup(self);
  });
};

/**
 * Declare a resource on Api.
 *
 * @param {Resource|Object} spec
 * @api public
 */

Api.prototype.resource = function(spec) {
  var resource = spec instanceof Resource ? spec : new Resource(spec);

  debug('register resource %s', spec.path);

  if (this.resources[resource.spec.path]) {
    throw new Error('Resource ' + resource.spec.path + ' already defined.');
  }

  this.resources[resource.spec.path] = resource;
  this.spec.apis.push(resource.spec.path);

  return resource;
};

/**
 * Declare a model.
 *
 * @param {Object} spec
 * @api public
 */

Api.prototype.model = function(spec) {
  this.env.validateThrow(modelSchema, spec);

  debug('register model ' + spec.id);

  if (this.models[spec.id]) {
    throw new Error('Model ' + spec.id + ' already defined.');
  }

  this.env.addSchema(spec.id, transform.model(spec));

  this.models[spec.id] = spec;
};

/**
 * Expose Api.
 */

module.exports = Api;
