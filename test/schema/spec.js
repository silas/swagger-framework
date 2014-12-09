'use strict';

/**
 * Module dependencies.
 */

require('should');

var spec = require('../../lib')._schema.spec;

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
      spec.validateThrow('ResourceListing', resourceListing);
    });
  });

  describe('ApiDeclaration', function() {
    it('should validate', function() {
      spec.validateThrow('ApiDeclaration', pet);
      spec.validateThrow('ApiDeclaration', store);
      spec.validateThrow('ApiDeclaration', user);
    });
  });
});
