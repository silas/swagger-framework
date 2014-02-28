/**
 * Operation implements a Swagger operation, it validates the operation spec
 * and contains a reference to the router handler.
 *
 * It encapsulates the method (GET, POST, etc..) related metadata.
 */

'use strict';

/**
 * Module dependencies.
 */

var operationSchema = require('swagger-schema/data/operation');

/**
 * Initialize a new `Operation`.
 *
 * @param {Object} spec
 * @param {Function} fn
 * @api public
 */

function Operation(spec, fn) {
  if (!Array.isArray(fn)) {
    fn = [].slice.call(arguments).slice(1);
  }

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
  var spec = this.spec;

  resource.api.framework.env.validateThrow(operationSchema, spec);

  var unique = {};

  // check for duplicate parameters
  spec.parameters.forEach(function(parameter) {
    if (unique.hasOwnProperty(parameter.name)) {
      var err = new Error('Duplicate parameter name: ' + parameter.name);
      err.message += '\n' + JSON.stringify(spec, null, 4);
      throw err;
    }

    unique[parameter.name] = true;
  });

  // check for duplicate nicknames
  if (resource.api.nicknames.hasOwnProperty(spec.nickname) &&
      resource.api.nicknames[spec.nickname] !== this) {
    var conflict = resource.api.nicknames[spec.nickname];

    var err = new Error('Duplicate nickname: ' + spec.nickname);
    err.message += '\n' + JSON.stringify(spec, null, 4);
    err.message += '\nConflicts with:';
    err.message += '\n' + JSON.stringify(conflict.spec, null, 4);
    throw err;
  }

  resource.api.nicknames[spec.nickname] = this;

  this.resource = this.parent = resource;
};

/**
 * Expose Operation.
 */

module.exports = Operation;
