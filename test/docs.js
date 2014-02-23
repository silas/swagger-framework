'use strict';

/**
 * Module dependencies.
 */

var Docs = require('../lib/docs');

/**
 * Tests
 */

describe('Docs', function() {
  describe('index', function() {
    it('should validate', function(done) {
      var docs = new Docs({
        spec: {
          apiVersion: '1.2.3',
          swaggerVersion: '1.2',
          basePath: 'http://example.org',
          apis: ['/test'],
          authorizations: {
            oauth2: 'authorizations-ok',
          },
        },
        apis: {
          '/test': { spec: { path: '/test', description: 'description' } },
        },
        found: true,
        setup: function() {},
      });

      var spec = docs.index();

      spec.should.have.property('apiVersion');
      spec.apiVersion.should.eql('1.2.3');

      spec.should.have.property('swaggerVersion');
      spec.swaggerVersion.should.eql('1.2');

      spec.should.have.property('basePath');
      spec.basePath.should.eql('http://example.org');

      spec.should.have.property('apis');
      spec.apis.should.eql([
        { path: '/test', description: 'description' }
      ]);

      spec.should.have.property('authorizations');
      spec.authorizations.should.eql({ oauth2: 'authorizations-ok' });

      spec.should.not.have.property('found');
      Object.keys(spec).length.should.eql(5);

      done();
    });
  });
});
