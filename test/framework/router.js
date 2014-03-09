'use strict';

/**
 * Module dependencies.
 */

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
    this.callback = this.framework.callback();
    this.request = request(this.callback);
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
      .put('/pet/123')
      .expect(405)
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
      .end(function(err) {
        if (err) throw err;

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

  it('should accept valid path', function(done) {
    var path = { petId: 'abc' };

    this.request
      .get('/pet/' + path.petId)
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err) {
        if (err) throw err;

        done();
      });
  });

  it('should accept valid query', function(done) {
    var query = { status: 'pending' };

    this.request
      .get('/pet/findByStatus')
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

  it('should reject valid query', function(done) {
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

  it('should reject unsupported Content-Type', function(done) {
    var body = { body: newPet() };

    this.request
      .post('/pet')
      .type('form')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(415)
      .end(function(err) {
        if (err) throw err;

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

    this.request
      .post('/pet')
      .type('json')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

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

    this.request
      .post('/pet/10')
      .type('form')
      .send(form)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          path: { petId: 10 },
          form: form,
        });

        done();
      });
  });
});
