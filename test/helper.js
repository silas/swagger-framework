'use strict';

var swagger = require('../lib');

exports.api = function() {
  var framework = swagger.Framework({
    basePath: 'http://localhost',
    apiVersion: '1.2.3',
  });

  var api = framework.api({
    path: '/hello',
    description: 'Welcome to the world',
    consumes: [
      'application/json',
    ],
    produces: [
      'application/json',
    ],
  });

  api.resource(
    {
      method: 'GET',
      path: '/hello/{name}',
      summary: 'Say hello to the world',
      nickname: 'helloWorld',
      parameters: [],
      type: 'Reply',
    },
    function(req, res) {
      res.reply(200, { message: 'ok' });
    }
  );

  framework.model({
    id: 'Reply',
    properties: {
      message: { type: 'string' },
    },
    required: ['message'],
  });

  return framework;
};
