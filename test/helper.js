'use strict';

var swagger = require('../lib');

exports.api = function() {
  var framework = swagger.Framework({ basePath: 'http://localhost:8000' });

  var api = framework.api({
    path: '/hello',
    description: 'Welcome to the world',
  });

  api.resource(
    {
      method: 'GET',
      path: '/hello/world',
      summary: 'Say hello to the world',
      nickname: 'helloWorld',
      parameters: [],
      type: 'void',
    },
    function(req, res) {
      res.reply(200, { code: 200 });
    }
  );

  return framework;
};
