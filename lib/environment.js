'use strict';

/**
 * Module dependencies.
 */

var jjv = require('jjv');

var v4 = require('./schema/schema.json');

/**
 * Initialize a new `Environment`.
 *
 * @param {Object} options
 * @api public
 */

function Environment(options) {
  if (!(this instanceof Environment)) {
    return new Environment(options);
  }

  this.schema = jjv();
  this.coerceSchema = jjv();
  this.schemas = [this.schema, this.coerceSchema];
}

Environment.prototype.setupValidation = function() {
  this.schemas.forEach(function(env) {
    env.addSchema('http://json-schema.org/draft-04/schema', v4);
  });

  this.coerceSchema.addTypeCoercion('integer', function(v) {
    if (typeof v === 'string' && v.match(/^\-?\d+$/)) {
      return parseInt(v, 10);
    }
    return v;
  });

  this.coerceSchema.addTypeCoercion('number', function(v) {
    if (typeof v === 'string' && v.match(/^(\d+|\d*\.\d+|\d+\.\d*)$/)) {
      return parseFloat(v);
    }
    return v;
  });

  this.coerceSchema.addTypeCoercion('boolean', function(v) {
    if (typeof v === 'string') {
      return ['', '0', 'false', 'no'].indexOf(v) < 0;
    }
    return v;
  });
};

Environment.prototype.validate = function(schema, data, options) {
  options = options || {};
  if (options.coerce) {
    return this.coerceSchema.validate(schema, data);
  }
  return this.schema.validate(schema, data);
};

Environment.prototype.validateThrow = function(schema, data, message) {
  var errors = this.schema.validate(schema, data);

  if (errors) {
    var err = new Error(message || 'invalid');
    err.errors = errors;
    err.message += '\n' + JSON.stringify(errors, null, 4);
    throw err;
  }
};

Environment.prototype.addSchema = function(name, data) {
  this.schemas.forEach(function(env) {
    env.addSchema(name, data);
  });
};

/**
 * Expose Environment.
 */

module.exports = Environment;
