'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var utils = require('../utils');

/**
 * Express route to list APIs.
 *
 * @api private
 */

exports.index = function(server) {
  return function(req, res) {
    var apis = [];

    lodash.forOwn(server._apis, function(resource, path) {
      apis.push({
        path: path,
        description: resource.description,
      });
    });

    res.send(200, {
      apiVersion: server._options.apiVersion,
      swaggerVersion: server._options.swaggerVersion,
      apis: apis,
    });
  };
};

/**
 * Express route to display API declaration.
 *
 * @api private
 */

exports.declaration = function(server) {
  return function(req, res, next) {
    var path = req.params[0];
    var api = server._apis[path];

    if (!api) return next();

    var declaration = {
      apiVersion: server._options.apiVersion,
      swaggerVersion: server._options.swaggerVersion,
      basePath: api.basePath || server._options.basePath,
      resourcePath: path,
      apis: [],
      models: {},
    };

    var models = {};

    ['description'].forEach(function(key) {
      if (api[key]) declaration[key] = api[key];
    });

    lodash.forOwn(api.apis, function(api, path) {
      var declare = {
        path: path,
        operations: [],
      };

      lodash.forOwn(api, function(operation) {
        declare.operations.push(operation);

        lodash.merge(models, utils.getOperationModels(operation));
      });

      declaration.apis.push(declare);
    });

    var length = -1;

    // Merge in all required models, loop until we haven't found any more
    // models.
    while (Object.keys(models).length !== length) {
      length = Object.keys(models).length;

      var keys = Object.keys(models);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        // skip already checked models
        if (declaration.models[key]) continue;
        // skip undeclared models
        if (!server._models[key]) continue;

        // discover models in model
        var newModels = utils.getModels(server._models[key]);

        // add unknown models
        for (var j = 0; j < newModels.length; j++) {
          if (!models[newModels[j]]) models[newModels[j]] = true;
        }

        declaration.models[key] = server._models[key];
      }
    }

    res.send(200, declaration);
  };
};
