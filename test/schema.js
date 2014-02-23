'use strict';

/**
 * Module dependencies.
 */

var should = require('should');

var Environment = require('../lib/environment');
var schema = require('../lib/schema');

/**
 * Tests
 */

describe('schema', function() {
  beforeEach(function() {
    this.env = new Environment();
  });

  describe('api', function() {
    it('should validate', function(done) {
      var data = {
        path: '/hello',
        description: 'Hello API',
      };

      var errors = this.env.validateThrow(schema.swagger.api, data);
      should.not.exist(errors);

      done();
    });
  });

  describe('resource', function() {
    it('should validate', function(done) {
      var data = {
        method: 'GET',
        path: '/hello/world',
        summary: 'Say hello to the world',
        nickname: 'helloWorld',
        parameters: [],
        type: 'Result',
      };

      this.env.schema.addSchema('Result', {
        id: 'Result',
        properties: {
          message: { type: 'string' },
        },
      });

      this.env.validateThrow(schema.swagger.resource, data);

      done();
    });
  });

  describe('model', function() {
    it('should validate', function(done) {
      var data = {
        id: 'Result',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      };

      this.env.validateThrow(schema.swagger.model, data);

      done();
    });
  });
});
