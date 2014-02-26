'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');

var Environment = require('../lib/environment');
var Operation = require('../lib/operation');

var pet = require('./fixtures/pet.json');

/**
 * Tests
 */

describe('Operation', function() {
  describe('constructor', function() {
    it('should work with new', function(done) {
      var fn1 = function() {};
      var fn2 = function() {};
      var spec = { hello: 'world' };

      var operation = new Operation(spec, fn1, fn2);

      operation.spec.should.eql(spec);
      operation.fn.should.eql([fn1, fn2]);
      operation.middleware.should.eql({});

      done();
    });

    it('should work without new', function(done) {
      var fn1 = function() {};
      var fn2 = function() {};
      var spec = { hello: 'world' };

      var operation = Operation(spec, fn1, fn2);  // jshint ignore:line

      operation.spec.should.eql(spec);
      operation.fn.should.eql([fn1, fn2]);
      operation.middleware.should.eql({});

      done();
    });
  });

  describe('setup', function() {
    beforeEach(function() {
      this.operation = new Operation();
      this.resource = {
        api: {
          framework: {
            env: new Environment(),
          },
        }
      };
    });

    it('should throw on invalid spec', function(done) {
      var self = this;

      this.operation.spec = { hello: 'world' };

      (function() {
        self.operation.setup(self.resource);
      }).should.throw(/Operation/);

      done();
    });

    it('should work for valid spec', function(done) {
      this.operation.spec = lodash.cloneDeep(pet.apis[0].operations[0]);

      this.operation.setup(this.resource);

      this.operation.resource.should.eql(this.resource);
      this.operation.parent.should.eql(this.resource);

      done();
    });
  });
});
