/**
 * Various HTTP helper functions and defaults.
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('swagger-framework:http');
var http = require('http');

/**
 * Default charset.
 */

var CHARSET = 'utf8';

/**
 * Encoders/Decoderes
 */

var encoder = {
  'application/json': JSON.stringify,
};

var decoder = {
  'application/json': JSON.parse,
};

/**
 * Reply to options request
 */

function options(req, res, methods) {
  res.setHeader('Allow', methods.join(' '));
}

/**
 * Reply to request
 */

function reply(req, res) {
  return function(statusCode, body) {
    var call = { args: [].slice.call(arguments) };

    // handle single argument replies
    if (typeof statusCode === 'string') {
      body = { message: statusCode };
      statusCode = 200;
    } else if (statusCode instanceof Error) {
      body = statusCode;
      statusCode = 500;
    }

    // handle error objects in replies
    if (body instanceof Error) {
      if (typeof body.statusCode === 'number') {
        statusCode = body.statusCode;
      }
      if (body.expose) {
        body = body.toJSON ? body.toJSON() : { message: body.message };
      } else {
        body = undefined;
      }
    }

    // default message
    if (body === undefined) {
      body = { message: http.STATUS_CODES[statusCode] || 'unknown response' };
    }

    call.statusCode = statusCode;
    call.body = body;

    // allow user to override body before sending
    if (req.sf.responseMessage) {
      call = req.sf.responseMessage(call);

      if (!call) {
        debug('responseMessage handled reply');
        return;
      }

      statusCode = call.statusCode;
      body = call.body;
    }

    res.statusCode = statusCode;

    var length = 0;
    var type;

    if (body !== undefined) {
      if (Buffer.isBuffer(body)) {
        length = body.length;
      } else if (res.sf && res.sf.produce) {
        type = res.sf.produce.mime;
        body = res.sf.produce.encoder(body);
        length = Buffer.byteLength(body, CHARSET);
      } else {
        type = 'application/json';
        body = encoder[type](body);
        length = Buffer.byteLength(body, CHARSET);
      }
    }

    if (type && !res.getHeader('content-type')) {
      res.setHeader('content-type', type + '; charset=' + CHARSET);
    }

    if (!res.getHeader('content-length')) {
      res.setHeader('content-length', length);
    }

    if (statusCode === 204 || statusCode === 304) {
      res.removeHeader('content-type');
      res.removeHeader('content-length');
      res.removeHeader('transfer-encoding');
      body = '';
    }

    return res.end(req.method === 'HEAD' ? null : body);
  };
}

/**
 * Strip slash
 */

function stripSlash(path) {
  if (path[path.length - 1] === '/') {
    return path.slice(0, path.length - 1);
  }

  return path;
}

/**
 * Expose http
 */

exports.CHARSET = CHARSET;
exports.STATUS_CODES = http.STATUS_CODES;
exports.decoder = decoder;
exports.encoder = encoder;
exports.options = options;
exports.reply = reply;
exports.stripSlash = stripSlash;
