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

function Operation(spec, fn) {
  if (!(this instanceof Operation)) {
    return new Operation(spec, fn);
  }

  this.spec = spec;
  this.fn = fn;
  this.middleware = {};
}

/**
 * Setup operation.
 *
 * @param {Resource} resource
 * @api private
 */

Operation.prototype.setup = function(resource) {
  resource.api.framework.env.validateThrow(schema.swagger.operation, this.spec);

  this.resource = this._parent = resource;
};

/**
 * Expose Operation.
 */

module.exports = Operation;
