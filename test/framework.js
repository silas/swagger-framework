'use strict';

/**
 * Module dependencies.
 */

var Environment = require('swagger-schema/environment');
var index = require('swagger-schema/fixtures/index.json');
var lodash = require('lodash');
var pet = require('swagger-schema/fixtures/pet.json');
var sinon = require('sinon');

var Api = require('../lib/api');
var Docs = require('../lib/docs');
var Framework = require('../lib/framework');
var Router = require('../lib/framework/router');

/**
 * Helper functions.
 */

function newOptions() {
  return { basePath: pet.basePath };
}

function newFramework() {
  return new Framework(newOptions());
}

function newModel() {
  return lodash.cloneDeep(pet.models.Tag);
}

/**
 * Tests
 */

describe('Framework', function() {
  describe('constructor', function() {
    it('should work with new', function(done) {
      var options = newOptions();
      var framework = new Framework(options);

      framework.spec.swaggerVersion.should.eql('1.2');
      framework.spec.basePath.should.eql(options.basePath);
      framework.spec.apiVersion.should.eql('0.0.0');
      framework.spec.apis.should.eql([]);
      framework.spec.authorizations.should.eql({});
      framework.env.should.be.an.instanceof(Environment);
      framework.docs.should.be.an.instanceof(Docs);
      framework.router.should.be.an.instanceof(Router);
      framework.apis.should.eql({});
      framework.middleware.should.eql({});
      framework.models.should.eql({});

      done();
    });

    it('should work without new', function(done) {
      var options = newOptions();
      var framework = Framework(options);  // jshint ignore:line

      framework.spec.swaggerVersion.should.eql('1.2');
      framework.spec.basePath.should.eql(options.basePath);
      framework.spec.apiVersion.should.eql('0.0.0');
      framework.spec.apis.should.eql([]);
      framework.spec.authorizations.should.eql({});
      framework.env.should.be.an.instanceof(Environment);
      framework.docs.should.be.an.instanceof(Docs);
      framework.router.should.be.an.instanceof(Router);
      framework.apis.should.eql({});
      framework.middleware.should.eql({});
      framework.models.should.eql({});

      done();
    });
  });

  describe('setup', function() {
    beforeEach(function() {
      this.framework = newFramework();
    });

    it('should setup apis', function(done) {
      var setup = sinon.spy();

      this.framework.apis['/test'] = {
        setup: setup,
      };

      this.framework.setup();

      setup.called.should.eql(true);
      setup.args[0][0].should.eql(this.framework);

      done();
    });
  });

  describe('api', function() {
    beforeEach(function() {
      this.framework = newFramework();
      this.spec = {
        path: pet.resourcePath,
        description: index.apis[0].description,
      };
    });

    it('should create and register an Api', function(done) {
      this.framework.api(this.spec);

      this.framework.apis.should.have.property(this.spec.path);
      this.framework.apis[this.spec.path].should.be.an.instanceof(Api);
      this.framework.apis[this.spec.path].spec.should.eql(this.spec);

      done();
    });

    it('should register an Api', function(done) {
      var api = new Api(this.spec);

      this.framework.api(api);
      this.framework.apis[this.spec.path].should.eql(api);

      done();
    });
  });

  describe('model', function() {
    beforeEach(function() {
      this.framework = newFramework();
    });

    it('should throw on invalid model', function(done) {
      var self = this;

      (function() {
        self.framework.model({ properties: {} });
      }).should.throw(/Validation failed/);

      done();
    });

    it('should register valid models', function(done) {
      this.framework.model(newModel());

      done();
    });
  });

  describe('dispatcher', function() {
    beforeEach(function() {
      this.framework = newFramework();
    });

    it('should call setup', function(done) {
      var setup = sinon.spy();

      this.framework.setup = setup;

      this.framework.dispatcher();

      setup.called.should.eql(true);

      done();
    });

    it('should call router.dispatcher with options', function(done) {
      var dispatcher = sinon.spy();
      var options = {};

      this.framework.router.dispatcher = dispatcher;
      this.framework.setup = sinon.spy();

      this.framework.dispatcher(options);

      dispatcher.called.should.eql(true);
      dispatcher.args[0][0].should.eql(options);

      done();
    });
  });
});
