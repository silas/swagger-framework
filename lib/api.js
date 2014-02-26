/**
 * Api implements a Swagger API endpoint, it validates the API spec and
 * contains a list of resources under the API endpoint.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var Resource = require('./resource');
var schema = require('./schema');

/**
 * Initialize a new `Api`.
 *
 * @param {Object} spec
 * @api private
 */

function Api(spec) {
  if (!(this instanceof Api)) {
    return new Api(spec);
  }

  this.spec = spec;
  this.spec.apis = [];

  this.middleware = {};
  this.resources = {};
}

/**
 * Convert to string representation.
 *
 * @api private
 */

Api.prototype.toString = function() {
  return JSON.stringify(this.spec, null, 4);
};

/**
 * Setup api.
 *
 * @param {Framework} framework
 * @api private
 */

Api.prototype.setup = function(framework) {
  var self = this;

  framework.env.validateThrow(schema.swagger.api, this.spec);

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

  if (this.resources[resource.spec.path]) {
    throw new Error('Resource ' + resource.spec.path + ' already defined.');
  }

  this.resources[resource.spec.path] = resource;
  this.spec.apis.push(resource.spec.path);

  return resource;
};

/**
 * Expose Api.
 */

module.exports = Api;
