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
  schema.validateThrow(schema.swagger.api, spec);

  if (spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  this.framework = this._parent = framework;
  this.spec = spec;

  this.middleware = {};
  this.resources = {};
}

/**
 * Declare a resource.
 *
 * @param {String} path
 * @api public
 */

Api.prototype.resource = function(path) {
  var resource = this.resources[path];

  if (!resource) {
    resource = this.resources[path] = new Resource(this, path);
  }

  return resource;
};

/**
 * Expose Api.
 */

module.exports = Api;
