'use strict';

/* jshint camelcase: false */

var fs = require('fs');

var schemaPath = __dirname + '/schema';

exports.v1_2 = fs.readdirSync(schemaPath)
  .filter(function(name) {
    return name.match(/^(.*)\.json$/);
  })
  .map(function(name) {
    return require(schemaPath + '/' + name);
  });
