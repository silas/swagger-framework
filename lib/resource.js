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

function Resource(api, spec) {
  api.framework.env.validateThrow(schema.swagger.resource, spec);

  if (spec.path[0] !== '/') {
    throw new Error('path must start with /');
  }

  // add api path if not set
  if (api.spec.path !== spec.path.slice(0, api.spec.path.length)) {
    spec.path = utils.stripSlash(api.spec.path) + spec.path;
  }

  this.api = this._parent = api;
  this.spec = spec;
  this.spec.operations = [];

  this.middleware = {};
  this.operations = {};
}

/**
 * Declare a resources method.
 *
 * @param {Object} spec
 * @param {Function} fn
 * @api private
 */

Resource.prototype.operation = function(spec, fn) {
  var operation = new Operation(this, spec, fn);

  // ensure only defined once
  if (this.operations[spec.method]) {
    throw new Error('redefined resource: ' + spec.method +
                    ' ' + this.spec.path);
  }

  this.operations[spec.method] = operation;
  this.spec.operations.push(spec.method);

  return operation;
};

/**
 * Expose Resource.
 */

module.exports = Resource;
