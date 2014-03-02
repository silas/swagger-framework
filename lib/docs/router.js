/**
 * DocsRouter uses a Docs object to implement an HTTP request listener that
 * handles Swagger API requests.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var parseUrl = require('url').parse;
var routington = require('routington');
var utils = require('swagger-schema/utils');

var http = require('../http');

/**
 * Initialize a new `DocsRouter`.
 *
 * @param {Docs} docs
 * @param {Object} options
 * @api private
 */

function DocsRouter(docs, options) {
  options = options || {};

  this.docs = docs;
  this.prefix = options.prefix || '/';
}

/**
 * Dispatch and handle requests
 *
 * @api public
 */

DocsRouter.prototype.dispatcher = function() {
  var self = this;

  // create trie
  var trie = routington();

  // check and define routes
  var define = function(path, handler) {
    var node = trie.define(path)[0];

    if (typeof handler !== 'function') {
      throw new Error('invalid handler');
    }

    node.handler = handler;
  };

  var prefix = self.prefix;

  // define api index route
  define(prefix, self.index());

  prefix = utils.stripSlash(prefix);

  // define api routes
  lodash.forOwn(self.docs.framework.apis, function(api) {
    define(prefix + api.spec.path, self.declaration(api.spec.path));
  });

  // dispatch request
  return function(req, res) {
    var match = trie.match(parseUrl(req.url).pathname);

    res.reply = http.reply(req, res);

    if (!match) return res.reply(404);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.reply(405);
    }

    match.node.handler(req, res);
  };
};

/**
 * API index.
 *
 * @api private
 */

DocsRouter.prototype.index = function() {
  var index = this.docs.index();

  return function(req, res) {
    res.reply(200, index);
  };
};

/**
 * API declaration.
 *
 * @api private
 */

DocsRouter.prototype.declaration = function(path) {
  var spec = this.docs.declaration(path);

  if (!spec) {
    throw new Error('unknown path: ' + path);
  }

  return function(req, res) {
    res.reply(200, spec);
  };
};

/**
 * Expose DocumentRouter.
 */

module.exports = DocsRouter;
