'use strict';

var express = require('express');
var swagger = require('swagger-framework');

var host = '127.0.0.1';
var port = process.env.PORT || 8000;
var url = 'http://' + host + ':' + port;

var framework = swagger.Framework({ basePath: url });
var api = framework.api(require('../spec/resource/index'));
var resource = api.resource(require('../spec/resource/pet'));
var operation = resource.operation(require('../spec/resource/pet.getPetById'));
var model = api.model(require('../spec/model/pet'));

var app = express();

app.use('/api-docs', framework.docs.dispatcher());
app.use(framework.dispatcher());

app.use('/', function(req, res) {
  res.sf.reply(404, { message: 'Not found: ' + url + '/api-docs' });
});

app.listen(port);
