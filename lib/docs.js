'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var utils = require('./utils');

/**
 * Initialize a new `Docs`.
 *
 * @param {Object} options
 * @api private
 */

function Docs(options) {
  options = options || {};

  this.swaggerVersion = '1.2';
  this.basePath = options.basePath;
  this.apiVersion = options.apiVersion || '0.0.0';

  this.apis = [];
  this.models = {};
}

/**
 * Return dispatcher.
 *
 * @param {Object} options
 * @api public
 */

Docs.prototype.dispatcher = function(options) {
  var Router = require('./docs/router');
  return new Router(this, options).dispatcher();
};

/**
 * Add an API.
 *
 * @param {Api} api
 * @api public
 */

Docs.prototype.api = function(api) {
  this.apis.push(api);
};

/**
 * Add a model.
 *
 * @param {Object} model
 * @api private
 */

Docs.prototype.model = function(model) {
  this.models[model.id] = model;
};

/**
 * Output API list.
 *
 * @api public
 */

Docs.prototype.list = function() {
  var apis = [];

  lodash.forOwn(this.apis, function(api) {
    apis.push({
      path: api.spec.path,
      description: api.spec.description,
    });
  });

  return {
    apiVersion: this.apiVersion,
    swaggerVersion: this.swaggerVersion,
    apis: apis,
  };
};

/**
 * Output API declaration.
 *
 * @api public
 */

Docs.prototype.declaration = function(path) {
  var api = lodash.find(this.apis, function(api) {
    return api.spec.path === path;
  });

  if (!api) return;

  var spec = {
    apiVersion: this.apiVersion,
    swaggerVersion: this.swaggerVersion,
    basePath: api.basePath || this.basePath,
    resourcePath: path,
    description: api.spec.description,
    consumes: api.spec.consumes,
    produces: api.spec.produces,
    authorizations: api.spec.authorizations,
    apis: [],
    models: {},
  };

  var optional = [
    'description',
    'consumes',
    'produces',
    'authorizations',
  ];

  optional.forEach(function(key) {
    if (lodash.isEmpty(spec[key])) {
      delete spec[key];
    }
  });

  var models = {};

  lodash.forOwn(api.resources, function(resource) {
    var declare = {
      path: resource.spec.path,
      operations: [],
    };

    lodash.forOwn(resource.operations, function(operation) {
      declare.operations.push(operation.spec);

      lodash.merge(models, utils.getOperationModels(operation.spec));
    });

    spec.apis.push(declare);
  });

  // Merge in all required models, loop until we haven't found any more
  // models.

  var length = -1;

  while (Object.keys(models).length !== length) {
    length = Object.keys(models).length;

    var keys = Object.keys(models);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      // skip already checked models
      if (spec.models[key]) continue;
      // skip undeclared models
      if (!this.models[key]) continue;

      // discover models in model
      var newModels = utils.getModels(this.models[key]);

      // add unknown models
      for (var j = 0; j < newModels.length; j++) {
        if (!models[newModels[j]]) models[newModels[j]] = true;
      }

      spec.models[key] = this.models[key];
    }
  }

  return spec;
};

/**
 * Expose Docs.
 */

module.exports = Docs;
