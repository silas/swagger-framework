/**
 * Docs parses the content of a Framework object and returns Swagger API
 * content that can be rendered as JSON.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var utils = require('swagger-schema/utils');

/**
 * Initialize a new `Docs`.
 *
 * @param {Object} options
 * @api private
 */

function Docs(framework) {
  this.framework = framework;
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
 * Output API index.
 *
 * @api public
 */

Docs.prototype.index = function() {
  this.setup();

  var spec = lodash.pick(
    this.framework.spec,
    'apiVersion',
    'swaggerVersion',
    'apis',
    'authorizations'
  );

  // remove optional/empty values
  ['authorizations'].forEach(function(key) {
    if (lodash.isEmpty(spec[key])) {
      delete spec[key];
    }
  });

  var apis = this.framework.apis;

  // Build apis
  spec.apis = spec.apis.map(function(path) {
    return lodash.pick(apis[path].spec, 'path', 'description');
  });

  return spec;
};

/**
 * Output API declaration.
 *
 * @api public
 */

Docs.prototype.declaration = function(path) {
  this.setup();

  var api = this.framework.apis[path];

  if (!api) return;

  var spec = {
    apiVersion: this.framework.spec.apiVersion,
    swaggerVersion: this.framework.spec.swaggerVersion,
    basePath: api.basePath || this.framework.spec.basePath,
    resourcePath: path,
    description: api.spec.description,
    consumes: api.spec.consumes,
    produces: api.spec.produces,
    authorizations: api.spec.authorizations,
    apis: api.spec.apis,
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

  spec.apis = spec.apis.map(function(path) {
    var resource = api.resources[path];
    var spec = lodash.pick(resource.spec, 'path', 'operations');

    spec.operations = spec.operations.map(function(method) {
      var operation = resource.operations[method];

      // merge models
      lodash.merge(models, utils.getOperationModels(operation.spec));

      return operation.spec;
    });

    return spec;
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
      if (!this.framework.models[key]) continue;

      // discover models in model
      var newModels = utils.getModels(this.framework.models[key]);

      // add unknown models
      for (var j = 0; j < newModels.length; j++) {
        if (!models[newModels[j]]) models[newModels[j]] = true;
      }

      spec.models[key] = this.framework.models[key];
    }
  }

  return spec;
};

/**
 * Ensure framework setup.
 *
 * @api private
 */

Docs.prototype.setup = function() {
  if (this._setup) return;
  this.framework.setup();
  this._setup = true;
};

/**
 * Expose Docs.
 */

module.exports = Docs;
