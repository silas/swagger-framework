/**
 * Various HTTP helper functions and defaults.
 */

'use strict';

/**
 * Module dependencies.
 */

var http = require('http');

/**
 * Default charset.
 */

var CHARSET = 'utf8';

/**
 * Encoders/Decoderes
 */

var encoder = {
  'application/json': function(data) { return JSON.stringify(data, null, 4); },
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
  return function(statusCode, data) {
    if (data instanceof Error) {
      if (http.STATUS_CODES[data.statusCode]) {
        statusCode = data.statusCode;
      }
      data = { message: data.message };
    }

    res.statusCode = statusCode;

    if (!data && data !== null) {
      data = { message: http.STATUS_CODES[statusCode] || 'unknown error' };
    }

    if (data) {
      var length = 0;
      var type;

      if (Buffer.isBuffer(data)) {
        length = data.length;
      } else if (res.sf && res.sf.produce) {
        type = res.sf.produce.mime;
        data = res.sf.produce.encoder(data);
        length = Buffer.byteLength(data, CHARSET);
      } else {
        type = 'application/json';
        data = encoder[type](data);
        length = Buffer.byteLength(data, CHARSET);
      }

      if (type && !res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', type + '; charset=' + CHARSET);
      }

      res.setHeader('Content-Length', length);

      if (req.method !== 'HEAD') {
        return res.end(data);
      }
    }

    res.end();
  };
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
