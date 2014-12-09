/**
 * Various Swagger and JSON Schema constants.
 */

'use strict';

var primitives = [
  'array',
  'boolean',
  'integer',
  'string',
];

var notModel = [
  'null',
  'number',
  'object',
  'void',
].concat(primitives);

var allowMultiple = [
  'query',
  'header',
  'path',
];

var booleanMap = {
  '': false,
  0: false,
  1: true,
  false: false,
  true: true,
};

var primary = [
  'boolean',
  'number',
  'string',
];

/**
 * Expose utils.
 */

exports.allowMultiple = allowMultiple;
exports.booleanMap = booleanMap;
exports.notModel = notModel;
exports.primary = primary;
exports.primitives = primitives;
