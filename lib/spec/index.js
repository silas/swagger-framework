'use strict';

/* jshint camelcase: false */

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Spec
 */

var schemaPath = __dirname + '/schema';

exports.v1_2 = fs.readdirSync(schemaPath)
  .filter(function(name) {
    return name.match(/^(.*)\.json$/);
  })
  .map(function(name) {
    return require(schemaPath + '/' + name);
  });
