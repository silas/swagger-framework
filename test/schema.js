'use strict';

var jjv = require('jjv');
var schema = require('../lib/schema');
var should = require('should');

describe('schema', function() {

  beforeEach(function() {
    this.schema = jjv();
  });

  describe('api', function() {
    it('should validate', function(done) {
      var data = {
        path: '/hello',
        description: 'Hello API',
      };

      var errors = this.schema.validate(schema.swagger.api, data);
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

      this.schema.addSchema('Result', {
        id: 'Result',
        properties: {
          message: { type: 'string' },
        },
      });

      var errors = this.schema.validate(schema.swagger.resource, data);
      should.not.exist(errors);

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

      schema.validateThrow(schema.swagger.model, data);

      done();
    });
  });
});
