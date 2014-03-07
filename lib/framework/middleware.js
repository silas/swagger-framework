/**
 * Contains helper middleware for the FrameworkRouter.
 */

'use strict';

/**
 * Module dependencies.
 */

var accepts = require('accepts');
var is = require('type-is');
var querystring = require('querystring');
var rawBody = require('raw-body');
var utils = require('swagger-schema/utils');

var http = require('../http');

/**
 * Variables
 */

var coerce = { coerce: true };

/**
 * Render validation errors.
 */

function validate(res, errors) {
  if (!errors) return true;

  var err = new Error('Validation failed');
  err.errors = errors;

  res.sf.reply(400, err);
}

/**
 * Lookup middleware.
 */

function lookup(obj, name) {
  while (obj) {
    if (obj.middleware && obj.middleware[name]) {
      return obj.middleware[name];
    }
    obj = obj.parent;
  }
}

/**
 * Setup request.
 */

function setup(operation) {
  var fn = lookup(operation, 'setup');
  if (fn) return fn(operation);
}

/**
 * Validate headers based on Swagger spec.
 */

function header(operation) {
  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('header', operation.spec);

  return function(req, res, next) {
    if (!schema) return next();

    var header = utils.normalize(req.headers, operation.spec);
    var data = { header: header };

    if (validate(res, env.validate(schema, data, coerce))) {
      req.sf.header = header;
      next();
    }
  };
}

/**
 * Check produces.
 */

function produces(operation) {
  var mimes = operation.spec.produces ||
    operation.resource.api.spec.produces || [];

  return function(req, res, next) {
    req.sf.accept = accepts(req);

    if (!mimes.length) return next();

    var types = req.sf.accept.types(mimes);

    if (!types) return res.sf.reply(406);

    if (typeof types === 'string') types = [types];

    types.some(function(type) {
      if (!req.sf.router.encoder[type]) return;

      res.sf.produce = {
        encoder: req.sf.router.encoder[type],
        mime: type
      };

      return true;
    });

    next();
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
      req.sf.path = path;
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

    var query = utils.normalize(req.sf.url.query, operation.spec);
    var data = { query: query };

    if (validate(res, env.validate(schema, data, coerce))) {
      req.sf.query = query;
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
 * Check consumes.
 */

function consumes(operation) {
  if (['HEAD', 'GET'].indexOf(operation.spec.method) >= 0) return;

  var mimes = operation.spec.consumes ||
    operation.resource.api.spec.consumes || [];

  return function(req, res, next) {
    if (!is(req, mimes)) return res.sf.reply(415);

    next();
  };
}

/**
 * Parse raw body.
 */

function raw(operation) {
  if (['HEAD', 'GET'].indexOf(operation.spec.method) >= 0) return;

  var limit = '1mb';

  return function(req, res, next) {
    rawBody(req, {
      length: req.headers['content-length'],
      limit: limit,
      encoding: http.CHARSET
    }, function(err, text) {
      if (err) {
        if (err.statusCode) return res.sf.reply(err.statusCode, err);
        return next(err);
      }
      req.sf.text = text;
      next();
    });
  };
}

/**
 * Validate form based on Swagger spec.
 */

function form(operation) {
  if (['HEAD', 'GET'].indexOf(operation.spec.method) >= 0) return;

  var mimes = operation.spec.consumes ||
    operation.resource.api.spec.consumes || [];
  var mime = 'application/x-www-form-urlencoded';

  if (mimes.indexOf(mime) === -1) return;

  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('form', operation.spec);

  return function(req, res, next) {
    if (is(req, [mime])) {
      var form;

      try {
        form = querystring.parse(req.sf.text);
      } catch (err) {
        return next(err);
      }

      form = req.sf.form = utils.normalize(form, operation.spec);

      if (!schema) return next();

      if (validate(res, env.validate(schema, { form: form }, coerce))) {
        next();
      }
    } else {
      next();
    }
  };
}

/**
 * Validate body based on Swagger spec.
 */

function body(operation) {
  if (['HEAD', 'GET'].indexOf(operation.spec.method) >= 0) return;

  var mimes = operation.spec.consumes ||
    operation.resource.api.spec.consumes || [];
  var mime = 'application/json';

  if (mimes.indexOf(mime) === -1) return;

  var env = operation.resource.api.framework.env;
  var schema = utils.createParamTypeSchema('body', operation.spec);

  return function(req, res, next) {
    if (is(req, [mime])) {
      var body;

      try {
        body = JSON.parse(req.sf.text);
      } catch (err) {
        return next(err);
      }

      req.sf.body = body;

      if (!schema) return next();

      if (validate(res, env.validate(schema, { body: body }))) {
        next();
      }
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

exports.setup = setup;
exports.header = header;
exports.produces = produces;
exports.path = path;
exports.query = query;
exports.authenticate = authenticate;
exports.consumes = consumes;
exports.raw = raw;
exports.form = form;
exports.body = body;
exports.authorize = authorize;
