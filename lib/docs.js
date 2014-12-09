/**
 * Docs parses the content of a Framework object and returns Swagger API
 * content that can be rendered as JSON.
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('swagger-framework:docs');
var lodash = require('lodash');

var find = require('./schema/find');

/**
 * Initialize a new `Docs`.
 *
 * @param {Object} options
 * @api private
 */

function Docs(framework) {
  debug('create docs');

  this.framework = framework;
}

/**
 * Returns callback suitable `http.createServer()`.
 *
 * @param {Object} options
 * @api public
 */

Docs.prototype.dispatcher = function(options) {
  var Router = require('./docs/router');
  return new Router(this, options).dispatcher(options);
};

/**
 * Output API index.
 *
 * @api public
 */

Docs.prototype.index = function() {
  this.setup();

  var spec = lodash.omit(this.framework.spec);

  var apis = this.framework.apis;

  // Build apis
  spec.apis = spec.apis.map(function(path) {
    var item = apis[path];
    return {
      path: item.options.path,
      description: item.options.description || '',
    };
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

  var spec = lodash.cloneDeep(api.spec);

  spec = lodash.defaults(spec, {
    swaggerVersion: '1.2',
    resourcePath: path,
    apis: [],
    models: {},
  });

  var models = {};

  spec.apis = api.list.map(function(path) {
    var resource = api.resources[path];
    var spec = lodash.pick(resource.spec, 'path', 'operations');

    spec.operations = resource.list.map(function(method) {
      var operation = resource.operations[method];

      var operationModels = find.models(operation.spec);

      if (operationModels) {
        operationModels.forEach(function(name) {
          if (!models.hasOwnProperty(name)) {
            models[name] = true;
          }
        });
      }

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
      if (!api.models[key]) continue;

      // discover models in model
      var newModels = find.models(api.models[key]);

      // add unknown models
      for (var j = 0; j < newModels.length; j++) {
        if (!models[newModels[j]]) models[newModels[j]] = true;
      }

      spec.models[key] = api.models[key];
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
