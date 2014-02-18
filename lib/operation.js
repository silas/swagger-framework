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
  schema.validateThrow(schema.swagger.operation, spec);

  if (typeof fn !== 'function') {
    throw new Error('invalid operation function');
  }

  this.fn = fn;
  this.resource = this._parent = resource;
  this.spec = spec;

  this.middleware = {};
}

/**
 * Find authentication for operation.
 *
 * @api public
 */

Operation.prototype.auth = function() {
  return this.spec.authorizations ||
    this.resource.api.spec.authorizations;
};

/**
 * Expose Operation.
 */

module.exports = Operation;
