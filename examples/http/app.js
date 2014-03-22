'use strict';

var http = require('http');
var swagger = require('swagger-framework');

var apiHost = '127.0.0.1';
var apiPort = process.env.API_PORT || 8000;
var apiUrl = 'http://' + apiHost + ':' + apiPort;

var docHost = '127.0.0.1';
var docPort = process.env.DOC_PORT || 8001;
var docUrl = 'http://' + docHost + ':' + docPort;

function handler(req, res) {
  res.sf.reply(200, { pet: req.sf.path.petId });
}

var framework = swagger.Framework({ basePath: apiUrl });
var api = framework.api(require('../spec/resource/index'));
var resource = api.resource(require('../spec/resource/pet'));
var operation = resource.operation(require('../spec/resource/pet.getPetById'), handler);
var model = api.model(require('../spec/model/pet'));

http.createServer(framework.dispatcher()).listen(apiPort, function() {
  console.log('Started API on ' + apiUrl);
});

http.createServer(framework.docs.dispatcher()).listen(docPort, function() {
  console.log('Started docs on ' + docUrl);
});
