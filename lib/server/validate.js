'use strict';

/**
 * Module dependencies.
 */

var zschema = require('z-schema');
var utils = require('../utils');

/**
 * Render validation errors.
 */

function handleError(res, err) {
  if (!err) return;

  var data = { message: err.message };
  var code = 500;

  if (err.errors && err.errors.length) {
    data.errors = err.errors;
    code = 400;
  }

  res.send(code, data);

  return true;
}

/**
 * Validate headers based on Swagger spec.
 */

function validateHeader(spec) {
  var headerSchema = utils.createParamTypeSchema('header', spec);

  return function(req, res, next) {
    if (!headerSchema) return next();

    var header = utils.normalize(req.headers, spec);

    zschema.validate({ header: header }, headerSchema, function(err) {
      if (handleError(res, err)) return;
      req.swagger.header = header;
      next();
    });
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

    zschema.validate({ path: path }, pathSchema, function(err) {
      if (handleError(res, err)) return;
      req.swagger.path = path;
      next();
    });
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

    zschema.validate({ query: query }, querySchema, function(err) {
      if (handleError(res, err)) return;
      req.swagger.query = query;
      next();
    });
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

      zschema.validate({ body: req.body }, bodySchema, function(err) {
        if (handleError(res, err)) return;
        req.swagger.body = req.body;
        next();
      });
    } else if (req.is('multipart/form-data') ||
               req.is('application/x-www-form-urlencoded')) {
      if (!formSchema) return next();

      var form = utils.normalize(req.body, spec);

      zschema.validate({ form: form }, formSchema, function(err) {
        if (handleError(res, err)) return;
        req.swagger.form = form;
        next();
      });
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
