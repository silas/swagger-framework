'use strict';

/**
 * Module dependencies.
 */

var http = require('../http');
var parseUrl = require('url').parse;
var routington = require('routington');

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
 * @api private
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

  // define api list route
  define(prefix, self.list());

  // strip trailing forward slash
  if (prefix[prefix.length - 1] === '/') {
    prefix = prefix.slice(0, prefix.length - 1);
  }

  // define api routes
  self.docs.apis.forEach(function(api) {
    define(prefix + api.path, self.declaration(api.path));
  });

  // dispatch request
  return function(req, res) {
    var match = trie.match(parseUrl(req.url).pathname);

    // normalized reply
    res.reply = function(code, data) {
      http.reply(req, res, code, data);
    };

    if (!match) return res.reply(404);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.reply(405);
    }

    match.node.handler(req, res);
  };
};

/**
 * API list.
 *
 * @api private
 */

DocsRouter.prototype.list = function() {
  var list = this.docs.list();

  return function(req, res) {
    res.reply(200, list);
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
