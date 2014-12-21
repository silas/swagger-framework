'use strict';

var joi = require('joi');
var lodash = require('lodash');

function register(server, options, next) {
  var result = joi.validate(options, joi.object().keys({
    path: joi.string().default('/api-docs'),
    tags: joi.array().includes(joi.string()),
    info: joi.object().keys({
      title: joi.string().required(),
      description: joi.string(),
      termsOfService: joi.string(),
      version: joi.string().required(),
    }).required(),
  }));

  if (result.error) return next(result.error);
  options = result.value;

  server.route({
    method: 'GET',
    path: options.path,
    handler: function(request, reply) {
      var spec = {
        swagger: '2.0',
        info: options.info,
        schemes: [],
        paths: {},
      };

      lodash.each(request.server.table(), function(table) {
        if (spec.schemes.indexOf(table.info.protocol) === -1) {
          spec.schemes.push(table.info.protocol);
        }

        lodash.each(table.table, function(route) {
          if (options.tags) {
            if (!lodash.intersection(options.tags, route.settings.tags).length) return;
          }

          var path = spec.paths[route.path];

          if (!path) {
            path = spec.paths[route.path] = {};
          }

          var method = path[route.method] = {};

          var settings = route.settings;

          if (settings.description) method.summary = settings.description;

          if (Array.isArray(settings.notes)) {
            method.description = settings.notes.join('\n\n');
          } else if (settings.notes) {
            method.description = settings.notes;
          }

          console.log(route.settings);
        });
      });

      reply(spec);
    },
  });

  next();
}

register.attributes = {
  pkg: require('../package.json'),
  name: 'swagger-framework',
};

exports.register = register;
