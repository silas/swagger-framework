'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var Operation = require('./operation');
var schema = require('./schema');
var utils = require('./utils');

/**
 * Initialize a new `Resource`.
 *
 * @param {Object} spec
 * @api public
 */

function Resource(spec) {
  if (!(this instanceof Resource)) {
    return new Resource(spec);
  }

  this.spec = spec;
  this.spec.operations = [];

  this.middleware = {};
  this.operations = {};
}

/**
 * Setup resource.
 *
 * @param {Api} api
 * @api private
 */

Resource.prototype.setup = function(api) {
  var self = this;

  api.framework.env.validateThrow(schema.swagger.resource, self.spec);

  if (self.spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  // insert api path prefix if not already there
  if (api.spec.path !== self.spec.path.slice(0, api.spec.path.length)) {
    self.spec.path = utils.stripSlash(api.spec.path) + self.spec.path;
  }

  self.api = self.parent = api;

  lodash.forOwn(self.operations, function(operation) {
    operation.setup(self);
  });
};

/**
 * Declare an operation for resource.
 *
 * @param {Operation|Object} spec
 * @param {Function} fn
 * @api public
 */

Resource.prototype.operation = function(spec, fn) {
  var operation = spec instanceof Operation ? spec : new Operation(spec, fn);

  if (!operation.fn && fn) {
    operation.fn = fn;
  }

  if (!this.operations[operation.spec.method]) {
    this.operations[operation.spec.method] = operation;
    this.spec.operations.push(operation.spec.method);
  }

  return operation;
};

/**
 * Expose Resource.
 */

module.exports = Resource;
