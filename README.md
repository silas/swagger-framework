# Swagger Framework

Swagger Framework for web services.

### Example

``` javascript
var express = require('express');
var swagger = require('swagger-framework');

var host = '127.0.0.1';
var port = 8000;
var url = 'http://' + host + ':' + port;

var v1 = swagger.Server({ basePath: url + '/v1' });

v1.api({
  path: '/hello',
  description: 'Hello API',
});

v1.resource(
  {
    method: 'GET',
    path: '/hello/{name}',
    summary: 'Say hello',
    nickname: 'helloName',
    parameters: [
      {
        name: 'name',
        required: true,
        type: 'string',
        paramType: 'path',
        minimum: '1',
        maximum: '30',
      },
      {
        name: 'count',
        required: true,
        type: 'integer',
        paramType: 'query',
        minimum: '1',
        maximum: '10',
      },
    ],
    type: 'Result',
  },
  function(req, res) {
    var message = '';

    for (var i = 0; i < req.swagger.query.count; i++) {
      if (i > 0) message += ' ';
      message += 'hello ' + req.swagger.path.name;
    }

    res.send(200, { message: message });
  }
);

v1.model({
  id: 'Result',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
});


if (!module.parent) {
  var app = express();

  app.use('/v1', v1.dispatcher());

  app.listen(port, host, function(err) {
    if (err) throw err;
    console.log('Server started ' + url + '/');
  });
}
```

## License

This work is licensed under the MIT License (see the LICENSE file).
