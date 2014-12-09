'use strict';

/**
 * Module dependencies.
 */

require('should');

var schema = require('../../lib/schema/spec');

var pet = require('./fixtures/pet');
var resourceListing = require('./fixtures/index');
var store = require('./fixtures/store');
var user = require('./fixtures/user');

/**
 * Tests
 */

describe('spec', function() {
  describe('ResourceListing', function() {
    it('should validate', function() {
      schema.validateThrow('ResourceListing', resourceListing);
    });
  });

  describe('ApiDeclaration', function() {
    it('should validate', function() {
      schema.validateThrow('ApiDeclaration', pet);
      schema.validateThrow('ApiDeclaration', store);
      schema.validateThrow('ApiDeclaration', user);
    });
  });
});
