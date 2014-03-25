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
 * [sf](#sf)

<a name="framework"/>
### Class: swagger.Framework(spec, [options])

Declares a Framework using the [Swagger API Resource Listing](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#51-resource-listing) specification.

You should not include the `apis` attribute.

This acts as a container for all the API's and contains helper methods for serving HTTP resources and the documentation endpoints.

<a name="framework-setup"/>
#### framework.setup()

Validates resources attached to framework. This is automatically called by [framework.dispatcher](#framework-dispatcher) and [framework.server](#framework-server).

<a name="framework-api"/>
#### framework.api(spec, [options])

Declares and attaches [Api](#api) class.

<a name="framework-api-instance"/>
#### framework.api(api)

Attaches [Api](#api) instance.

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

Declares an Api using the [Swagger API Declaration](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#52-api-declaration) specification.

You should not include the `apis` attribute.

<a name="api-resource"/>
#### api.resource(spec, [options])

Declares and attaches [Resource](#resource) class.

<a name="api-resource-instance"/>
#### api.resource(resource)

Attaches [Resource](#resource) instance.

<a name="api-model"/>
#### api.model(spec)

Declares a Model using the [Swagger Model Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#527-model-object) specification.

<a name="resource"/>
### Class: swagger.Resource(spec, [options])

Declares a Resource using the [Swagger API Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#522-api-object) specification.

You should not include the `operations` attribute.

<a name="resource-operation"/>
#### resource.operation(spec, [options], [callback])

Declares and attaches [Operation](#operation) class.

<a name="resource-operation-instance"/>
#### resource.operation(operation)

Attaches [Operation](#operation) instance.

<a name="operation"/>
### Class: swagger.Operation(spec, [options], [callback...])

Declares an Operation using the [Swagger Operation Object](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#523-operation-object) specification.

<a name="request-handler"/>
### Callback: Request Handler

The [Operation](#operation) class takes a callback that will be called when an HTTP request matches the declared API, Resource, Operation, and passes all validation checks.

This function has an Express-style signature (`function(req, res, next)`) where `req` and `res` are standard Node [http](http://nodejs.org/api/http.html) objects (or whatever your framework passes it). `next` is a callback that can be called to skip the current handler, or with an `Error` parameter to stop execution and activate the error handler. If you're using a framework (i.e. Express) that supports `next` then calls will proprogate back to the framework.

<a name="sf"/>
### sf

Swagger Framework attaches an `sf` object to `req` and `res` instances. It is used to pass state between Swagger Framework middleware and includes helper functions.

<a name="sf-accept"/>
#### sf.accept

<a name="sf-body"/>
#### sf.body

<a name="sf-form"/>
#### sf.form

<a name="sf-header"/>
#### sf.header

<a name="sf-path"/>
#### sf.path

<a name="sf-produce"/>
#### sf.produce

<a name="sf-reply"/>
#### sf.reply([statusCode], [body])

This formats and replies to the HTTP request.

`statusCode` should be a numeric HTTP response code (defaults to 200).

`body` should be the body of the content.

<a name="sf-reply-error"/>
#### sf.reply([statusCode], err)

<a name="sf-responseMessage"/>
#### Callback: sf.responseMessage(obj)

This is a callback that you can attach to the `sf` attribute to format `reply` calls.

It should accept an object that contains `statusCode`, `body`, and `args`. `statusCode` and `body` are the response attributes that `reply` interpreted from the caller. `args` is an array of the actual arguments.

`responseMessage` should either return an object with `statusCode` and `body`, or a `falsy` value and handle the response itself.

<a name="sf-query"/>
#### sf.query

This is an object of the request query parameters. They have already been validated and normalized to the type described in the Swagger specification.

Extra query parameters are discarded unless the `removeQuery` option is set to `false`.

<a name="sf-url"/>
#### sf.url

This is a [URL](http://nodejs.org/api/url.html) object for the resource.

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
