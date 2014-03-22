# Swagger Framework [![Build Status](https://travis-ci.org/silas/swagger-framework.png?branch=master)](https://travis-ci.org/silas/swagger-framework)

Swagger Framework is a module for creating [Swagger Specification][spec] validated web resources using the standard Node HTTP request listener interface.

It validates and normalizes incoming requests, validates your Swagger Specification, and generates the documentation endpoint.

 * [Documentation](#documentation)
   * [Framework](#framework)
   * [Api](#api)
   * [Resource](#resource)
   * [Operation](#operation)
 * [Example](#example)
 * [License](#license)

## Documentation

<a name="framework"/>
#### Class: swagger.Framework(spec, [options])

The Framework class is a container for Swagger API declarations. It has helper methods for serving HTTP resources and the documentation endpoints.

<a name="framework-setup"/>
#### framework.setup()

Validates resources attached to framework. This is automatically called by `framework.dispatcher` and `framework.server`.

<a name="framework-api"/>
#### framework.api(spec, [options])

Declare and attach Api to the Framework.

See the [Api](#api) class.

<a name="framework-api-instance"/>
#### framework.api(api)

Attach Api instance to the Framework.

<a name="framework-dispatcher"/>
#### framework.dispatcher([options])

Returns a function that implements the Node HTTP [requestListener](http://nodejs.org/api/http.html#http_http_createserver_requestlistener) interface.

It also supports the Express/Connect style next argument if passed.

``` javascript
http.createServer(framework.dispatcher()).listen(8000);
```

<a name="framework-server"/>
#### framework.server([options])

Return an [http.Server](http://nodejs.org/api/http.html#http_class_http_server) which serves API's on `/` and the documentation endpoint  `/api-docs`.

<a name="api"/>
#### Class: swagger.Api(spec, [options])

Declare an Api using the [Swagger API Declaration](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#52-api-declaration) specification.

You should not include the `apis` attribute.

<a name="api-resource"/>
#### api.resource(spec, [options])

Declare and attach Resource to the Api.

See the [Resource](#resource) class.

<a name="api-resource-instance"/>
#### api.resource(resource)

Attach Resource instance to the Api.

<a name="api-model"/>
#### api.model(spec)

Declare a Model using the [Swagger Model Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#527-model-object) specification.

<a name="resource"/>
#### Class: swagger.Resource(spec, [options])

Declare a Resource using the [Swagger API Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#522-api-object) specification.

You should not include the `operations` attribute.

<a name="resource-operation"/>
#### resource.operation(spec, [options], [callback])

Declare and attach Operation to the Resource.

See the [Operation](#operation) class.

<a name="resource-operation-instance"/>
#### resource.operation(operation)

Attach Operation instance to the Resource.

<a name="operation"/>
#### Class: swagger.Operation(spec, [options], [callback...])

Declare an Operation using the [Swagger Operation Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#523-operation-object) specification.

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
