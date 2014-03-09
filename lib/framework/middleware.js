/**
 * Contains helper middleware for the FrameworkRouter.
 */

'use strict';

/**
 * Module dependencies.
 */

var accepts = require('accepts');
var debug = require('debug')('swagger-framework:framework:middleware');
var is = require('type-is');
var lodash = require('lodash');
var querystring = require('querystring');
var rawBody = require('raw-body');
var transform = require('swagger-schema/transform');

var http = require('../http');

/**
 * Variables
 */

var coerce = { coerce: true };

/**
 * Operation debug prefix.
 */

function describe(ctx) {
  try {
    return ctx.operation.spec.method + ' ' +
      ctx.operation.resource.spec.path + ' ';
  } catch (err) {
    return '';
  }
}

/**
 * Render validation errors.
 */

function validate(res, errors) {
  if (!errors) return true;

  var err = new Error('Validation failed');
  err.errors = errors;
  err.expose = true;
  err.toJSON = function() {
    return {
      message: err.message,
      errors: [err.errors],
    };
  };

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

function setup(ctx) {
  var fn = lookup(ctx.operation, 'setup');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx.operation);
  } else {
    debug(prefix + 'setup middleware disabled (not defined)');
  }
}

/**
 * Validate headers based on Swagger spec.
 */

function header(ctx) {
  var env = ctx.operation.resource.api.framework.env;
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'header');

  if (!schema) {
    debug(prefix + 'header middleware disabled (no schema)');
    return;
  }

  schema = {
    paramType: 'object',
    properties: { header: schema },
    required: ['header'],
  };

  return function(req, res, next) {
    var header = {};

    Object.keys(req.headers).forEach(function(key) {
      var v = req.headers[key];
      if (Array.isArray(v)) v = v[v.length - 1];
    });

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

function produces(ctx) {
  var mimes = ctx.operation.spec.produces ||
    ctx.operation.resource.api.spec.produces || [];
  var prefix = describe(ctx);

  if (!mimes.length) {
    debug(prefix + 'produces validation disabled (no produces)');
  }

  return function(req, res, next) {
    req.sf.accept = accepts(req);

    if (!mimes.length) return next();

    var types = req.sf.accept.types(mimes);

    if (!types) {
      debug(prefix + 'produces mime not supported: "%s" not in "%s"',
            req.headers.accept, mimes);
      return res.sf.reply(406);
    }

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

function path(ctx) {
  var env = ctx.operation.resource.api.framework.env;
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'path');

  if (!schema) {
    debug(prefix + 'path middleware disabled (no schema)');
    return;
  }

  schema = {
    paramType: 'object',
    properties: { path: schema },
    required: ['path'],
  };

  return function(req, res, next) {
    var path = lodash.clone(req.sf._params);
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

function query(ctx) {
  var env = ctx.operation.resource.api.framework.env;
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'query');

  if (!schema) {
    debug(prefix + 'query middleware disabled (no schema)');
    return;
  }

  schema = {
    paramType: 'object',
    properties: { query: schema },
    required: ['query'],
  };

  return function(req, res, next) {
    var query = lodash.clone(req.sf.url.query);
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

function authenticate(ctx) {
  var fn = lookup(ctx.operation, 'authenticate');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx);
  } else {
    debug(prefix + 'authenticate middleware disabled (not defined)');
  }
}

/**
 * Check consumes.
 */

function consumes(ctx) {
  if (['HEAD', 'GET'].indexOf(ctx.operation.spec.method) >= 0) return;

  var mimes = ctx.operation.spec.consumes ||
    ctx.operation.resource.api.spec.consumes || [];
  var prefix = describe(ctx);

  if (!mimes.length) {
    debug(prefix + 'consumes middleware disabled (no consumes)');
    return;
  }

  return function(req, res, next) {
    if (!is(req, mimes)) {
      debug(prefix + 'consumes mime not supported: "%s" not in "%s"',
            req.headers['content-type'], mimes);
      return res.sf.reply(415);
    }

    next();
  };
}

/**
 * Parse raw body.
 */

function raw(ctx) {
  if (['HEAD', 'GET'].indexOf(ctx.operation.spec.method) >= 0) return;

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

function form(ctx) {
  if (['HEAD', 'GET'].indexOf(ctx.operation.spec.method) >= 0) return;

  var mimes = ctx.operation.spec.consumes ||
    ctx.operation.resource.api.spec.consumes || [];
  var mime = 'application/x-www-form-urlencoded';
  var prefix = describe(ctx);

  if (mimes.indexOf(mime) === -1) {
    debug(prefix + 'form middleware disabled (no consumes)');
    return;
  }

  var env = ctx.operation.resource.api.framework.env;
  var schema = transform.parameters(ctx.operation.spec, 'form');

  if (!schema) {
    debug(prefix + 'form middleware disabled (no schema)');
    return;
  }

  schema = {
    paramType: 'object',
    properties: { form: schema },
    required: ['form'],
  };

  return function(req, res, next) {
    if (is(req, [mime])) {
      var form;

      try {
        form = querystring.parse(req.sf.text);
      } catch (err) {
        return next(err);
      }

      form = req.sf.form = lodash.clone(form);

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

function body(ctx) {
  if (['HEAD', 'GET'].indexOf(ctx.operation.spec.method) >= 0) return;

  var consumeMimes = ctx.operation.spec.consumes ||
    ctx.operation.resource.api.spec.consumes || [];
  var mimes = lodash.intersection(consumeMimes,
    Object.keys(ctx.router.decoder));
  var prefix = describe(ctx);

  if (!mimes.length) {
    debug(prefix + 'body middleware disabled (no consumes)');
    return;
  }

  var env = ctx.operation.resource.api.framework.env;
  var schema = transform.parameters(ctx.operation.spec, 'body');

  if (!schema) {
    debug(prefix + 'body middleware disabled (no schema)');
    return;
  }

  return function(req, res, next) {
    var mime = is(req, mimes);

    if (mime) {
      var body;

      try {
        body = http.decoder[mime](req.sf.text);
      } catch (err) {
        debug(prefix + 'body decoder failed', err);

        var userErr = new Error('Decode body failed');
        userErr.statusCode = 400;
        userErr.parent = err;
        userErr.expose = true;

        return next(userErr);
      }

      req.sf.body = body;

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

function authorize(ctx) {
  var fn = lookup(ctx.operation, 'authorize');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx);
  } else {
    debug(prefix + 'authorize middleware disabled (not defined)');
  }
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
