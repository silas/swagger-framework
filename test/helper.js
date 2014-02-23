'use strict';

var lodash = require('lodash');

var swagger = require('../lib');

var index = require('./helper/index.json');
var pet = require('./helper/pet.json');

exports.framework = function() {
  var setupModels = {};

  var framework = swagger.Framework({
    basePath: pet.basePath,
    apiVersion: pet.apiVersion,
  });

  index.apis.forEach(function(aSpec) {
    var name = aSpec.path.slice(1);
    var data = lodash.cloneDeep(require('./helper/' + name + '.json'));
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
          res.statusCode = 200;
          res.end();
        });
      });
    });
  });

  return framework;
};
