'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var qs = require('qs');
var request = require('supertest');

var fixtures = require('../fixtures');

/**
 * Helper functions.
 */

function newPet() {
  return {
    id: 50,
    name: 'Fluffy',
  };
}

/**
 * Tests
 */

describe('FrameworkRouter', function() {
  beforeEach(function() {
    this.framework = fixtures.framework();
    this.dispatcher = this.framework.dispatcher();
    this.request = request(this.dispatcher);
  });

  it('should respond to OPTIONS request', function(done) {
    this.request
      .options('/pet/123')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.headers.allow.should.eql('GET DELETE PATCH POST');

        done();
      });
  });

  it('should handle HEAD via GET when not defined', function(done) {
    this.request
      .head('/pet/123')
      .expect(200)
      .end(function(err) {
        if (err) throw err;

        done();
      });
  });

  it('should 405 when operation not defined', function(done) {
    this.request
      .head('/pet/123')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        parseInt(res.headers['content-length'], 10).should.be.above(100);
        res.text.should.eql('');

        done();
      });
  });

  it('should 406 when not acceptable', function(done) {
    var path = { petId: 123 };

    this.request
      .patch('/pet/' + path.petId)
      .accept('application/soap+xml')
      .expect(406)
      .end(function(err, res) {
        if (err) throw err;

        res.body.message.should.eql('Not acceptable (application/soap+xml), ' +
          'supports: application/json, application/xml');

        done();
      });
  });

  it('should accept valid path', function(done) {
    var path = { petId: 123 };

    this.request
      .get('/pet/' + path.petId)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          path: path,
        });

        done();
      });
  });

  it('should reject invalid path', function(done) {
    var path = { petId: 'abc' };

    this.request
      .get('/pet/' + path.petId)
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err, res) {
        if (err) throw err;

        res.body.should.eql({
          message: 'Validation failed',
          errors: [
            {
              code: 'VALIDATION_INVALID_TYPE',
              message: 'Invalid type: string should be integer',
              data: 'abc',
              path: '$.path.petId',
            },
          ],
        });

        done();
      });
  });

  it('should accept valid query', function(done) {
    var query = { status: 'pending' };
    var queryExtra = lodash.merge({ some: 'extra' }, query);

    this.request
      .get('/pet/findByStatus')
      .query(queryExtra)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          query: query,
        });

        done();
      });
  });

  it('should use default query', function(done) {
    var query = { status: 'available' };

    this.request
      .get('/pet/findByStatus')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          query: query,
        });

        done();
      });
  });

  it('should reject invalid query', function(done) {
    var query = { status: 'dancing' };

    this.request
      .get('/pet/findByStatus')
      .query(query)
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err) {
        if (err) throw err;

        done();
      });
  });

  it('should normalize allowMultiple query to an array', function(done) {
    var query = { tag: ['one'] };

    this.request
      .get('/pet/findByTags')
      .query({ tag: 'one' })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          query: query,
        });

        done();
      });
  });

  it('should accept multiple query parameters', function(done) {
    var query = { tag: ['one', 'two'] };

    var mime = 'application/x-www-form-urlencoded';
    this.framework.router.decoder[mime] = qs.parse;

    request(this.framework.dispatcher())
      .get('/pet/findByTags')
      .query(query)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          query: query,
        });

        done();
      });
  });

  it('should accept valid headers', function(done) {
    this.request
      .del('/pet/47')
      .set('x-ignore', 'true')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.header.should.eql({
          'x-ignore': true,
        });

        done();
      });
  });

  it('should accept multiple header parameters', function(done) {
    var req = this.request
      .post('/pet/47')
      .type('form')
      .send({ name: 'nameName', status: 'statusStatus' });

    req.request().setHeader('x-ignore', ['name', 'status']);

    req
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.header.should.eql({
          'x-ignore': ['name', 'status'],
        });

        done();
      });
  });

  it('should reject unsupported Content-Type', function(done) {
    var body = { body: newPet() };

    this.request
      .post('/pet')
      .type('form')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(415)
      .end(function(err, res) {
        if (err) throw err;

        res.body.message.should.eql('Unsupported Content-Type (application/x-' +
          'www-form-urlencoded), supports: application/json, application/xml');

        done();
      });
  });

  it('should reject invalid json', function(done) {
    var body = { bob: 'name' };

    this.request
      .post('/pet')
      .type('json')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err) {
        if (err) throw err;

        done();
      });
  });

  it('should accept valid json', function(done) {
    var body = newPet();
    var bodyExtra = lodash.merge({ some: 'extra' }, body);

    this.request
      .post('/pet')
      .type('json')
      .send(bodyExtra)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.should.not.have.property('some');

        res.body.request.should.eql({
          body: body,
        });

        done();
      });
  });

  it('should reject invalid form', function(done) {
    var form = { name: 'a' };

    this.request
      .post('/pet/10')
      .type('form')
      .send(form)
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err) {
        if (err) throw err;

        done();
      });
  });

  it('should accept valid form', function(done) {
    var form = { name: 'Fluffy' };
    var formExtra = lodash.merge({ some: 'extra' }, form);

    this.request
      .post('/pet/10')
      .type('form')
      .send(formExtra)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.should.have.property('request');

        var request = res.body.request;
        request.should.have.property('path');
        request.path.should.eql({ petId: 10 });
        request.should.have.property('form');
        request.form.should.eql(form);

        done();
      });
  });
});
