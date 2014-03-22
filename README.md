# Swagger Framework [![Build Status](https://travis-ci.org/silas/swagger-framework.png?branch=master)](https://travis-ci.org/silas/swagger-framework)

Swagger Framework is a module for creating [Swagger Specification][spec] validated web resources using the standard Node HTTP request listener interface.

It validates and normalizes incoming requests, validates your Swagger Specification, and generates the documentation endpoint.

 * [Documentation](#documentation)
 * [Example](#example)
 * [License](#license)

## Documentation

 * [Framework](#framework)
 * [Api](#api)
 * [Resource](#resource)
 * [Operation](#operation)

<a name="framework"/>
### Class: swagger.Framework(spec, [options])

Declare a Framework using the [Swagger API Resource Listing](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#51-resource-listing) specification.

You should not include the `apis` attribute.

This acts as a container for all the API's and contains helper methods for serving HTTP resources and the documentation endpoints.

<a name="framework-setup"/>
#### framework.setup()

Validates resources attached to framework. This is automatically called by [framework.dispatcher](#framework-dispatcher) and [framework.server](#framework-server).

<a name="framework-api"/>
#### framework.api(spec, [options])

Declare and attach [Api](#api) class.

<a name="framework-api-instance"/>
#### framework.api(api)

Attach [Api](#api) instance.

<a name="framework-dispatcher"/>
#### framework.dispatcher([options])

Returns a function that implements the Node HTTP [requestListener](http://nodejs.org/api/http.html#http_http_createserver_requestlistener) interface.

It also supports the Express/Connect style `next` argument.

**Example (Express)**

```javascript
app.use('/api-docs', framework.docs.dispatcher());
app.use('/', framework.dispatcher());
```

<a name="framework-server"/>
#### framework.server([options])

Returns an [http.Server](http://nodejs.org/api/http.html#http_class_http_server) instance which serves API's on `/` and the documentation endpoint on `/api-docs`.

**Example**

```javascript
framework.server().listen(8000);
```

<a name="api"/>
### Class: swagger.Api(spec, [options])

Declare an Api using the [Swagger API Declaration](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#52-api-declaration) specification.

You should not include the `apis` attribute.

<a name="api-resource"/>
#### api.resource(spec, [options])

Declare and attach [Resource](#resource) class.

<a name="api-resource-instance"/>
#### api.resource(resource)

Attach [Resource](#resource) instance.

<a name="api-model"/>
#### api.model(spec)

Declare a Model using the [Swagger Model Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#527-model-object) specification.

<a name="resource"/>
### Class: swagger.Resource(spec, [options])

Declare a Resource using the [Swagger API Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#522-api-object) specification.

You should not include the `operations` attribute.

<a name="resource-operation"/>
#### resource.operation(spec, [options], [callback])

Declare and attach [Operation](#operation) class.

<a name="resource-operation-instance"/>
#### resource.operation(operation)

Attach [Operation](#operation) instance.

<a name="operation"/>
### Class: swagger.Operation(spec, [options], [callback...])

Declare an Operation using the [Swagger Operation Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#523-operation-object) specification.

## Example

See more in the [examples](https://github.com/silas/swagger-framework/tree/master/examples) directory.

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
