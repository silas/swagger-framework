'use strict';

/**
 * Module dependencies.
 */

require('should');

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
          '/test': { options: { path: '/test', description: 'description' }
          },
        },
        setup: function() {},
      });

      var spec = docs.index();

      spec.should.have.property('apiVersion');
      spec.apiVersion.should.eql('1.2.3');

      spec.should.have.property('swaggerVersion');
      spec.swaggerVersion.should.eql('1.2');

      spec.should.have.property('apis');
      spec.apis.should.eql([
        { path: '/test', description: 'description' }
      ]);

      spec.should.have.property('authorizations');
      spec.authorizations.should.eql({ oauth2: 'authorizations-ok' });

      done();
    });
  });
});
