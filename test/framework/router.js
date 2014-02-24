'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');

var fixtures = require('../fixtures');

/**
 * Tests
 */

describe('framework.router', function() {
  beforeEach(function() {
    this.framework = fixtures.framework();
    this.app = this.framework.dispatcher();
    this.request = request(this.app);
  });

  it('should accept valid post', function(done) {
    var content = {
      body: {
        id: 50,
        name: 'Fluffy',
      },
    };

    this.request
      .post('/pet')
      .type('json')
      .send(content)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;

        res.body.request.should.eql({
          body: content,
        });

        done();
      });
  });
});
