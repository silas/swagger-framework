'use strict';

/**
 * Module dependencies.
 */

var Resource = require('./resource');
var schema = require('./schema');

/**
 * Initialize a new `Api`.
 *
 * @param {Object} spec
 * @api private
 */

function Api(framework, spec) {
  framework.env.validateThrow(schema.swagger.api, spec);

  if (spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  this.framework = this._parent = framework;
  this.spec = spec;
  this.spec.apis = [];

  this.middleware = {};
  this.resources = {};
}

/**
 * Declare a resource.
 *
 * @param {Object} spec
 * @api public
 */

Api.prototype.resource = function(spec) {
  var resource = this.resources[spec.path];

  if (!resource) {
    resource = this.resources[spec.path] = new Resource(this, spec);
    this.spec.apis.push(spec.path);
  }

  return resource;
};

/**
 * Expose Api.
 */

module.exports = Api;
