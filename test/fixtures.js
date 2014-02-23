'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var swagger = require('../lib');

var index = require('./fixtures/index.json');
var pet = require('./fixtures/pet.json');

/**
 * Helper functions.
 */

exports.framework = function(options) {
  options = options || {};

  var setupModels = {};

  var framework = swagger.Framework({
    basePath: options.basePath || pet.basePath,
    apiVersion: pet.apiVersion,
  });

  index.apis.forEach(function(aSpec) {
    var name = aSpec.path.slice(1);
    var data = lodash.cloneDeep(require('./fixtures/' + name + '.json'));
    var api = framework.api(aSpec);

    lodash.forOwn(data.models, function(model) {
      if (setupModels[model.id]) return;
      framework.model(model);
      setupModels[model.id] = model;
    });

    data.apis.forEach(function(rSpec) {
      var resource = api.resource({ path: rSpec.path });

      rSpec.operations.forEach(function(oSpec) {
        resource.operation(oSpec, function(req, res) {
          var request = lodash.pick(
            req.swagger,
            'header',
            'path',
            'query',
            'body',
            'form'
          );

          var spec = {
            operation: req.swagger.operation.spec,
            resource: req.swagger.operation.resource.spec,
            api: req.swagger.operation.resource.api.spec,
          };

          res.swagger.reply(200, {
            request: request,
            spec: spec,
          });
        });
      });
    });
  });

  return framework;
};
