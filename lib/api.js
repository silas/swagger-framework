/**
 * Api implements a Swagger API endpoint, it validates the API spec and
 * contains a list of resources under the API endpoint.
 */

'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var debug = require('debug')('swagger-framework:api');
var lodash = require('lodash');
var schema = require('swagger-schema/spec');
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

  options = options || {};

  // path alias for both resourcePath and doc path
  if (spec.path) {
    if (!spec.resourcePath) spec.resourcePath = spec.path;
    if (!options.path) options.path = spec.path;
    delete spec.path;
  }

  // allow user to pass description in spec
  if (spec.description) {
    if (!options.description) options.description = spec.description;
    delete spec.description;
  }

  // user resourcePath for doc path if not set
  if (!options.path && spec.resourcePath) {
    options.path = spec.resourcePath;
  }

  debug('create api %s', spec.resourcePath, spec);

  this.env = new Environment();

  this.spec = spec;
  this.list = [];
  this.options = options;

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

  debug('setup api %s', this.spec.resourcePath);

  this.spec = lodash.defaults(this.spec, {
    swaggerVersion: '1.2',
    basePath: framework.options.basePath,
    apis: [],
    models: {},
  });

  schema.validateThrow('ApiDeclaration', this.spec);

  this.framework = this.parent = framework;

  lodash.forOwn(this.resources, function(resource) {
    resource.setup(self);
  });
};

/**
 * Declare a resource on Api.
 *
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

Api.prototype.resource = function(spec, options) {
  var resource = spec instanceof Resource ? spec : new Resource(spec, options);

  debug('register resource %s', spec.path);

  if (this.resources[resource.spec.path]) {
    throw new Error('Resource ' + resource.spec.path + ' already defined.');
  }

  this.resources[resource.spec.path] = resource;
  this.list.push(resource.spec.path);

  return resource;
};

/**
 * Declare a model.
 *
 * @param {Object} spec
 * @api public
 */

Api.prototype.model = function(spec) {
  schema.validateThrow('ModelObject', spec);

  debug('register model ' + spec.id);

  if (this.models[spec.id]) {
    throw new Error('Model ' + spec.id + ' already defined.');
  }

  this.env.addSchema(spec.id, transform.model(spec));

  this.models[spec.id] = spec;
};

/**
 * Get option.
 */

Api.prototype.option = function(key, defaultValue) {
  if (this.options.hasOwnProperty(key)) {
    return this.options[key];
  }

  if (this.framework) {
    return this.framework.option(key, defaultValue);
  }

  return defaultValue;
};

/**
 * Expose Api.
 */

module.exports = Api;
