'use strict';

/**
 * Module dependencies.
 */

var accepts = require('accepts');
var formBody = require('body/form');
var is = require('type-is');
var jsonBody = require('body/json');
var utils = require('../utils');

/**
 * Variables
 */

var coerce = { coerce: true };

/**
 * Render validation errors.
 */

function validate(res, errors) {
  if (!errors) return true;

  res.swagger.reply(400, {
    message: 'Validation failed',
    errors: [errors],
  });
}

/**
 * Lookup middleware.
 */

function lookup(obj, name) {
  while (obj) {
    if (obj.middleware && obj.middleware[name]) {
      return obj.middleware[name];
    }
    obj = obj._parent;
  }
}

/**
 * Validate headers based on Swagger spec.
 */

function header(operation) {
  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('header', operation.spec);
  var produces = operation.spec.produces || operation.resource.api.produces;

  return function(req, res, next) {
    if (produces) {
      var accept = accepts(req);

      if (!accept.types(produces)) {
        return res.swagger.reply(406);
      }
    }

    if (!schema) return next();

    var header = utils.normalize(req.headers, operation.spec);
    var data = { header: header };

    if (validate(res, env.validate(schema, data, coerce))) {
      req.swagger.header = header;
      next();
    }
  };
}

/**
 * Validate path based on Swagger spec.
 */

function path(operation) {
  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('path', operation.spec);

  return function(req, res, next) {
    if (!schema) return next();

    var path = utils.normalize(req.params, operation.spec);
    var data = { path: path };

    if (validate(res, env.validate(schema, data, coerce))) {
      req.swagger.path = path;
      next();
    }
  };
}

/**
 * Validate query based on Swagger spec.
 */

function query(operation) {
  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('query', operation.spec);

  return function(req, res, next) {
    if (!schema) return next();

    var query = utils.normalize(req.swagger.url.query, operation.spec);
    var data = { query: query };

    if (validate(res, env.validate(schema, data, coerce))) {
      req.swagger.query = query;
      next();
    }
  };
}

/**
 * Authenticate request.
 */

function authenticate(operation) {
  var fn = lookup(operation, 'authenticate');
  if (fn) return fn(operation);
}

/**
 * Validate body based on Swagger spec.
 */

function body(operation) {
  if (['HEAD', 'GET'].indexOf(operation.spec.method) >= 0) return;

  var env = operation.resource.api.framework.env;
  var bodySchema = utils.createParamTypeSchema('body', operation.spec);
  var formSchema = utils.createParamTypeSchema('form', operation.spec);

  var jsonTypes = ['json'];
  var formTypes = ['multipart/form-data', 'application/x-www-form-urlencoded'];

  var consumes = operation.spec.consumes || operation.resource.api.consumes;

  return function(req, res, next) {
    if (consumes && !is(req, consumes)) {
      return res.swagger.reply(415);
    }

    if (is(req, jsonTypes)) {
      jsonBody(req, res, function(err, data) {
        req.swagger.body = data;

        if (!bodySchema) return next();

        var bodyData = { body: data };

        if (validate(res, env.validate(bodySchema, bodyData))) {
          next();
        }
      });
    } else if (is(req, formTypes)) {
      formBody(req, {}, function(err, data) {
        data = req.swagger.form = utils.normalize(data, operation.spec);

        if (!formSchema) return next();

        var formData = { form: data };

        if (validate(res, env.validate(formSchema, formData, coerce))) {
          next();
        }
      });
    } else {
      next();
    }
  };
}

/**
 * Authorize request.
 */

function authorize(operation) {
  var fn = lookup(operation, 'authorize');
  if (fn) return fn(operation);
}

/**
 * Expose helpers.
 */

exports.header = header;
exports.path = path;
exports.query = query;
exports.authenticate = authenticate;
exports.body = body;
exports.authorize = authorize;
