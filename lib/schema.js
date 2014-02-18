'use strict';

/**
 * Module dependencies.
 */

var jjv = require('jjv');

/**
 * Schema environment
 */

var env = jjv();
var coerceEnv = jjv();

coerceEnv.addTypeCoercion('integer', function(v) {
  if (typeof v === 'string' && v.match(/^\-?\d+$/)) {
    return parseInt(v, 10);
  }
  return v;
});

coerceEnv.addTypeCoercion('number', function(v) {
  if (typeof v === 'string' && v.match(/^(\d+|\d*\.\d+|\d+\.\d*)$/)) {
    return parseFloat(v);
  }
  return v;
});

coerceEnv.addTypeCoercion('boolean', function(v) {
  if (typeof v === 'string') {
    return ['', '0', 'false', 'no'].indexOf(v) < 0;
  }
  return v;
});

/**
 * Validate
 */

function validate(schema, data, opts) {
  opts = opts || {};
  if (opts.coerce) {
    return coerceEnv.validate(schema, data);
  } else {
    return env.validate(schema, data);
  }
}

/**
 * Validate and throw on error
 */

function validateThrow(schema, data, message) {
  var errors = env.validate(schema, data);

  if (errors) {
    var err = new Error(message || 'invalid');
    err.errors = errors;
    err.message += '\n' + JSON.stringify(errors, null, 4);
    throw err;
  }
}

/**
 * JSON Schema
 */

var v4 = require('./schema/schema.json');

/**
 * Options schemas
 */

var options = {};

options.framework = {
  title: 'Strut options',
  type: 'object',
  properties: {
    apiVersion: {
      type: 'string',
    },
    apiDocsPath: {
      type: 'string',
    },
    basePath: {
      type: 'string',
    },
    callbacks: {
      type: 'object',
    },
  },
  required: ['basePath'],
};

/**
 * Swagger schemas
 */

var swagger = {};

swagger.declaration = require('./schema/api-declaration-schema.json');
swagger.declaration.definitions = v4.definitions;
delete swagger.declaration.$schema;

var resource = swagger.declaration.
  properties.apis.items[0].properties.operations.items[0];

swagger.api = {
  title: 'Swagger API',
  type: 'object',
  properties: {
    path: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    consumes: {
      type: 'array',
      items: {
        type: 'string'
      },
    },
    produces: {
      type: 'array',
      items: {
        type: 'string'
      },
    },
  },
  required: ['path', 'description'],
};

swagger.resource = {
  title: 'Swagger Resource',
  type: 'object',
  properties: {
    path: {
      type: 'string',
    },
  },
  required: ['path'],
};

swagger.operation = {
  title: 'Swagger Operation',
  type: 'object',
  properties: resource.properties,
  required: resource.required,
  definitions: v4.definitions,
};

swagger.model = {
  title: 'Swagger Model',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    required: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['id'],
};

/**
 * Expose schema.
 */

exports.validate = validate;
exports.options = options;
exports.swagger = swagger;
exports.validateThrow = validateThrow;
