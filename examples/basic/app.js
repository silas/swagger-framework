'use strict';

var swagger = require('swagger-framework');

var host = '127.0.0.1';
var port = process.env.PORT || 8000;
var url = 'http://' + host + ':' + port;

function handler(req, res) {
  res.sf.reply(200, { pet: req.sf.path.petId });
}

var framework = swagger.Framework({ basePath: url });
var api = framework.api(require('../spec/resource/index'));
var resource = api.resource(require('../spec/resource/pet'));
var operation = resource.operation(require('../spec/resource/pet.getPetById'), handler);
var model = api.model(require('../spec/model/pet'));

framework.server().listen(port);
