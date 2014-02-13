'use strict';

var ZSchema = require('z-schema');
var should = require('should');
var schema = require('../lib/schema');

describe('schema', function() {
  before(function() {
    this.schema = new ZSchema();
  });

  describe('api', function() {
    it('should validate', function(done) {
      var data = {
        path: '/hello',
        description: 'Hello API',
      };

      ZSchema.validate(data, schema.swagger.api, function(err) {
        should.not.exist(err);
        done();
      });
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

      ZSchema.validate(data, schema.swagger.resource, function(err) {
        should.not.exist(err);
        done();
      });
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

      ZSchema.validate(data, schema.swagger.model, function(err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
