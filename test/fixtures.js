'use strict';

/**
 * Module dependencies.
 */

var index = require('swagger-schema/fixtures/index');
var lodash = require('lodash');
var pet = require('swagger-schema/fixtures/pet');
var url = require('url');

var swagger = require('../lib');

/**
 * Helper functions.
 */

exports.framework = function(options) {
  options = options || {};

  var framework = swagger.Framework({
    basePath: options.basePath || pet.basePath,
    apiVersion: pet.apiVersion,
  }, { etag: true });

  index.apis.forEach(function(aSpec) {
    var name = url.parse(aSpec.path).path.slice(1);
    var data = lodash.cloneDeep(require('swagger-schema/fixtures/' + name));

    var apiSpec = lodash.omit(data, 'apis', 'models');

    lodash.merge(apiSpec, aSpec);

    var api = framework.api(apiSpec);

    lodash.forOwn(data.models, function(model) {
      api.model(model);
    });

    data.apis.forEach(function(rSpec) {
      var resource = api.resource({ path: rSpec.path });

      rSpec.operations.forEach(function(oSpec) {
        resource.operation(oSpec, function(req, res) {
          var request = lodash.pick(
            req.sf,
            'header',
            'path',
            'query',
            'body',
            'form'
          );

          var spec = {
            operation: req.sf.operation.spec,
            resource: req.sf.operation.resource.spec,
            api: req.sf.operation.resource.api.spec,
          };

          res.sf.reply(200, {
            request: request,
            spec: spec,
          });
        });
      });
    });
  });

  return framework;
};
