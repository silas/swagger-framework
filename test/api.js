'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var index = require('swagger-schema/fixtures/index.json');
var lodash = require('lodash');
var pet = require('swagger-schema/fixtures/pet.json');

var Api = require('../lib/api');
var Resource = require('../lib/resource');

/**
 * Tests
 */

describe('Api', function() {
  describe('constructor', function() {
    it('should work with new', function(done) {
      var spec = { hello: 'world' };

      var api = new Api(spec);

      api.spec.should.eql(spec);
      api.spec.apis.should.eql([]);
      api.middleware.should.eql({});
      api.resources.should.eql({});

      done();
    });

    it('should work without new', function(done) {
      var spec = { hello: 'world' };

      var api = Api(spec);  // jshint ignore:line

      api.spec.should.eql(spec);
      api.spec.apis.should.eql([]);
      api.middleware.should.eql({});
      api.resources.should.eql({});

      done();
    });
  });

  describe('setup', function() {
    beforeEach(function() {
      this.api = new Api({
        path: pet.resourcePath,
        description: index.apis[0].description,
        apis: [],
      });
      this.framework = {
        env: new Environment(),
      };
    });

    it('should throw on invalid spec', function(done) {
      var self = this;

      self.api.spec = { hello: 'world', apis: [] };

      (function() {
        self.api.setup(self.framework);
      }).should.throw(/Validation failed/);

      done();
    });

    it('should work for valid spec', function(done) {
      this.api.setup(this.framework);

      this.api.framework.should.eql(this.framework);
      this.api.parent.should.eql(this.framework);

      done();
    });

    it('should validate path starts with forward slash', function(done) {
      var self = this;

      self.api.spec.path = 'hello/';

      (function() {
        self.api.setup(self.framework);
      }).should.throw(/path must start with \//);

      done();
    });
  });

  describe('resource', function() {
    beforeEach(function() {
      this.api = new Api({
        path: pet.resourcePath,
        description: index.apis[0].description,
        apis: [],
      });
      this.spec = lodash.cloneDeep(pet.apis[0]);
    });

    it('should create and register a Resource', function(done) {
      this.api.resource(this.spec);

      this.api.resources.should.have.property(this.spec.path);
      this.api.resources[this.spec.path].
        should.be.an.instanceof(Resource);
      this.api.resources[this.spec.path].spec.should.eql(this.spec);

      done();
    });

    it('should register an Resource', function(done) {
      var resource = new Resource(this.spec);

      this.api.resource(resource);
      this.api.resources[this.spec.path].should.eql(resource);

      done();
    });
  });
});
