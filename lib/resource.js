'use strict';

/**
 * Module dependencies.
 */

var Operation = require('./operation');

/**
 * Initialize a new `Resource`.
 *
 * @param {Api} api
 * @param {String} path
 * @api private
 */

function Resource(api, path) {
  if (!path) {
    throw new Error('path required');
  }

  if (path[0] !== '/') {
    throw new Error('path must start with /');
  }

  this.api = api;
  this.path = path;

  this.middleware = {};
  this.operations = {};
}

/**
 * Declare a resources method.
 *
 * @param {Object} spec
 * @param {Object} options
 * @param {Function} fn
 * @api private
 */

Resource.prototype.operation = function(spec, options, fn) {
  var operation = new Operation(this, spec, fn);

  // ensure only defined once
  if (this.operations[operation.method]) {
    throw new Error('redefined resource: ' + operation.method +
                    ' ' + this.path);
  }

  this.operations[spec.method] = operation;
  operation._parent = this;
};

/**
 * Expose Resource.
 */

module.exports = Resource;
