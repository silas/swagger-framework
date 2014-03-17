'use strict';

// Taken from https,//github.com/joyent/node/blob/master/lib/_http_incoming.js
var singleHeaders = [
  'content-type',
  'content-length',
  'user-agent',
  'referer',
  'host',
  'authorization',
  'proxy-authorization',
  'if-modified-since',
  'if-unmodified-since',
  'from',
  'location',
  'max-forwards',
];

/**
 * Expose constants
 */

exports.singleHeaders = singleHeaders;
