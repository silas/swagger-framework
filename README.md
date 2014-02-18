# Swagger Framework

Swagger Framework for web services.

### Example

``` javascript
var express = require('express');
var swagger = require('swagger-framework');

var host = '127.0.0.1';
var port = 8000;
var url = 'http://' + host + ':' + port;

var framework = swagger.Framework({
  apiVersion: '1.0.0',
  basePath: url,
  authorizations: {
    oauth2: {
      type: 'oauth2',
      grantTypes: {
        implicit: {
          loginEndpoint: {
            url: url + '/oauth/dialog',
          },
          tokenName: 'access_token',
        },
        authorization_code: {
          tokenRequestEndpoint: {
            url: url + '/oauth/requestToken',
            clientIdName: 'client_id',
            clientSecretName: 'client_secret',
          },
          tokenEndpoint: {
            url: url + '/oauth/token',
            tokenName: 'auth_code',
          },
        },
      },
    },
  },
});

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

var resource = api.resource({
  path: '/pet/{petId}'
});

var operation = resource.operation(
  {
    method: 'GET',
    summary: 'Find pet by ID',
    notes: 'Returns a pet based on ID',
    type: 'Pet',
    nickname: 'getPetById',
    authorizations: [],
    parameters: [
      {
        name: 'petId',
        description: 'ID of pet that needs to be fetched',
        required: true,
        type: 'integer',
        format: 'int64',
        paramType: 'path',
        minimum: '1.0',
        maximum: '100000.0',
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
      minimum: '0.0',
      maximum: '100.0',
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

if (!module.parent) {
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
