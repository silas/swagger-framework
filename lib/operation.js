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
  schema.validateThrow(schema.swagger.resource, spec);

  if (typeof fn !== 'function') {
    throw new Error('invalid operation function');
  }

  this.method = spec.method;
  this.resource = resource;
  this.spec = spec;
  this.fn = fn;

  // not part of operations spec
  delete this.spec.path;
}

/**
 * Expose Operation.
 */

module.exports = Operation;
