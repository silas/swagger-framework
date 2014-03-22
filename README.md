# Swagger Framework [![Build Status](https://travis-ci.org/silas/swagger-framework.png?branch=master)](https://travis-ci.org/silas/swagger-framework)

Swagger Framework is a module for creating [Swagger Specification][spec] validated web resources using the standard Node HTTP request listener interface.

It validates and normalizes incoming requests, validates your Swagger Specification, and generates the documentation endpoint.

 * [Documentation](#documentation)
 * [Example](#example)
   * [Framework](#framework)
   * [Api](#api)
   * [Resource](#resource)
   * [Operation](#operation)
 * [License](#license)

## Documentation

<a name="framework"/>
#### Class: swagger.Framework(spec, [options])

This is a container for all the Api's and contains helper methods for serving HTTP resources and documentation.

<a name="framework-setup"/>
#### framework.setup()

Setup and validate resources attached to framework. It is automatically called by `framework.dispatcher` and `framework.server`.

<a name="framework-api"/>
#### framework.api(spec, [options])

Declare an Api using the [Swagger API Declaration](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#52-api-declaration) attributes.

<a name="framework-api-instance"/>
#### framework.api(api)

Attach an instantiated `Api` class to the `Framework`.

<a name="framework-dispatcher"/>
#### framework.dispatcher([options])

Returns a function that implements the `requestListener` interface (`function(req, res)`) and will gracefully use Connect/Express style `next` when available.

``` javascript
http.createServer(framework.dispatcher()).listen(8000);
```

<a name="framework-server"/>
#### framework.server([options])

Create and return an `http.Server` which serves apis on `/` and documentation on `/api-docs`.

<a name="api"/>
#### Class: swagger.Api(spec, [options])

<a name="api-resource"/>
#### api.resource(spec, [options])

<a name="api-resource-instance"/>
#### api.resource(resource)

<a name="api-model"/>
#### api.model(spec)

<a name="resource"/>
#### Class: swagger.Resource(spec, [options])

<a name="resource-operation"/>
#### resource.operation(spec, [options], [callback])

<a name="resource-operation-instance"/>
#### resource.operation(operation)

<a name="operation"/>
#### Class: swagger.Operation(spec, [options], [callback...])

## Example

``` javascript
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
    res.sf.reply(200, {
      message: 'pet id ' + req.sf.path.petId,
    });
  }
);

api.model({
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
  framework.server().listen(port, host, function(err) {
    if (err) throw err;

    console.log('Server started ' + url + '/');
  });
}
```

## License

This work is licensed under the MIT License (see the LICENSE file).

[spec]: https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#readme
