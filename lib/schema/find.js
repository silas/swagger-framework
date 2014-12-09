/**
 * Find attributes in Swagger specs.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var constants = require('./constants');

/**
 * Find model.
 */

function model(obj) {
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
  if (constants.notModel.indexOf(obj) >= 0) return;

  return obj;
}

/**
 * Find models.
 */

function models(spec) {
  var ids = {};

  if (!spec) return ids;

  var add = function(obj) {
    var type = model(obj);
    if (type) ids[type] = true;
  };

  add(spec);

  if (spec.properties) {
    lodash.forOwn(spec.properties, function(p) { add(p); });
  } else if (spec.parameters) {
    spec.parameters.forEach(function(p) { add(p); });
  }

  return Object.keys(ids);
}

/**
 * Expose find.
 */

exports.model = model;
exports.models = models;
