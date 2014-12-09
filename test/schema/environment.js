'use strict';

/**
 * Module dependencies.
 */

var should = require('should');

var Environment = require('../../lib/schema/environment');

/**
 * Tests
 */

describe('Environment', function() {
  beforeEach(function() {
    this.env = new Environment();
    this.env.setup();
  });

  describe('coerceSchema', function() {
    it('should convert single item to an array', function() {
      var schema = {
        type: 'object',
        properties: { one: { type: 'array' } },
      };
      var data = { one: 1 };

      this.env.validateThrow(schema, data, { coerce: true });

      data.one.should.eql([1]);
    });

    it('should convert empty object to array', function() {
      var schema = {
        type: 'object',
        properties: { one: { type: 'array' } },
      };
      var data = { one: {} };

      this.env.validateThrow(schema, data, { coerce: true });

      data.one.should.eql([]);
    });

    it('should convert number to string', function() {
      var schema = {
        type: 'object',
        properties: { one: { type: 'string' } },
      };
      var data = { one: 123 };

      this.env.validateThrow(schema, data, { coerce: true });

      data.one.should.equal('123');
    });

    it('should convert string to integer', function() {
      var schema = {
        type: 'object',
        properties: { one: { type: 'integer' } },
      };
      var data = { one: '123' };

      this.env.validateThrow(schema, data, { coerce: true });

      data.one.should.equal(123);
    });

    it('should convert string to boolean', function() {
      var schema = {
        type: 'object',
        properties: {
          false1: { type: 'boolean' },
          false2: { type: 'boolean' },
          false3: { type: 'boolean' },
          false4: { type: 'boolean' },
          true1: { type: 'boolean' },
          true2: { type: 'boolean' },
          true3: { type: 'boolean' },
        },
      };
      var data = {
        false1: '0',
        false2: 0,
        false3: 'false',
        false4: '',
        true1: '1',
        true2: 1,
        true3: 'true',
      };

      this.env.validateThrow(schema, data, { coerce: true });

      data.false1.should.equal(false);
      data.false2.should.equal(false);
      data.false3.should.equal(false);
      data.false4.should.equal(false);
      data.true1.should.equal(true);
      data.true2.should.equal(true);
      data.true3.should.equal(true);
    });

    it('should convert negative number', function() {
      var schema = {
        type: 'object',
        properties: { one: { type: 'number' } },
      };
      var number = -23.5;
      var data = { one: '' + number };

      this.env.validateThrow(schema, data, { coerce: true });

      data.one.should.equal(number);
    });
  });

  describe('validate', function() {
    it('should render errors', function() {
      var schema = {
        type: 'object',
        properties: { ok: { type: 'boolean' } },
      };
      var data = { ok: 1 };

      var result = this.env.validate(schema, data);

      should(result).be.type('object');
      result.errors.should.be.type('function');

      result.errors().should.eql([
        {
          code: 'VALIDATION_INVALID_TYPE',
          message: 'Invalid type: integer should be boolean',
          data: 1,
          path: '$.ok',
        }
      ]);
    });
  });
});
