'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

/**
 * Helper variables.
 */

var primitives = [
  'array',
  'boolean',
  'integer',
  'string',
];

var notModel = [
  'null',
  'number',
  'object',
  'void',
].concat(primitives);

var formats = [
  'date',
  'date-time',
];

/**
 * Convert Swagger to JSON Schema.
 */

function convertSchema(schema) {
  if (!schema && !schema.properties && !schema.properties.length) {
    return schema;
  }

  schema = lodash.cloneDeep(schema);

  schema.properties = lodash.mapValues(schema.properties, function(property) {
    if (property.type === 'array') {
      property = property.items;
    }

    if (notModel.indexOf(property.type) < 0) {
      return { $ref: property.type };
    }

    // json schema only supports format on strings
    if (property.type !== 'string') {
      delete property.format;
    }

    // delete format's we don't support
    if (property.format && formats.indexOf(property.format) < 0) {
      delete property.format;
    }

    return property;
  });

  return schema;
}

/**
 * Create type specific validator
 */

function createParamTypeSchema(paramType, spec) {
  var schema, root;

  // convert swagger spec to json schema
  spec.parameters.forEach(function(parameter) {
    // only get rules for current paramType
    if (parameter.paramType !== paramType) return;

    if (!schema) {
      schema = {
        title: paramType + ' schema',
        type: 'object',
        properties: {},
        required: [paramType],
      };

      // gives more descriptive errors
      schema.properties[paramType] = {
        type: 'object',
        properties: {},
        required: [],
      };

      root = schema.properties[paramType];
    }

    // create current property
    var property = root.properties[parameter.name] = {
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
      // only add formats for known types
      if (formats.indexOf(parameter.format) >= 0) {
        property.format = parameter.format;
      }
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
      throw new Error('unknown type: ' + parameter.type);
    }

    if (Array.isArray(parameter.enum)) {
      property.enum = parameter.enum;
    }

    // path rules are implicitly required
    if (parameter.required || paramType === 'path') {
      root.required.push(parameter.name);
    }
  });

  if (!schema) return;
  if (!root.required.length) delete root.required;

  return schema;
}

/**
 * Escape regex.
 */

function escapeRegex(text) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Normalize objects with string values (query, params, etc..).
 */

function normalize(data, spec) {
  if (!data) return {};

  var values = {};

  // some express data structures look like an array, normalize to an object
  Object.keys(data).forEach(function(key) {
    values[key] = data[key];
  });

  values = lodash.cloneDeep(values);

  spec.parameters.forEach(function(parameter) {
    var name = parameter.name;
    var type = parameter.type;

    switch (type) {
    case 'integer':
      if (typeof values[name] === 'string') {
        if (values[name] === '') {
          delete values[name];
        } else if (values[name].match(/^\-?\d+$/)) {
          values[name] = parseInt(values[name], 10);
        }
      }
      break;
    case 'number':
      if (typeof values[name] === 'string') {
        if (values[name] === '') {
          delete values[name];
        } else if (values[name].match(/^\-?[\d\.]+$/)) {
          values[name] = parseFloat(values[name]);
        }
      }
      break;
    case 'boolean':
      if (typeof values[name] === 'string') {
        switch (values[name]) {
        case '0':
        case 'false':
        case '':
          values[name] = false;
          break;
        default:
          values[name] = true;
        }
      }
      break;
    }
  });

  return values;
}

/**
 * Get model from object.
 */

function getModel(obj) {
  if (!obj) return;

  if (obj.$ref) {
    obj = obj.$ref;
  } else if (obj.type === 'array' && obj.items && obj.items.$ref) {
    obj = obj.items.$ref;
  } else if (obj.type) {
    obj = obj.type;
  }

  // ensure valid type
  if (typeof obj !== 'string') return;
  // ensure non-builtin type
  if (notModel.indexOf(obj) >= 0) return;

  return obj;
}

/**
 * Get models from operation.
 */

function getOperationModels(spec) {
  var models = {};

  if (!spec) return models;

  var add = function(obj) {
    var type = getModel(obj);
    if (type) models[type] = true;
  };

  add(spec);

  spec.parameters.forEach(function(parameter) {
    add(parameter);
  });

  return models;
}

/**
 * Get models from models.
 */

function getModels(spec) {
  var models = {};

  if (!spec) return models;
  if (!spec.properties) return models;

  var add = function(obj) {
    var type = getModel(obj);
    if (type) models[type] = true;
  };

  lodash.forOwn(spec.properties, function(property) {
    add(property);
  });

  return Object.keys(models);
}

/**
 * Expose utils.
 */

exports.convertSchema = convertSchema;
exports.createParamTypeSchema = createParamTypeSchema;
exports.escapeRegex = escapeRegex;
exports.normalize = normalize;
exports.getOperationModels = getOperationModels;
exports.getModels = getModels;
