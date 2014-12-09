'use strict';

/* jshint camelcase: false */

/**
 * Module dependencies.
 */

require('should');

var lodash = require('lodash');

var spec = require('../lib')._spec;

/**
 * Tests
 */

describe('spec', function() {
  it('should work with new', function() {
    spec.should.have.property('v1_2');
    spec.v1_2.should.have.length(11);

    lodash.each(spec.v1_2, function(obj) {
      obj.should.have.property('id');
    });
  });
});
