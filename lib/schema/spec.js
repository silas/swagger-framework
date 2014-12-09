/**
 * Schema environment.
 */

'use strict';

/* jshint camelcase: false */

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var Environment = require('./environment');
var spec = require('../spec');

/**
 * Schema
 */

var env = new Environment();

spec.v1_2.forEach(function(s) {
  var path = 'http://wordnik.github.io/schemas/v1.2/';

  // remove path prefix
  if (s.id.slice(0, path.length) === path) {
    s.id = s.id.slice(path.length);
  }

  // strip trailing hash
  if (s.id[s.id.length - 1] === '#') {
    s.id = s.id.slice(0, s.id.length - 1);
  }

  switch (s.id) {
    case 'apiDeclaration.json':
      var apiObject = lodash.cloneDeep(s.definitions.apiObject);
      apiObject.required = apiObject.required.filter(function(v) {
        return v !== 'operations';
      });
      env.addSchema('ApiDeclaration', s);
      env.addSchema('ApiObject', apiObject);
      break;
    case 'modelsObject.json':
      env.addSchema('ModelObject', s);
      break;
    case 'operationObject.json':
      env.addSchema('OperationObject', s);
      break;
    case 'resourceListing.json':
      env.addSchema('ResourceListing', s);
      break;
  }

  env.addSchema(s.id, s);
});

/**
 * Expose spec schema.
 */

module.exports = env;
