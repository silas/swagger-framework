'use strict';

/**
 * Module dependencies.
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

exports.options = options;
exports.swagger = swagger;
