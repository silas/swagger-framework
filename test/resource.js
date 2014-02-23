'use strict';

var Environment = require('../lib/environment');
var Operation = require('../lib/operation');
var Resource = require('../lib/resource');
var lodash = require('lodash');
var pet = require('./helper/pet.json');

describe('Resource', function() {
  describe('constructor', function() {
    it('should work with new', function(done) {
      var fn = function() {};
      var spec = { hello: 'world' };

      var resource = new Resource(spec, fn);

      resource.spec.should.eql(spec);
      resource.spec.operations.should.eql([]);
      resource.middleware.should.eql({});
      resource.operations.should.eql({});

      done();
    });

    it('should work without new', function(done) {
      var fn = function() {};
      var spec = { hello: 'world' };

      var resource = Resource(spec, fn);  // jshint ignore:line

      resource.spec.should.eql(spec);
      resource.spec.operations.should.eql([]);
      resource.middleware.should.eql({});
      resource.operations.should.eql({});

      done();
    });
  });

  describe('setup', function() {
    beforeEach(function() {
      this.resource = new Resource({});
      this.api = {
        spec: { path: '/pet' },
        framework: {
          env: new Environment(),
        },
      };
    });

    it('should throw on invalid spec', function(done) {
      var self = this;

      self.resource.spec = { hello: 'world', operations: [] };
      self.resource.operations = {};

      (function() {
        self.resource.setup(self.api);
      }).should.throw(/invalid/);

      done();
    });

    it('should work for valid spec', function(done) {
      this.resource.spec = lodash.cloneDeep(pet.apis[0]);
      this.resource.spec.operations = [];
      this.resource.operations = {};

      this.resource.setup(this.api);

      this.resource.api.should.eql(this.api);
      this.resource.parent.should.eql(this.api);

      done();
    });

    it('should validate path starts with forward slash', function(done) {
      var self = this;

      self.resource.spec = lodash.cloneDeep(pet.apis[0]);
      self.resource.spec.operations = [];
      self.resource.spec.path = 'hello/';
      self.resource.operations = {};

      (function() {
        self.resource.setup(self.api);
      }).should.throw(/path must start with \//);

      done();
    });

    it('should insert path when it does not match api', function(done) {
      this.resource.spec = lodash.cloneDeep(pet.apis[0]);
      this.resource.spec.operations = [];
      this.resource.spec.path = '/hello';
      this.resource.operations = {};

      this.resource.setup(this.api);

      this.resource.spec.path.should.eql('/pet/hello');
      this.resource.api.should.eql(this.api);
      this.resource.parent.should.eql(this.api);

      done();
    });
  });

  describe('operation', function() {
    beforeEach(function() {
      this.resource = new Resource(lodash.cloneDeep(pet.apis[0]));
      this.resource.spec.operations = [];
      this.resource.operations = {};
      this.spec = lodash.cloneDeep(pet.apis[0].operations[0]);
    });

    it('should create and register an Operation', function(done) {
      this.resource.operation(this.spec);

      this.resource.operations.should.have.property(this.spec.method);
      this.resource.operations[this.spec.method].
        should.be.an.instanceof(Operation);
      this.resource.operations[this.spec.method].spec.should.eql(this.spec);

      done();
    });

    it('should register an Operation', function(done) {
      var operation = new Operation(this.spec);

      this.resource.operation(operation);
      this.resource.operations[this.spec.method].should.eql(operation);

      done();
    });
  });
});
