/**
 * Resource implements a Swagger API within a API declaration, it validates the
 * resource spec and contains a list of resource operations.
 *
 * It encapsulates the path (ex: /pet) related metadata.
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('swagger-framework:resource');
var lodash = require('lodash');
var resourceSchema = require('swagger-schema/data/resource');
var utils = require('swagger-schema/utils');

var Operation = require('./operation');

/**
 * Initialize a new `Resource`.
 *
 * @param {Object} spec
 * @param {Object} options
 * @api public
 */

function Resource(spec, options) {
  if (!(this instanceof Resource)) {
    return new Resource(spec, options);
  }

  if (typeof spec !== 'object') {
    throw new Error('resource spec must be an object');
  }

  debug('create resource %s', spec.path, spec);

  this.spec = spec;
  this.spec.operations = [];
  this.options = options || {};

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

  debug('setup resource ' + this.spec.path);

  api.framework.env.validateThrow(resourceSchema, self.spec);

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

Resource.prototype.operation = function(spec) {
  var operation = spec instanceof Operation ?
    spec :
    Operation.apply(this, [].slice.call(arguments));

  if (!operation.fn || !operation.fn.legnth) {
    operation.fn = [].slice.call(arguments).slice(1);
  }

  if (this.operations[operation.spec.method]) {
    throw new Error('Operation ' + operation.spec.method + ' ' +
                    this.spec.path + ' already defined.');
  }

  this.operations[operation.spec.method] = operation;
  this.spec.operations.push(operation.spec.method);

  return operation;
};

/**
 * Expose Resource.
 */

module.exports = Resource;
