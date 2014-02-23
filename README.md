# Swagger Framework [![Build Status](https://travis-ci.org/silas/swagger-framework.png?branch=master)](https://travis-ci.org/silas/swagger-framework)

Swagger Framework for web services.

### Example

``` javascript
var express = require('express');
var swagger = require('swagger-framework');

var host = '127.0.0.1';
var port = 8000;
var url = 'http://' + host + ':' + port;

var framework = swagger.Framework({ basePath: url });

var api = framework.api({
  path: '/pet',
  description: 'Manage pets',
  consumes: [
    'application/json',
  ],
  produces: [
    'application/json',
  ],
});

var resource = api.resource({ path: '/pet/{petId}' });

var operation = resource.operation(
  {
    method: 'GET',
    summary: 'Find pet by ID',
    notes: 'Returns a pet based on ID',
    type: 'Pet',
    nickname: 'getPetById',
    parameters: [
      {
        name: 'petId',
        description: 'ID of pet that needs to be fetched',
        required: true,
        type: 'integer',
        format: 'int64',
        paramType: 'path',
        minimum: '1',
        maximum: '100000',
      },
    ],
    responseMessages: [
      {
        code: 400,
        message: 'Invalid ID supplied',
      },
      {
        code: 404,
        message: 'Pet not found',
      },
    ],
  },
  function(req, res) {
    res.swagger.reply(200, {
      message: 'pet id ' + req.swagger.path.petId,
    });
  }
);

framework.model({
  id: 'Pet',
  required: ['id', 'name'],
  properties: {
    id: {
      type: 'integer',
      format: 'int64',
      description: 'unique identifier for the pet',
      minimum: '0',
      maximum: '100',
    },
    name: { type: 'string' },
    photoUrls: {
      type: 'array',
      items: { type: 'string' },
    },
    status: {
      type: 'string',
      description: 'pet status in the store',
      enum: ['available', 'pending', 'sold'],
    },
  },
});

if (module.parent) {
  module.exports = framework;
} else {
  var app = express();

  app.use('/api-docs', framework.docs.dispatcher());
  app.use(framework.dispatcher());

  app.listen(port, host, function(err) {
    if (err) throw err;
    console.log('Server started ' + url + '/');
  });
}
```

## License

This work is licensed under the MIT License (see the LICENSE file).
