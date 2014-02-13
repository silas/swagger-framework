'use strict';

var ZSchema = require('z-schema');
var express = require('express');
var request = require('supertest');
var helper = require('./helper');
var schema = require('../lib/schema');

describe('docs', function() {
  beforeEach(function() {
    this.app = express();
    this.app.use('/s1', helper.s1().dispatcher());
    this.request = request(this.app);
  });

  it('should render api declaration', function(done) {
    this.request
      .get('/s1/api-docs/hello')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        ZSchema.validate(res.body, schema.swagger.declaration, function(err) {
          if (err) {
            if (err.errors) {
              err.message += '\n' + JSON.stringify(err.errors, null, 4);
            }
            throw err;
          }
          done();
        });
      });
  });
});
