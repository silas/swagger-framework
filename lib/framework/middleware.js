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
var rawBody = require('raw-body');
var transform = require('swagger-schema/transform');

var constants = require('../constants');
var http = require('../http');

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

function validate(res, result) {
  if (!result) return true;

  var err = new Error('Validation failed');
  try {
    err.errors = result.errors();
  } catch (err) {
    err.errors = [result.validation];
  }
  err.expose = true;
  err.toJSON = function() {
    return {
      message: this.message,
      errors: this.errors,
    };
  };

  res.sf.reply(400, err);
}

/**
 * Lookup property.
 */

function lookup(obj, type, name) {
  while (obj) {
    if (obj[type] && obj[type].hasOwnProperty(name)) {
      return obj[type][name];
    }
    obj = obj.parent;
  }
}

/**
 * Setup validation options.
 */

function validateOptions(operation, type, useCoerce) {
  var options = { useCoerce: useCoerce };

  // capitalize type
  var suffix = type[0].toUpperCase() + type.slice(1);

  // Get remove option (ex: options.removeHeader)
  var removeAdditional = lookup(operation, 'options', 'remove' + suffix);

  if (typeof removeAdditional === 'undefined') {
    removeAdditional = true;
  }
  options.removeAdditional = !!removeAdditional;

  return options;
}

/**
 * Before middleware.
 */

function before(ctx) {
  var fn = lookup(ctx.operation, 'middleware', 'before');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx);
  } else {
    debug(prefix + 'before middleware disabled (not defined)');
  }
}

/**
 * Validate headers based on Swagger spec.
 */

function header(ctx) {
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'header');

  if (!schema) {
    debug(prefix + 'header middleware disabled (no schema)');
    return;
  }

  var env = ctx.operation.resource.api.env;
  var options = validateOptions(ctx.operation, 'header', true);

  // Create a list of headers to split on comma
  var allowMultiple = {};
  ctx.operation.spec.parameters.forEach(function(parameter) {
    if (parameter.paramType === 'header' && parameter.allowMultiple) {
      var name = parameter.name.toLowerCase();
      allowMultiple[name] = constants.singleHeaders.indexOf(name) < 0;
    }
  });

  schema = {
    type: 'object',
    properties: { header: schema },
    required: ['header'],
  };

  return function(req, res, next) {
    var header = lodash.cloneDeep(req.headers);

    // This only works for small subset of headers before Node v0.11
    lodash.forOwn(header, function(value, name) {
      if (allowMultiple[name]) header[name] = value.split(', ');
    });

    if (validate(res, env.validate(schema, { header: header }, options))) {
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

      var err = new Error('Not acceptable (' +
                          req.headers.accept + '), supports: ' +
                          mimes.join(', '));
      err.statusCode = 406;
      err.expose = true;

      return res.sf.reply(err);
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
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'path');

  if (!schema) {
    debug(prefix + 'path middleware disabled (no schema)');
    return;
  }

  var env = ctx.operation.resource.api.env;
  var options = validateOptions(ctx.operation, 'path', true);

  schema = {
    type: 'object',
    properties: { path: schema },
    required: ['path'],
  };

  return function(req, res, next) {
    var path = lodash.clone(req.sf._params);

    if (validate(res, env.validate(schema, { path: path }, options))) {
      req.sf.path = path;
      next();
    }
  };
}

/**
 * Validate query based on Swagger spec.
 */

function query(ctx) {
  var prefix = describe(ctx);
  var schema = transform.parameters(ctx.operation.spec, 'query');

  if (!schema) {
    debug(prefix + 'query middleware disabled (no schema)');
    return;
  }

  var env = ctx.operation.resource.api.env;
  var options = validateOptions(ctx.operation, 'query', true);

  schema = {
    type: 'object',
    properties: { query: schema },
    required: ['query'],
  };

  return function(req, res, next) {
    var query = lodash.clone(req.sf.url.query);

    if (validate(res, env.validate(schema, { query: query }, options))) {
      req.sf.query = query;
      next();
    }
  };
}

/**
 * Authenticate request.
 */

function authenticate(ctx) {
  var fn = lookup(ctx.operation, 'middleware', 'authenticate');
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

      var err = new Error('Unsupported Content-Type (' +
                          req.headers['content-type'] + '), supports: ' +
                          mimes.join(', '));
      err.statusCode = 415;
      err.expose = true;

      return res.sf.reply(err);
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
  var decode = ctx.router.decoder[mime];

  if (mimes.indexOf(mime) === -1) {
    debug(prefix + 'form middleware disabled (no consumes)');
    return;
  }

  var env = ctx.operation.resource.api.env;
  var options = validateOptions(ctx.operation, 'form', true);
  var schema = transform.parameters(ctx.operation.spec, 'form');

  if (!schema) {
    debug(prefix + 'form middleware disabled (no schema)');
    return;
  }

  schema = {
    type: 'object',
    properties: { form: schema },
    required: ['form'],
  };

  return function(req, res, next) {
    if (is(req, [mime])) {
      var form;

      try {
        form = decode(req.sf.text);
      } catch (err) {
        return next(err);
      }

      form = req.sf.form = lodash.clone(form);

      if (validate(res, env.validate(schema, { form: form }, options))) {
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

  var env = ctx.operation.resource.api.env;
  var options = validateOptions(ctx.operation, 'form', false);
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

      if (validate(res, env.validate(schema, { body: body }, options))) {
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
  var fn = lookup(ctx.operation, 'middleware', 'authorize');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx);
  } else {
    debug(prefix + 'authorize middleware disabled (not defined)');
  }
}

/**
 * After middleware.
 */

function after(ctx) {
  var fn = lookup(ctx.operation, 'middleware', 'after');
  var prefix = describe(ctx);

  if (fn) {
    return fn(ctx);
  } else {
    debug(prefix + 'after middleware disabled (not defined)');
  }
}

/**
 * Expose helpers.
 */

exports.before = before;
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
exports.after = after;
