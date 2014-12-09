'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Schema
 */

var names = fs.readdirSync(__dirname)
  .map(function(name) {
    name = name.match(/^(.*)\.js$/);
    return name && name[1];
  })
  .filter(function(name) {
    return name && name !== 'index';
  });

names.forEach(function(name) {
  exports[name] = require('./' + name);
});
