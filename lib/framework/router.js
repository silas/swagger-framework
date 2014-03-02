/**
 * FrameworkRouter uses a Framework object to implement an HTTP request
 * listener that routes, decodes, validates, and calls user defined handlers.
 */

'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var parseUrl = require('url').parse;
var routington = require('routington');

var http = require('../http');
var middleware = require('./middleware');

/**
 * Initialize a new `FrameworkRouter`.
 *
 * @param {Framework} framework
 * @api private
 */

function FrameworkRouter(framework) {
  this.framework = framework;
}

/**
 * Build routes
 *
 * @api private
 */

FrameworkRouter.prototype.build = function(trie) {
  var framework = this.framework;

  lodash.forOwn(framework.apis, function(api) {
    lodash.forOwn(api.resources, function(resource) {

      // convert swagger path to routington
      var path = resource.spec.path;
      path = path.replace('{format}', 'json');
      path = path.replace(/\{(\w+)\}/g, function(src, dst) {
        return ':' + dst;
      });

      // define resource path
      var node = trie.define(path)[0];

      node.methods = {};

      // add resource methods to trie
      lodash.forOwn(resource.operations, function(operation, method) {
        var stack = [];

        stack.push(middleware.header(operation));
        stack.push(middleware.path(operation));
        stack.push(middleware.query(operation));
        stack.push(middleware.authenticate(operation));
        stack.push(middleware.body(operation));
        stack.push(middleware.authorize(operation));

        var fn = resource.operations[method].fn;
        if (fn && fn.length) stack = stack.concat(fn);

        // filter non-functions
        stack = stack.filter(function(fn) {
          return typeof fn === 'function';
        });

        node.methods[method] = { stack: stack, operation: operation };
      });

      node.handle = function(req, res, parentNext) {
        var method = node.methods[req.method];

        if (!method) {
          if (req.method === 'OPTIONS') {
            http.options(req, res, Object.keys(node.methods));
            return res.sf.reply(200, null);
          }

          if (req.method === 'HEAD') {
            method = node.methods.GET;
          }
        }

        if (!method) return res.sf.reply(405);

        req.sf.operation = method.operation;

        var i = 0;
        (function next(err) {
          if (err) return res.sf.reply(500, err);
          var fn = method.stack[i++];
          if (fn) {
            fn(req, res, next);
          } else {
            if (typeof parentNext === 'function') {
              parentNext();
            } else {
              // TODO: what should we do here?
              res.sf.reply(400);
            }
          }
        })();
      };
    });
  });

  return trie;
};

/**
 * Dispatch and handle requests
 *
 * @api private
 */

FrameworkRouter.prototype.dispatcher = function(options) {
  options = options || {};

  // allow user to inject their own reply
  if (!options.setup) {
    options.setup = function(req, res) {
      req.sf.reply = http.reply(req, res);
    };
  }

  // create trie
  var trie = this.build(routington());

  // dispatch request
  return function(req, res, next) {
    // swagger object
    req.sf = res.sf = {
      url: parseUrl(req.url, true),
    };

    var match = trie.match(req.sf.url.pathname);

    // setup
    options.setup(req, res);

    // match path
    if (match && match.node && match.node.handle) {
      req.params = match.param;
      return match.node.handle(req, res, next);
    }

    if (typeof next === 'function') {
      next();
    } else {
      res.sf.reply(404);
    }
  };
};

/**
 * Expose FrameworkRouter.
 */

module.exports = FrameworkRouter;
