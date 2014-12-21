'use strict';

var hapi = require('hapi');

var server = new hapi.Server();
server.connection({ port: 8000 });

server.route({
  method: 'GET',
  path: '/count',
  config: {
    description: 'Count to X',
    notes: [
      'This route counts to a specified number and returns the results.',
      'You can use it for testing',
    ],
    tags: ['api'],
    handler: function(request, reply) {
      var data = [];

      for (var i = 0; i < 10; i++) {
        data.push({ hello: 'world' });
      }

      reply(data);
    },
  },
});

var config = {
  register: require('./lib'),
  options: {
    tags: ['api'],
    info: {
      title: 'Test Application',
      version: '1.0',
    },
  },
};

server.register(config, function(err) {
  if (err) throw err;

  server.start();
});
