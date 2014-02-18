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

function Api(spec) {
  schema.validateThrow(schema.swagger.api, spec);

  if (spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  this.spec = spec;

  this.middleware = {};
  this.resources = {};
}

/**
 * Declare a resource.
 *
 * @param {Object} spec
 * @param {Object} options
 * @param {Function} fn
 * @api public
 */

Api.prototype.resource = function(spec, options, fn) {
  var resource = this.resources[spec.path];

  if (!resource) {
    resource = this.resources[spec.path] = new Resource(this, spec.path);
    resource._parent = this;
  }

  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  // declare operation
  resource.operation(spec, options, fn);
};

/**
 * Expose Api.
 */

module.exports = Api;
