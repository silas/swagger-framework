'use strict';

/**
 * Module dependencies.
 */

var Operation = require('./operation');
var schema = require('./schema');
var utils = require('./utils');

/**
 * Initialize a new `Resource`.
 *
 * @param {Api} api
 * @param {Object} spec
 * @api private
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
  if (this.api) {
    throw new Error('resource already setup');
  }

  api.framework.env.validateThrow(schema.swagger.resource, this.spec);

  if (this.spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  // add api path if not set
  if (api.spec.path !== this.spec.path.slice(0, api.spec.path.length)) {
    this.spec.path = utils.stripSlash(api.spec.path) + this.spec.path;
  }

  this.api = this._parent = api;
};

/**
 * Declare a resources method.
 *
 * @param {Object} spec
 * @param {Function} fn
 * @api private
 */

Resource.prototype.operation = function(spec, fn) {
  var operation = spec instanceof Operation ? spec : new Operation(spec, fn);

  operation.setup(this);

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
