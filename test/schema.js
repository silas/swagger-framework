'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var apiSchema = require('swagger-schema/data/api');
var modelSchema = require('swagger-schema/data/model');
var resourceSchema = require('swagger-schema/data/resource');
var should = require('should');

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

      var errors = this.env.validateThrow(apiSchema, data);
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

      this.env.validateThrow(resourceSchema, data);

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

      this.env.validateThrow(modelSchema, data);

      done();
    });
  });
});
