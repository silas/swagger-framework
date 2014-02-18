'use strict';

var express = require('express');
var request = require('supertest');
var helper = require('./helper');
var schema = require('../lib/schema');

describe('docs', function() {
  beforeEach(function() {
    this.app = express();
    this.app.use('/api-docs', helper.api().docs.dispatcher());
    this.request = request(this.app);
  });

  it('should render api declaration', function(done) {
    this.request
      .get('/api-docs/hello')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        schema.validateThrow(schema.swagger.declaration, res.body);
        done();
      });
  });
});
