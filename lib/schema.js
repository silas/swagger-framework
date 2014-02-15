'use strict';

/**
 * Module dependencies.
 */

var jjv = require('jjv');

/**
 * Schema environment
 */

var env = jjv();

/**
 * Validate
 */

function validate(schema, data) {
  return env.validate(schema, data);
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
  title: 'Declare options',
  type: 'object',
  properties: {
    path: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
  required: ['path', 'description'],
};

swagger.resource = {
  title: 'Swagger API',
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
