'use strict';

var express = require('express');
var helper = require('../helper');
var request = require('supertest');
var schema = require('../../lib/schema');

describe('docs', function() {
  beforeEach(function() {
    this.app = express();
    this.app.use('/api-docs', helper.api().docs.dispatcher());
    this.request = request(this.app);
  });

  it('should render api list', function(done) {
    this.request
      .get('/api-docs')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.apis[0].path.should.eql('/hello');
        res.body.apis[0].description.should.eql('Welcome to the world');

        done();
      });
  });

  it('should render api declaration', function(done) {
    this.request
      .get('/api-docs/hello')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        schema.validateThrow(schema.swagger.declaration, res.body);

        var body = res.body;
        body.apiVersion.should.eql('1.2.3');
        body.swaggerVersion.should.eql('1.2');
        body.basePath.should.eql('http://localhost');
        body.resourcePath.should.eql('/hello');
        body.consumes.should.eql(['application/json']);
        body.produces.should.eql(['application/json']);

        var api = body.apis[0];
        api.path.should.eql('/hello/{name}');

        var operation = api.operations[0];
        operation.method.should.eql('GET');
        operation.summary.should.eql('Say hello to the world');
        operation.nickname.should.eql('helloWorld');
        operation.parameters.should.eql([]);
        operation.type.should.eql('Reply');

        done();
      });
  });
});
