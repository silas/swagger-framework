'use strict';

/**
 * Module dependencies.
 */

var accepts = require('accepts');
var formBody = require('body/form');
var is = require('type-is');
var jsonBody = require('body/json');
var schema = require('../schema');
var utils = require('../utils');

/**
 * Render validation errors.
 */

function validate(res, schemaData, data, opts) {
  if (!schemaData) return true;

  var errors = schema.validate(schemaData, data, opts);

  if (!errors) return true;

  res.reply(400, {
    message: 'Validation failed',
    errors: [errors],
  });
}

/**
 * Validate headers based on Swagger spec.
 */

function header(operation) {
  var headerSchema = utils.createParamTypeSchema('header', operation.spec);

  var supportedTypes = operation.spec.produces ||
    operation.resource.api.produces;

  return function(req, res, next) {
    if (supportedTypes) {
      var accept = accepts(req);

      if (!accept.types(supportedTypes)) {
        return res.reply(406);
      }
    }

    if (!headerSchema) return next();

    var header = utils.normalize(req.headers, operation.spec);

    if (validate(res, headerSchema, { header: header }, { coerce: true })) {
      req.swagger.header = header;
      next();
    }
  };
}

/**
 * Validate path based on Swagger spec.
 */

function path(operation) {
  var pathSchema = utils.createParamTypeSchema('path', operation.spec);

  return function(req, res, next) {
    if (!pathSchema) return next();

    var path = utils.normalize(req.params, operation.spec);

    if (validate(res, pathSchema, { path: path }, { coerce: true })) {
      req.swagger.path = path;
      next();
    }
  };
}

/**
 * Validate query based on Swagger spec.
 */

function query(operation) {
  var querySchema = utils.createParamTypeSchema('query', operation.spec);

  return function(req, res, next) {
    if (!querySchema) return next();

    var query = utils.normalize(req.swagger.url.query, operation.spec);

    if (validate(res, querySchema, { query: query }, { coerce: true })) {
      req.swagger.query = query;
      next();
    }
  };
}

/**
 * Authenticate request.
 */

function authenticate() {
}

/**
 * Validate body/form based on Swagger spec.
 */

function body(operation) {
  if (['HEAD', 'GET'].indexOf(operation.method) >= 0) return;

  var bodySchema = utils.createParamTypeSchema('body', operation.spec);
  var formSchema = utils.createParamTypeSchema('form', operation.spec);

  var jsonTypes = ['json'];
  var formTypes = ['multipart/form-data', 'application/x-www-form-urlencoded'];

  var supportedTypes = operation.spec.consumes ||
    operation.resource.api.consumes;

  return function(req, res, next) {
    if (supportedTypes && !is(req, supportedTypes)) {
      return res.reply(415);
    }

    if (is(req, jsonTypes)) {
      jsonBody(req, res, function(err, data) {
        if (!bodySchema) return next();

        if (validate(res, bodySchema, { body: data })) {
          req.swagger.body = data;
          next();
        }
      });
    } else if (is(req, formTypes)) {
      formBody(req, {}, function(err, data) {
        if (!formSchema) return next();

        var form = utils.normalize(data, operation.spec);

        if (validate(res, formSchema, { form: form }, { coerce: true })) {
          req.swagger.form = form;
          next();
        }
      });
    } else {
      next();
    }
  };
}

/**
 * Expose helpers.
 */

exports.header = header;
exports.path = path;
exports.query = query;
exports.authenticate = authenticate;
exports.body = body;
