'use strict';

/**
 * Module dependencies.
 */

var schema = require('./schema');

/**
 * Initialize a new `Operation`.
 *
 * @param {Resource} resource
 * @param {Object} spec
 * @param {Function} fn
 * @api private
 */

function Operation(resource, spec, fn) {
  resource.api.framework.env.validateThrow(schema.swagger.operation, spec);

  if (typeof fn !== 'function') {
    throw new Error('invalid operation function');
  }

  this.fn = fn;
  this.resource = this._parent = resource;
  this.spec = spec;

  this.middleware = {};
}

/**
 * Expose Operation.
 */

module.exports = Operation;
