'use strict';

var swagger = require('../lib');

exports.s1 = function() {
  var s = swagger.Server({ basePath: 'http://localhost:8000/s1' });

  s.api({
    path: '/hello',
    description: 'Welcome to the world',
  });

  s.resource(
    {
      method: 'GET',
      path: '/hello/world',
      summary: 'Say hello to the world',
      nickname: 'helloWorld',
      parameters: [],
      type: 'void',
    },
    function(req, res) {
      res.send(200, { code: 200 });
    }
  );

  return s;
};
