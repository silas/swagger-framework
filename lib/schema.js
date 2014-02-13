'use strict';

/**
 * Module dependencies.
 */

var ZSchema = require('z-schema');
var fs = require('fs');
var path = require('path');

/**
 * ZSchema
 */

var sync = new ZSchema({ sync: true });

/**
 * Synchronously validate and throw on error
 */

function validateThrow(data, schema, message) {
  if (!sync.validate(data, schema)) {
    var err = new Error(message || 'invalid');
    err.report = sync.getLastError();
    err.message += '\n' + JSON.stringify(err.report, null, 4);
    throw err;
  }
}

/**
 * Load JSON from file.
 */

function load(name) {
  var filePath = path.join(__dirname, 'schema', name + '.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * JSON Schema
 */

var v4 = load('schema');

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

swagger.declaration = load('api-declaration-schema');
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

exports.options = options;
exports.swagger = swagger;
exports.validateThrow = validateThrow;
