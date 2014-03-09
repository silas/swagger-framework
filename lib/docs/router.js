/**
 * DocsRouter uses a Docs object to implement an HTTP request listener that
 * handles Swagger API requests.
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('swagger-framework:docs:router');
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
  debug('create docs router');

  options = options || {};

  this.docs = docs;
  this.prefix = options.prefix || '/';
}

/**
 * Returns callback suitable `http.createServer()`.
 *
 * @api public
 */

DocsRouter.prototype.callback = function(options) {
  var self = this;

  debug('framework docs callback');

  options = options || {};

  // allow user to inject their own reply
  if (!options.setup) {
    options.setup = function(req, res) {
      req.sf.reply = http.reply(req, res);
    };
  }

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
  return function(req, res, next) {
    var match = trie.match(parseUrl(req.url).pathname);

    req.sf = res.sf = {};

    // setup
    options.setup(req, res);

    if (!match) {
      if (typeof next === 'function') {
        return next();
      } else {
        return res.sf.reply(404);
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.sf.reply(405);
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
    res.sf.reply(200, index);
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
    res.sf.reply(200, spec);
  };
};

/**
 * Expose DocumentRouter.
 */

module.exports = DocsRouter;
