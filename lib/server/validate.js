'use strict';

/**
 * Module dependencies.
 */

var schema = require('../schema');
var utils = require('../utils');

/**
 * Render validation errors.
 */

function validate(res, schemaData, data, opts) {
  if (!schemaData) return true;

  var errors = schema.validate(schemaData, data, opts);

  if (!errors) return true;

  res.send(400, {
    message: 'Validation failed',
    errors: [errors],
  });
}

/**
 * Validate headers based on Swagger spec.
 */

function validateHeader(spec) {
  var headerSchema = utils.createParamTypeSchema('header', spec);

  return function(req, res, next) {
    if (!headerSchema) return next();

    var header = utils.normalize(req.headers, spec);

    if (validate(res, headerSchema, { header: header }, { coerce: true })) {
      req.swagger.header = header;
      next();
    }
  };
}

/**
 * Validate path based on Swagger spec.
 */

function validatePath(spec) {
  var pathSchema = utils.createParamTypeSchema('path', spec);

  return function(req, res, next) {
    if (!pathSchema) return next();

    var path = utils.normalize(req.params, spec);

    if (validate(res, pathSchema, { path: path }, { coerce: true })) {
      req.swagger.path = path;
      next();
    }
  };
}

/**
 * Validate query based on Swagger spec.
 */

function validateQuery(spec) {
  var querySchema = utils.createParamTypeSchema('query', spec);

  return function(req, res, next) {
    if (!querySchema) return next();

    var query = utils.normalize(req.query, spec);

    if (validate(res, querySchema, { query: query }, { coerce: true })) {
      req.swagger.query = query;
      next();
    }
  };
}

/**
 * Validate body/form based on Swagger spec.
 */

function validateBody(spec) {
  var bodySchema = utils.createParamTypeSchema('body', spec);
  var formSchema = utils.createParamTypeSchema('form', spec);

  return function(req, res, next) {
    if (req.is('json')) {
      if (!bodySchema) return next();

      if (validate(res, bodySchema, { body: req.body })) {
        req.swagger.body = req.body;
        next();
      }
    } else if (req.is('multipart/form-data') ||
               req.is('application/x-www-form-urlencoded')) {
      if (!formSchema) return next();

      var form = utils.normalize(req.body, spec);

      if (validate(res, formSchema, { form: form }, { coerce: true })) {
        req.swagger.form = form;
        next();
      }
    } else {
      next();
    }
  };
}

/**
 * Expose helpers.
 */

exports.header = validateHeader;
exports.path = validatePath;
exports.query = validateQuery;
exports.body = validateBody;
