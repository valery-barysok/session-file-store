var helpers = require('../lib/session-file-helpers'),
  chai = require('chai'),
  expect = chai.expect,
  path = require('path');

describe('helpers', function () {
  var options = helpers.defaults();

  describe('#defaults', function () {
    it('should return valid defaults', function () {
      var options = helpers.defaults();
      expect(options).to.exist;
      expect(options).to.have.property('path').that.is.a('string');
      expect(options).to.have.property('ttl').that.be.a('number');
      expect(options).to.have.property('retries').that.be.a('number').and.least(0);
      expect(options).to.have.property('factor').that.be.a('number').and.gt(0);
      expect(options).to.have.property('minTimeout').that.be.a('number').and.gt(0);
      expect(options).to.have.property('maxTimeout').that.be.a('number').and.least(options.minTimeout);
      expect(options).to.have.property('filePattern').that.is.instanceOf(RegExp);
      expect(options).to.have.property('reapInterval').that.be.a('number');
      expect(options).to.have.property('reapWorker').that.be.a('boolean');
    });
  });

  describe('#sessionId', function () {
    it('should return session id when valid json file name is passed', function () {
      var sessionId = helpers.sessionId('id.json');
      expect(sessionId).is.equal('id');
    });

    it('should return no session id when invalid file name is passed', function () {
      var sessionId = helpers.sessionId('id');
      expect(sessionId).is.equal('');
    });
  });

  describe('#sessionPath', function () {
    it('should return session file path when base path and session id are passed', function () {
      var sessionPath = helpers.sessionPath(options.path, 'id');
      expect(sessionPath).to.be.a('string');
      expect(sessionPath).is.equal(path.normalize('sessions/id.json'));
    });
  });

  describe('#length', function () {

    it('should throw exception when no folder exists', function (done) {
      helpers.length(options, function (err, result) {
        expect(err).to.be.ok;
        expect(err).is.an('object');
        expect(err).to.have.property('code').is.equal('ENOENT');
        done();
      });
    });
  });
});
