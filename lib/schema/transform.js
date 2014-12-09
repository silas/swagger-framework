/**
 * Transform Swagger specs to JSON Schema.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var constants = require('./constants');

/**
 * Traverse object.
 */

function traverse(value, cbs) {
  cbs = cbs || {};

  if (Array.isArray(value)) {
    if (cbs.beforeArray) value = cbs.beforeArray(value, cbs);

    value = value.map(function(v) {
      return traverse(v, cbs);
    });

    if (cbs.afterArray) value = cbs.afterArray(value, cbs);
  } else if (typeof value === 'object') {
    if (cbs.beforeObject) value = cbs.beforeObject(value, cbs);

    Object.keys(value).forEach(function(key) {
      value[key] = traverse(value[key], cbs);
    });

    if (cbs.afterObject) value = cbs.afterObject(value, cbs);
  }

  return value;
}

/**
 * Transform Swagger spec.
 */

function transform(value, options) {
  options = options || {};

  return traverse(value, {
    beforeObject: function(v) {
      if (options.removeFormats &&
          typeof v.format === 'string' &&
          typeof v.type === 'string' &&
          v.type !== 'string') {
        delete v.format;
      }

      return v;
    },
    afterObject: function(v) {
      if (options.convertRefs &&
          typeof v.type === 'string' &&
          constants.notModel.indexOf(v.type) < 0) {
        return { $ref: v.type };
      }

      return v;
    },
  });
}

/**
 * Transform Swagger parameters into JSON Schema object by paramType.
 */

function parameters(spec, paramType) {
  spec = lodash.cloneDeep(spec);

  var schema = {
    type: 'object',
    properties: {},
    required: [],
  };

  spec.parameters.forEach(function(parameter) {
    // only get rules for current paramType
    if (parameter.paramType !== paramType) return;

    // create current property
    var property = schema.properties[parameter.name] = {
      type: parameter.type,
    };

    switch (parameter.type) {
    case 'integer':
      property.type = parameter.type;

      ['minimum', 'maximum'].forEach(function(key) {
        if (parameter.hasOwnProperty(key)) {
          property[key] = parseInt(parameter[key], 10);
        }
      });

      break;
    case 'number':
      property.type = parameter.type;

      break;
    case 'string':
      property.type = parameter.type;

      if (parameter.hasOwnProperty('minimum')) {
        property.minLength = parseInt(parameter.minimum, 10);
      }

      if (parameter.hasOwnProperty('maximum')) {
        property.maxLength = parseInt(parameter.maximum, 10);
      }

      break;
    case 'boolean':
      property.type = parameter.type;

      break;
    case 'array':
      property.type = parameter.type;
      property.items = parameter.items;

      if (parameter.uniqueItems) property.uniqueItems = true;

      break;
    default:
      if (paramType === 'body') {
        property.$ref = parameter.type;
        lodash.keys(property).forEach(function(key) {
          if (key !== '$ref') delete property[key];
        });
      } else {
        throw new Error('unknown type: ' + parameter.type);
      }
    }

    if (Array.isArray(parameter.enum)) {
      property.enum = parameter.enum;
    }

    var hasDefault = parameter.hasOwnProperty('defaultValue');

    if (hasDefault) {
      property.default = parameter.defaultValue;
    }

    // path rules are implicitly required
    if (!hasDefault && (parameter.required || paramType === 'path')) {
      schema.required.push(parameter.name);
    }

    // convert to items if allowMultiple
    if (parameter.allowMultiple &&
        constants.allowMultiple.indexOf(parameter.paramType) >= 0) {
      schema.properties[parameter.name] = {
        type: 'array',
        items: property,
      };
    }
  });

  if (!schema.required.length) delete schema.required;

  if (lodash.isEmpty(schema.properties)) return;

  return schema;
}

/**
 * Convert Swagger model to JSON Schema.
 */

function model(spec) {
  var schema = lodash.cloneDeep(spec);

  delete schema.id;

  schema = transform(schema, {
    removeFormats: true,
  });

  return schema;
}

/**
 * Expose transform.
 */

exports.model = model;
exports.parameters = parameters;
