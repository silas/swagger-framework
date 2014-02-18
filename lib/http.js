'use strict';

/**
 * Module dependencies.
 */

var http = require('http');

/**
 * Default charset.
 */

var CHARSET = 'utf-8';

/**
 * Reply to options request
 */

function options(req, res, methods) {
  res.setHeader('Allow', methods.join(' '));
}

/**
 * Reply to request
 */

function reply(req, res, code, data) {
  res.statusCode = code;

  if (!data && data !== null) {
    data = { message: http.STATUS_CODES[code] || 'unknown error' };
  }

  data = data ? JSON.stringify(data, null, 4) + '\n' : '';

  res.setHeader('Content-Length', Buffer.byteLength(data, CHARSET));

  if (data) {
    res.setHeader('Content-Type', 'application/json; charset=' + CHARSET);

    if (req.method !== 'HEAD') {
      return res.end(data);
    }
  }

  res.end();
}

/**
 * Expose http
 */

exports.CHARSET = CHARSET;
exports.STATUS_CODES = http.STATUS_CODES;
exports.options = options;
exports.reply = reply;
