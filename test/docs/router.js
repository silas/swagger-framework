'use strict';

/**
 * Module dependencies.
 */

require('should');

var request = require('supertest');

var schema = require('../../lib/schema/spec');

var fixtures = require('../fixtures');

/**
 * Tests
 */

describe('DocsRouter', function() {
  beforeEach(function() {
    this.dispatcher = fixtures.framework().docs.dispatcher();
    this.request = request(this.dispatcher);
  });

  it('should render api index', function(done) {
    this.request
      .get('/')
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
    this.request
      .get('/pet')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        schema.validateThrow('ApiDeclaration', res.body);

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

        var models = body.models;
        models.should.have.property('Tag');
        models.should.have.property('Pet');
        models.should.have.property('Category');

        done();
      });
  });
});
