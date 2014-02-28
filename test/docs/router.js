'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var declarationSchema = require('swagger-schema/data/api-declaration-schema');
var express = require('express');
var request = require('supertest');

var fixtures = require('../fixtures');

/**
 * Tests
 */

describe('DocsRouter', function() {
  beforeEach(function() {
    this.app = express();
    this.app.use('/api-docs', fixtures.framework().docs.dispatcher());
    this.request = request(this.app);
    this.env = new Environment();
  });

  it('should render api index', function(done) {
    this.request
      .get('/api-docs')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.apis[0].path.should.eql('/pet');
        res.body.apis[0].description.should.eql('Operations about pets');

        done();
      });
  });

  it('should render api declaration', function(done) {
    var self = this;

    this.request
      .get('/api-docs/pet')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        self.env.validateThrow(declarationSchema, res.body);

        var body = res.body;
        body.apiVersion.should.eql('1.0.0');
        body.swaggerVersion.should.eql('1.2');
        body.basePath.should.eql('http://petstore.swagger.wordnik.com/api');
        body.resourcePath.should.eql('/pet');

        var api = body.apis[0];
        api.path.should.eql('/pet/{petId}');

        var operation = api.operations[0];
        operation.method.should.eql('GET');
        operation.summary.should.eql('Find pet by ID');
        operation.nickname.should.eql('getPetById');
        operation.parameters.should.eql(
          [
            {
              description: 'ID of pet that needs to be fetched',
              format: 'int64',
              items: {},
              maximum: '100000.0',
              minimum: '1.0',
              name: 'petId',
              paramType: 'path',
              required: true,
              type: 'integer'
            }
          ]
        );
        operation.type.should.eql('Pet');

        done();
      });
  });
});
