'use strict';

/**
 * Module dependencies.
 */

require('should');

var http = require('../lib/http');

/**
 * Tests
 */

describe('index', function() {
  describe('reply', function() {
    beforeEach(function() {
      var self = this;

      self.opts = {};

      self.statusCode = 200;
      self.body = { hello: 'world' };

      self.sf = {};

      self.req = {
        headers: {},
        method: 'GET',
        sf: self.sf,
      };

      self.res = {
        sf: self.sf,
        _headers: {},
      };

      self.res.getHeader = function(name) {
        name = name.toLowerCase();
        return this._headers[name];
      };

      self.res.removeHeader = function(name) {
        name = name.toLowerCase();
        delete this._headers[name];
      };

      self.res.setHeader = function(name, value) {
        name = name.toLowerCase();
        this._headers[name] = value;
      };

      self.run = function(callback) {
        var reply = http.reply(self.req, self.res, self.opts);

        self.res.end = function(body) {
          self.resBody = body;

          callback();
        };

        reply(self.statusCode, self.body);
      };
    });

    it('should create etag', function(done) {
      var self = this;

      self.opts.etag = true;

      self.run(function() {
        self.res._headers.should.have.property('etag');
        self.res._headers.etag.should.eql('fbc24bcc7a1794758fc1327fcfebdaf6');

        done();
      });
    });

    it('should not create etag', function(done) {
      var self = this;

      self.run(function() {
        self.res._headers.should.not.have.property('etag');

        done();
      });
    });

    it('should not create etag for non-GETs', function(done) {
      var self = this;

      self.opts.etag = true;
      self.req.method = 'HEAD';

      self.run(function() {
        self.res._headers.should.not.have.property('etag');

        done();
      });
    });

    it('should not create etag for non-200s', function(done) {
      var self = this;

      self.opts.etag = true;
      self.statusCode = 404;

      self.run(function() {
        self.res._headers.should.not.have.property('etag');

        done();
      });
    });

    it('should not create etag if already set', function(done) {
      var self = this;

      var etag = 'etag';

      self.opts.etag = true;
      self.res.setHeader('etag', etag);

      self.run(function() {
        self.res._headers.should.have.property('etag');
        self.res._headers.etag.should.eql(etag);

        done();
      });
    });

    it('should overwrite content-length if doesnt match', function(done) {
      var self = this;
      var length = JSON.stringify(self.body).length;
      var expectedType = 'application/json; charset=utf8';

      // Simulate a proxied request with a different response type and length
      self.res.setHeader('content-type', 'text/html');
      self.res.setHeader('content-length', 2);
      self.res._headers.should.have.property('content-length');
      self.res._headers['content-length'].should.eql(2);

      self.run(function() {
        self.res._headers.should.have.property('content-length');
        self.res._headers['content-length'].should.eql(length);

        self.res._headers.should.have.property('content-type');
        self.res._headers['content-type'].should.eql(expectedType);

        done();
      });
    });
  });
});
